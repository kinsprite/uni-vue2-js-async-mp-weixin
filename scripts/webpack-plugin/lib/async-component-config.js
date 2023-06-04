
const path = require('path');
const glob = require('glob');
const merge = require('lodash/merge');

/**
 * 加载所有分包异步化的配置
 * @typedef {{
 *   usingComponents: Record<string, string>,
 *   componentPlaceholder: Record<string, string>
 * }} CompConfig
 *
 * @param {{base: string, pattern: string}} param0
 * @returns {Record<string, CompConfig>}
 */
const loadConfigs = ({ base, pattern, outErrorComps }) => {
  // console.log('pattern', base, pattern);

  /**
   * @type {Record<string, CompConfig>}
   */
  const res = {};

  // 用 cwd 才兼容 windows
  const files = glob.sync(pattern, { cwd: base, absolute: true });

  // console.log('configFiles', files);

  files.forEach(file => {
    const cfgData = require(file) || {};
    const localDir = path.dirname(file);
    const distDir = path.relative(base, localDir).replace(/\\/g, '/');


    Object.keys(cfgData).forEach(localCmp => {
      const distComp = `${distDir}/${localCmp}`;

      const oldValue = res[distComp];

      if (oldValue && outErrorComps) {
        // eslint-disable-next-line no-param-reassign
        outErrorComps[distComp] = true;
      }

      res[distComp] = merge(oldValue || {}, cfgData[localCmp]);
    });
  });

  // console.log('res', res);
  return res;
};

/**
 * @param {string} pagesJsonPath
 * @returns {string[]}
 */
const loadSubPkgRoots = pagesJsonPath => {
  const pagesJson = require(pagesJsonPath);
  return pagesJson.subPackages.map(pkg => pkg.root);
};

exports.loadConfigs = loadConfigs;
exports.loadSubPkgRoots = loadSubPkgRoots;
