/**
 * @typedef { import('webpack').Options.SplitChunksOptions } SplitChunksOptions
 * @typedef { import('webpack').Options.CacheGroupsOptions } CacheGroupsOptions
 * @typedef { {[key: string]: CacheGroupsOptions } } CacheGroupsMap
 */

const path = require('path');
const { normalizePath } = require('@dcloudio/uni-cli-shared');

function getModuleChunks(module, chunks) {
  // webpack5
  if ('chunkGraph' in chunks) {
    chunks = chunks.chunkGraph.getModuleChunks(module);
  }
  return chunks;
}

function baseTest(module) {
  const getMainPath = () => normalizePath(path.resolve(process.env.UNI_INPUT_DIR, 'main.'));

  if (module.type === 'css/mini-extract') {
    return false;
  }
  if (module.resource) {
    const resource = normalizePath(module.resource);
    if (
      resource.indexOf('.vue') !== -1
      || resource.indexOf('.nvue') !== -1
      || resource.indexOf(getMainPath()) === 0 // main.js
    ) {
      return false;
    }
  }
  return true;
}

/**
 * 严格路径划分模式: 非分包中，全部划分到主包.
 * NOTE: 需配合ESLint插件使用。如果主包同步import分包js，小程序启动失败 -- 依赖模块未加载。
 */
function getSplitChunksStrict() {
  /** @type { CacheGroupsMap } */
  const cacheGroups = {
    default: false,
    vendors: false,
    commons: {
      // 主包 (兜底)
      enforce: true,
      test(module, chunks) {
        if (!baseTest(module)) {
          return false;
        }

        return true;
      },
      name: 'common/vendor',
      chunks: 'all',
      priority: -20,
    },
  };

  process.env.UNI_OPT_SUBPACKAGES
    && Object.keys(process.UNI_SUBPACKAGES).forEach(root => {
      cacheGroups[`${root}/commons`] = {
        enforce: true,
        test(module) {
          if (!baseTest(module)) {
            return false;
          }

          if (!module.resource) {
            return false;
          }
          if (normalizePath(module.resource).includes(`${root}/`)) {
            return true;
          }
          return false;
        },
        name: normalizePath(path.join(root, 'common/vendor')),
        chunks: 'all',
        priority: 0,
      };
    });

  return {
    chunks(chunk) {
      // 防止 node_modules 内 vue 组件被 split
      return chunk.name.indexOf('node-modules') !== 0;
    },
    minSize: 0,
    maxSize: 0,
    minChunks: 1,
    maxAsyncRequests: 5,
    maxInitialRequests: 3,
    automaticNameDelimiter: '~',
    automaticNameMaxLength: 30,
    name: true,
    cacheGroups,
  };
}

/**
 * 兼容模式: 主包中或多分包中共同使用，划分到主包；仅在当前分包中单独依赖，才划分到当前分包.
 * NOTE: 不当使用时，造成主包过大
 */
function getSplitChunksCompat() {
  const subPkgsInfo = Object.values(process.UNI_SUBPACKAGES);
  const normalFilter = ({ independent }) => !independent;
  const independentFilter = ({ independent }) => independent;
  const map2Root = ({ root }) => `${root}/`;
  const normalSubPackageRoots = subPkgsInfo.filter(normalFilter).map(map2Root);
  const independentSubpackageRoots = subPkgsInfo.filter(independentFilter).map(map2Root);
  const subPackageRoots = Object.keys(process.UNI_SUBPACKAGES).map(root => `${root}/`);

  // 未支持 webpackChunkName Magic Comments
  const getSingleAsyncThunkName = function (module, chunks) {
    const resource = (chunks.length === 1 && !(chunks[0].name) && module.resource) || '';

    if (!resource) {
      return '';
    }

    return normalizePath(path.relative(process.env.UNI_INPUT_DIR, resource));
  };

  const findSubPackages = function (module, chunks) {
    const singleAsyncName = getSingleAsyncThunkName(module, chunks);

    return chunks.reduce((pkgs, item) => {
      const name = normalizePath(item.name || singleAsyncName);
      const pkgRoot = normalSubPackageRoots.find(root => name.indexOf(root) === 0);
      pkgRoot && pkgs.add(pkgRoot);
      return pkgs;
    }, new Set());
  };

  const hasMainPackage = function (module, chunks) {
    const singleAsyncName = getSingleAsyncThunkName(module, chunks);
    return chunks.find(item => !subPackageRoots.find(root => (item.name || singleAsyncName).indexOf(root) === 0));
  };

  const hasMainPackageComponent = function (module, subPackageRoot) {
    if (module.resource && module.reasons) {
      for (let index = 0; index < module.reasons.length; index++) {
        const m = module.reasons[index];
        const dependencyType = m.dependency?.type || '';

        if (dependencyType.indexOf('import()') === 0) {
          // 异步 import() 不算依赖
          continue;
        }

        if (m.module && m.module.resource) {
          const resource = normalizePath(m.module.resource);
          if (resource.indexOf('.vue') !== -1 || resource.indexOf('.nvue') !== -1) {
            if (resource.indexOf(subPackageRoot) === -1) {
              if (process.env.UNI_OPT_TRACE) {
                console.log(
                  'move module to main chunk:',
                  module.resource,
                  'from',
                  subPackageRoot,
                  'for component in main package:',
                  resource,
                );
              }

              // 独立分包除外
              const independentRoot = independentSubpackageRoots.find(root => resource.indexOf(root) >= 0);
              if (!independentRoot) {
                return true;
              }
            }
          } else {
            return hasMainPackageComponent(m.module, subPackageRoot);
          }
        }
      }
    }
    return false;
  };

  /** @type { CacheGroupsMap } */
  const cacheGroups = {
    default: false,
    vendors: false,
    commons: {
      // 主包 (兜底)
      enforce: true,
      test(module, chunks) {
        if (!baseTest(module)) {
          return false;
        }

        chunks = getModuleChunks(module, chunks);
        const matchSubPackages = findSubPackages(module, chunks);
        const matchSubPackagesCount = matchSubPackages.size;
        const isMainPackage = ( // 非分包 或 两个及以上分包 或 主包内有使用
          matchSubPackagesCount === 0
          || matchSubPackagesCount > 1
          || (
            matchSubPackagesCount === 1
            && hasMainPackage(module, chunks)
          )
          || (
            matchSubPackagesCount === 1
            && hasMainPackageComponent(module, matchSubPackages.values().next().value)
          )
        );
        if (isMainPackage && process.env.UNI_OPT_TRACE) {
          console.log('main', module.resource, chunks.map(chunk => chunk.name));
        }
        return isMainPackage;
      },
      name: 'common/vendor',
      chunks: 'all',
      priority: -20,
    },
  };

  process.env.UNI_OPT_SUBPACKAGES
    && Object.keys(process.UNI_SUBPACKAGES).forEach(root => {
      cacheGroups[`${root}/commons`] = {
        enforce: true,
        test(module, chunks) {
          if (!baseTest(module)) {
            return false;
          }

          chunks = getModuleChunks(module, chunks);
          const matchSubPackages = findSubPackages(module, chunks);

          if (
            matchSubPackages.size === 1
            && matchSubPackages.has(`${root}/`)
            && !hasMainPackage(module, chunks)
            && !hasMainPackageComponent(module, matchSubPackages.values().next().value)
          ) {
            if (process.env.UNI_OPT_TRACE) {
              console.log(
                root,
                module.resource,
                chunks.map(chunk => chunk.name),
              );
            }

            return true;
          }

          return false;
        },
        name: normalizePath(path.join(root, 'common/vendor')),
        chunks: 'all',
        priority: 0,
      };
    });

  return {
    chunks(chunk) {
      // 防止 node_modules 内 vue 组件被 split
      return chunk.name.indexOf('node-modules') !== 0;
    },
    minSize: 0,
    maxSize: 0,
    minChunks: 1,
    maxAsyncRequests: 5,
    maxInitialRequests: 3,
    automaticNameDelimiter: '~',
    automaticNameMaxLength: 30,
    name: true,
    cacheGroups,
  };
}

/**
 * @param {boolean} [strict] 是否使用严格路径分包
 * @returns {SplitChunksOptions}
 */
module.exports = function getSplitChunks(strict) {
  if (strict) {
    return getSplitChunksStrict();
  }

  return getSplitChunksCompat();
};
