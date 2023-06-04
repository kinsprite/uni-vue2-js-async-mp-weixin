
const path = require('path');
const { ReplaceSource } = require('webpack-sources');
const { loadConfigs, loadSubPkgRoots } = require('./lib/async-component-config');
const { globalTagSet } = require('./lib/mp-components');
const { getSourceAsString } = require('./lib/source-helper');

/** @typedef {import("webpack").Compiler} Compiler */
/** @typedef {import("webpack").compilation.Asset} Asset */
/** @typedef {import("webpack").compilation.Compilation} Compilation */
/** @typedef {import("webpack").Logger} Logger */
/** @typedef {import("webpack-sources").Source} Source */

/**
 * @typedef {Record<string, boolean>} SubPkgMap
 *
 * @typedef {{
 *  oldSource: Source,
 *  appendCfg?: Record<string, any>,
 *  subPkgRoots: string[],
 *  distComp: string,
 *  logger: Logger,
 *  compilation: Compilation,
 *  checkCompExist: (distCompPath: string) => boolean,
 * }} MergeCompJsonOptions
 */

const defaultOptions = {};
const configGlob = '**/async.component.json';

const mainPkgRoot = '__main__';

/**
 * @param {string[]} subPkgRoots
 * @param {string} distComp
 * @returns {string}
 */
const getDistCompPkgRoot = (subPkgRoots, distComp) => {
  const idx = subPkgRoots.findIndex(pkgRoot => distComp.startsWith(`${pkgRoot}/`));

  if (idx === -1) {
    return mainPkgRoot;
  }

  return subPkgRoots[idx];
};

/**
 * @param {string} compPath
 * @returns {string}
 */
const getCompDir = compPath => {
  const idx = compPath.lastIndexOf('/');
  return compPath.substring(0, idx);
};

/**
 * @param {string} useCompValue
 * @param {string} relCompDir 在使用的目录
 * @returns {string}
 */
const getUseCompDistPath = (useCompValue, relCompDir) => {
  // 类似 '/components-async/home-sub/xxx'
  if (useCompValue.startsWith('/')) {
    return useCompValue.substring(1);
  }

  // 类似 './xxx' '../xxx' 'abc/efg' 等
  return path.normalize(`${relCompDir}/${useCompValue}`).replace(/\\/g, '/');
};

/**
 *
 * @param {MergeCompJsonOptions} options
 */
const mergeCompJson = options => {
  const { oldSource, appendCfg, subPkgRoots, distComp, compilation, checkCompExist } = options;

  try {
    const oldContent = getSourceAsString(oldSource);
    const compJson = JSON.parse(oldContent);
    let modified = false;

    /**
     * 自动附加 componentPlaceholder
     */
    const relCompDir = getCompDir(distComp);
    const pkgRoot = getDistCompPkgRoot(subPkgRoots, distComp);

    const autoPlaceholders = {};

    // 查找出跨分包引用的组件
    Object.keys(compJson.usingComponents || {}).forEach(useCompKey => {
      const useCompPath = getUseCompDistPath(compJson.usingComponents[useCompKey], relCompDir);
      const useCompPkgRoot = getDistCompPkgRoot(subPkgRoots, useCompPath);

      if (useCompPkgRoot !== pkgRoot && useCompPkgRoot !== mainPkgRoot) {
        autoPlaceholders[useCompKey] = 'view';
        modified = true;
      }
    });

    if (modified) {
      compJson.componentPlaceholder = { ...compJson.componentPlaceholder, ...autoPlaceholders };
    }

    /**
     * 人工附加分包异步化信息
     */
    ['usingComponents', 'componentPlaceholder'].forEach(key => {
      if (appendCfg && appendCfg[key]) {
        compJson[key] = { ...compJson[key], ...appendCfg[key] };
        modified = true;
      }
    });

    if (!modified) {
      return oldSource;
    }

    // 校验 placeHolder 是否有效
    Object.keys(compJson.componentPlaceholder || {}).forEach(key => {
      const placeholder = compJson.componentPlaceholder[key];

      const usingComp = compJson.usingComponents?.[placeholder];

      if (!usingComp) {
        if (globalTagSet.has(placeholder)) {
          // 全局组件
          return;
        }

        throw new Error(`Invalid componentPlaceholder "${key}: ${placeholder}" in component "${distComp}"`);
      }

      // 校验placeHolder必须是同一分包或主包中
      const useCompPath = getUseCompDistPath(usingComp, relCompDir);
      const useCompPkgRoot = getDistCompPkgRoot(subPkgRoots, useCompPath);

      if (useCompPkgRoot !== pkgRoot && useCompPkgRoot !== mainPkgRoot) {
        // 跨分包引用
        throw new Error(`Across sub-package componentPlaceholder "${key}: ${placeholder}" in component "${distComp}"`);
      }

      // 同步placeHolder组件，校验组件存在
      if (!checkCompExist(useCompPath)) {
        throw new Error(`Not exist componentPlaceholder "${key}: ${placeholder}" in component "${distComp}"`);
      }
    });

    const res = new ReplaceSource(oldSource);
    res.replace(0, oldContent.length, JSON.stringify(compJson, null, 2));
    return res;
  } catch (e) {
    compilation.errors.push(e);
  }

  return oldSource;
};


class MpWxAsyncComponentWebpackPlugin {
  /**
    * @param {} options options object
    */
  constructor(options) {
    this.options = { ...defaultOptions, ...options };
    this.configs = {};
  }

  /**
   * @param {Compiler} compiler
   */
  apply(compiler) {
    // const { options } = this;

    const pluginName = this.constructor.name;
    const logger = compiler.getInfrastructureLogger(pluginName);
    const outErrorComps = {};

    this.configs = loadConfigs({
      base: path.join(compiler.context, 'src'),
      pattern: configGlob,
      outErrorComps,
    });

    if (Object.keys(outErrorComps).length) {
      logger.error('Duplicate component defined in async.component.json', Object.keys(outErrorComps));
      throw new Error('Duplicate component defined in async.component.json');
    }

    this.subPkgRoots = loadSubPkgRoots(path.join(compiler.context, 'src/pages.json'));

    compiler.hooks.emit.tap(pluginName, compilation => {
      const dotWXml = '.wxml';
      const checkCompExist = compDistPath => !!compilation.getAsset(compDistPath + dotWXml);

      /** @type {Asset[]} */
      const allAssets = compilation.getAssets();

      /** 小程序组件与页面的路径 */
      const mpComps = allAssets
        .map(asset => asset.name)
        .filter(name => name.endsWith(dotWXml))
        .map(name => name.substring(0, name.length - dotWXml.length));

      mpComps.forEach(distComp => {
        const fileName = `${distComp}.json`;
        const injectJsonAsset = compilation.getAsset(fileName);

        if (injectJsonAsset) {
          compilation.updateAsset(fileName, oldSource => mergeCompJson({
            oldSource,
            appendCfg: this.configs[distComp],
            subPkgRoots: this.subPkgRoots,
            distComp,
            logger,
            compilation,
            checkCompExist,
          }));
        }
      });
    });
  }
}

module.exports = MpWxAsyncComponentWebpackPlugin;
