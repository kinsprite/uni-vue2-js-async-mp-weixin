const path = require('path');
const replaceInFile = require('replace-in-file');
const { stringReplace } = require('./lib/string');

const fixUniMpWeixinFile = ({ fileName, processor }) => {
  replaceInFile({
    files: path.resolve(process.cwd(), 'node_modules/@dcloudio', fileName),
    processor,
  });
};


/**
 * @param {string} input
 * @param {boolean} strict
 */
const processSelectAsyncComponentRef = (input, strict) => {
  const replacers = [
    {
      from: /const components = mpInstance\.selectAllComponents\(selector\)( \|\| \[\])?;/,
      to: 'const components = (mpInstance.selectAllComponents(selector) || []).filter(Boolean);',
    },
    {
      from: 'component.selectAllComponents(\'.scoped-ref\').forEach(',
      to: '(component.selectAllComponents(\'.scoped-ref\') || []).filter(Boolean).forEach(',
    },
    {
      from: /const forComponents = mpInstance\.selectAllComponents\('\.vue-ref-in-for'\)( \|\| \[\])?;/,
      to: 'const forComponents = (mpInstance.selectAllComponents(\'.vue-ref-in-for\') || []).filter(Boolean);',
    },
    {
      from: /return (?<oldReturn>syncRefs\(refs, \$refs\)|\$refs)/,
      to: (...args) => {
        const group = args[args.length - 1];
        const { oldReturn } = group;

        if (!oldReturn) {
          throw new Error('patch Vue.$ref fail, missing old return value');
        }

        return `
      return new Proxy(${oldReturn}, {
        get(target, prop) {
          if (prop === '__original$refs__') {
            return target;
          }

          if (!target[prop]) {
            vm?.$onHandleMissingVueRef?.(prop);
          }

          return target[prop];
        }
      });`;
      },
    },
  ];

  return stringReplace(input, replacers, strict);
};

/**
 * @param {string} input
 * @param {boolean} strict
 */
const processGenerateComponent = (input, strict) => {
  const replacers = [
    {
      from: 'const chunkName = name.replace(\'.js\', \'-create-component\')',
      to: 'const chunkName = `_mp$c_${curComponents.length}`',
    },
    {
      from: '\'${chunkName}\',',
      to: '[\'${chunkName}\'],',
    },
  ];

  return stringReplace(input, replacers, strict);
};

/**
 * @param {string} input
 * @param {boolean} strict
 */
const processLocalComponents = (input, strict) => {
  const replacers = [
    {
      from: '\'var IMPORT_NAME = function(){require.ensure([],()=>resolve(require(IMPORT_SOURCE)),CHUNK_NAME)}\'',
      // mp-weixin 中，不能执行在别的位置执行 Component() 函数，只添加lazy依赖，避免无法生成独立组件
      to: '\'var IMPORT_NAME = function(){ __webpack_pp_remove_begin__; require.ensure([],()=>void(require(IMPORT_SOURCE)),CHUNK_NAME); __webpack_pp_remove_end__; }\'',
    },
  ];

  return stringReplace(input, replacers, strict);
};

const isStrictReplace = !!process.env.CI_STRICT_STRING_REPLACE;

fixUniMpWeixinFile({
  fileName: 'uni-mp-weixin/dist/index.js',
  processor: s => processSelectAsyncComponentRef(s, isStrictReplace),
});

fixUniMpWeixinFile({
  fileName: 'webpack-uni-mp-loader/lib/plugin/generate-component.js',
  processor: s => processGenerateComponent(s, isStrictReplace),
});

fixUniMpWeixinFile({
  fileName: 'webpack-uni-mp-loader/lib/babel/plugin-dynamic-import.js',
  processor: s => processLocalComponents(s, isStrictReplace),
});
