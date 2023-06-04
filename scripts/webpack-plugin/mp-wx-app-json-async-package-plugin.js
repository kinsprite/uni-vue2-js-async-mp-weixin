const { ReplaceSource } = require('webpack-sources');
const { getSourceAsString } = require('./lib/source-helper');

/** @typedef {import("webpack").Compiler} Compiler */
/** @typedef {import("webpack-sources").Source} Source */

const APP_JSON_FILE = 'app.json';

const defaultOptions = {
  appendSubPackages: [], // [{ root: 'verify_mpsdk', pages: [ 'index/index' ] }]
  deleteComponents: [], // ['ec-canvas', 'mp-slideview']
  lazyCodeLoading: undefined, // undefined 或 '' 或 'requiredComponents'
};

/**
 * @param {string} pkgRoot
 * @param {string[]} allAssetKeys
 * @returns {boolean}
 */
const isSubPkgEmitted = (pkgRoot, allAssetKeys) => {
  const pkgRootPath = pkgRoot.endsWith('/') ? pkgRoot : `${pkgRoot}/`;
  return allAssetKeys.findIndex(assetKey => assetKey.indexOf(pkgRootPath) === 0) !== -1;
}

/**
 * @typedef {{oldSource: Source, allAssetKeys: string[], pagesJson: any, options: Record<string, any>}} Params
 *
 * @param {Params} param0
 * @returns {ReplaceSource}
 */
const modifyAppJsonSource = ({ oldSource, allAssetKeys, pagesJson, options }) => {
  const res = new ReplaceSource(oldSource);

  try {
    const oldContent = getSourceAsString(oldSource);
    const appJson = JSON.parse(oldContent);

    // 记录已经存在的分包
    const existedSubPkgs = {};

    appJson.subPackages.forEach(pkg => {
      existedSubPkgs[pkg.root] = true;
    });

    /*
     * 附加appendSubPackages分包（支持原生的分包）
     */
    (options.appendSubPackages || []).forEach(pkg => {
      if (!existedSubPkgs[pkg.root] && pkg.root) {
        appJson.subPackages.push(pkg);
        existedSubPkgs[pkg.root] = true;
      }
    });

    /*
     * 附加没有页面的分包（支持分包异步化）
     */
    const noPageSubPkgs = pagesJson.subPackages.filter(pkg => (pkg.pages || []).length === 0);

    noPageSubPkgs.forEach(pkg => {
      if (!existedSubPkgs[pkg.root] && pkg.root) {
        const newPkg = {
          root: pkg.root,
          pages: [],
        };

        // 复制其它字段
        Object.keys(pkg).forEach(key => {
          if (['root', 'pages'].indexOf(key) === -1) {
            newPkg[key] = pkg[key];
          }
        });

        if (isSubPkgEmitted(pkg.root, allAssetKeys)) {
          appJson.subPackages.push(newPkg);
          existedSubPkgs[pkg.root] = true;
        }
      }
    });

    // 去除全局声明的组件(但缺少实际的文件)：改用使用位置自行引入方案
    (options.deleteComponents || []).forEach(name => delete appJson.usingComponents[name]);

    // 更新 lazyCodeLoading
    if (options.lazyCodeLoading !== undefined) {
      if (options.lazyCodeLoading) {
        appJson.lazyCodeLoading = options.lazyCodeLoading;
      } else {
        delete appJson.lazyCodeLoading;
      }
    }

    res.replace(0, oldContent.length, JSON.stringify(appJson, null, 2));
  } catch (e) {
    console.error('*** app.json: 附加异步分包异常');
  }

  return res;
};

class MpWxAppJsonAsyncPackagePlugin {
  /**
   * @param {} options options object
   */
  constructor(options) {
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * @param {Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.emit.tap('MpWxAppJsonAsyncPackagePlugin', compilation => {
      const appJsonAsset = compilation.getAsset(APP_JSON_FILE);
      const allAssetKeys = compilation.getAssets().map(asset => asset.name);

      if (appJsonAsset) {
        compilation.updateAsset(APP_JSON_FILE, oldSource =>
          modifyAppJsonSource({
            oldSource,
            allAssetKeys,
            pagesJson: process.UNI_PAGES,
            options: this.options,
          }),
        );
      }
    });
  }
}

module.exports = MpWxAppJsonAsyncPackagePlugin;
