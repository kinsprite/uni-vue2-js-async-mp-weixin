const { ReplaceSource } = require('webpack-sources');
const { getSourceAsString } = require('./lib/source-helper');

const relativeThunkPath = (curThunkId, targetThunkId) => {
  const parentDirCount = `${curThunkId}`.split('/').length - 1;
  let relPrefix = '';

  for (let i = 0; i < parentDirCount; i += 1) {
    relPrefix += '../';
  }

  return `${relPrefix + targetThunkId}.js`;
};

const hasInArray = (arr, val) => {
  for (let i = 0; i < arr.length; i += 1) {
    if (arr[i] === val) {
      return true;
    }
  }

  return false;
};

// eslint-disable-next-line arrow-body-style
const getEntryInfo = chunk => {
  return [chunk.entryModule].filter(Boolean).map(m =>
    // eslint-disable-next-line function-paren-newline, implicit-arrow-linebreak
    [m.id].concat(
      Array.from(chunk.groupsIterable)[0]
        .chunks.filter(c => c !== chunk)
        .map(c => c.id)));
};

class MpWxRuntimeTemplatePlugin {
  constructor(options) {
    const defaultOptions = { sourceMap: true, chunkFilter: () => true };
    this.options = { ...defaultOptions, ...options };
  }

  apply(compiler) {
    compiler.hooks.compilation.tap({ name: 'MpWxRuntimeTemplatePlugin' }, compilation => {
      compilation.chunkTemplate.hooks.render.tap({ name: 'MpWxRuntimeTemplatePlugin', stage: 1 }, (source, chunk) => {
        this.checkChunkDependencies(compilation, chunk);
        return source;
      });

      compilation.hooks.optimizeChunkAssets.tapAsync(
        { name: 'MpWxRuntimeTemplatePlugin', stage: -1 }, // -1, before 'terser-webpack-plugin'
        (chunks, callback) => this.optimizeChunkAssetsFn(compilation, chunks, callback),
      );

      this.modifyRuntimeTemplate(compilation.runtimeTemplate);
    });
  }

  modifyRuntimeTemplate(runtimeTemplate) {
    // 处理import(): 替换'__webpack_require__.e'到'__webpack_pp_require_async__'
    runtimeTemplate.blockPromise = ({ block, message }) => {
      if (!block || !block.chunkGroup || block.chunkGroup.chunks.length === 0) {
        const comment = runtimeTemplate.comment({
          message,
        });
        return `Promise.resolve(${comment.trim()})`;
      }

      const chunks = block.chunkGroup.chunks.filter(chunk => !chunk.hasRuntime() && chunk.id !== null);
      const comment = runtimeTemplate.comment({
        message,
        chunkName: block.chunkName,
        chunkReason: block.chunkReason,
      });

      if (chunks.length === 1) {
        const { module } = block;
        const isSameThunk = module && hasInArray(module.blocks, block)
          && module.getNumberOfChunks() === 1 && hasInArray(module.getChunks(), chunks[0]);

        if (isSameThunk) {
          return `Promise.resolve(${comment.trim()})`;
        }

        const chunkId = JSON.stringify(chunks[0].id);
        return `__webpack_pp_require_async__(${comment}${chunkId})`;
      }

      if (chunks.length > 0) {
        const requireChunkId = chunk => {
          const chunkId = JSON.stringify(chunk.id);
          return `__webpack_pp_require_async__(${chunkId})`;
        };

        return `Promise.all(${comment.trim()}[${chunks.map(requireChunkId).join(', ')}])`;
      }

      return `Promise.resolve(${comment.trim()})`;
    };
  }

  findSubPackageRoot(thunkId) {
    if (!this.subPackageRoots) {
      this.subPackageRoots = Object.keys(process.UNI_SUBPACKAGES).map(root => `${root}/`);
    }

    return this.subPackageRoots.find(root => thunkId.indexOf(root) === 0);
  }

  // 校验chunk的依赖关系
  checkChunkDependencies(compilation, chunk) {
    try {
      // entries格式: [[25,"common/runtime","pages_sub/common/vendor","common/vendor"]]
      const entries = getEntryInfo(chunk);
      let depIds = [];

      for (let i = 0; i < entries.length; i++) {
        const deferredModule = entries[i];
        for (let j = 1; j < deferredModule.length; j++) {
          depIds.push(deferredModule[j]);
        }
      }

      // 只允许主包 'common/runtime' 'common/vendor', 当前分包 'xxx-sub-pkg/common/vendor'
      depIds = depIds.filter(depId => !['common/runtime', 'common/vendor'].includes(depId));

      if (depIds.length) {
        const thunkPkgRoot = this.findSubPackageRoot(chunk.id);

        depIds.forEach(depId => {
          const depPkgRoot = this.findSubPackageRoot(depId);

          if (depPkgRoot !== thunkPkgRoot) {
            throw new Error(`The thunk is not allow to have cross subPackages dependencies, ${JSON.stringify(chunk.id)} -> ${JSON.stringify(depId)}`);
          }
        });
      }

      // prefetchChunks格式: undefined 或 ['xxx-sub-pkg/common/vendor', ...]
      const prefetchChunks = chunk.getChildIdsByOrders().prefetch || '';

      if (prefetchChunks && prefetchChunks.length) {
        throw new Error(`Prefetch is not supported in mp-weixin, but prefetchChunks found ${JSON.stringify(prefetchChunks)}`);
      }
    } catch (e) {
      compilation.errors.push(e);
    }
  }

  // 处理 '__webpack_pp_' 开头的代码
  optimizeChunkAssetsFn(compilation, chunks, callback) {
    const { /* sourceMap, */ chunkFilter } = this.options;

    Array.from(chunks)
      .filter(chunk => chunkFilter && chunkFilter(chunk))
      .reduce((acc, chunk) => acc.concat(chunk.files || []), [])
      .concat(compilation.additionalChunkAssets || [])
      .filter(file => `${file}`.endsWith('.js'))
      .forEach(assetName => {
        try {
          const oldSource = compilation.assets[assetName];
          let oldContent = getSourceAsString(oldSource);

          if (oldContent.indexOf('__webpack_pp_') !== -1) {
            if (process.env.UNI_OPT_TRACE) {
              console.log('Runtime plugin modify:', assetName);
            }

            const newSourceAsync = new ReplaceSource(oldSource);
            // eslint-disable-next-line
            const regexAsync = /(?<requireAsync>__webpack_pp_require_async__)\((?<comment>\/\*.+?\*\/\s?)?"(?<thunkId>.+?)"\)/dg;

            for (const res of oldContent.matchAll(regexAsync)) {
              const match = res[0];
              const { indices, groups } = res;
              const { comment = '', thunkId } = groups;
              const { requireAsync: requireAsyncIndices, thunkId: thunkIdIndices } = indices.groups;

              if (!thunkId) {
                throw new Error(`missing thunkId in "${thunkId}"`);
              }

              if (process.env.UNI_OPT_TRACE) {
                console.log('thunkIdReplacer', match, comment, thunkId);
              }

              const thunkPath = relativeThunkPath(assetName, thunkId);

              newSourceAsync.replace(requireAsyncIndices[0], requireAsyncIndices[1] - 1, 'require.async');
              newSourceAsync.replace(thunkIdIndices[0], thunkIdIndices[1] - 1, thunkPath);
            }

            oldContent = getSourceAsString(newSourceAsync);

            const newSourceRemove = new ReplaceSource(newSourceAsync);
            // eslint-disable-next-line
            const regexRemove = /{(?<body>\s*__webpack_pp_remove_begin__[\s\S]*?__webpack_pp_remove_end__;?\s*)}/dg;

            for (const res of oldContent.matchAll(regexRemove)) {
              const { indices } = res;
              const { body: bodyIndices } = indices.groups;
              newSourceRemove.replace(bodyIndices[0], bodyIndices[1] - 1, '');
            }

            const newContent = getSourceAsString(newSourceRemove);

            if (newContent.indexOf('__webpack_pp_') !== -1) {
              throw new Error(`replace __webpack_pp_... in "${assetName}" FAIL`);
            }

            compilation.updateAsset(assetName, newSourceRemove);
          }
        } catch (e) {
          compilation.errors.push(e);
        }
      });

    callback();
  }
}

module.exports = MpWxRuntimeTemplatePlugin;
