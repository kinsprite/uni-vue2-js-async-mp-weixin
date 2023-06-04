/* eslint-env node */

/**
 * @typedef {import('@vue/cli-service').ProjectOptions} ProjectOptions
 * @typedef {import('webpack').Plugin} Plugin
 */

const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const SafeChunkIdPlugin = require('./scripts/webpack-plugin/safe-chunk-id-plugin');
const MemoryInfoPlugin = require('./scripts/webpack-plugin/memory-info-plugin');
const MpWxModifyMiniCssExtractPlugin = require('./scripts/webpack-plugin/mp-wx-modify-mini-css-extract-plugin');
const MpWxJsonpScriptPlugin = require('./scripts/webpack-plugin/mp-wx-jsonp-script-plugin');
const MpWxRuntimeTemplatePlugin = require('./scripts/webpack-plugin/mp-wx-runtime-template-plugin');
const MpWxAppJsonAsyncPackagePlugin = require('./scripts/webpack-plugin/mp-wx-app-json-async-package-plugin');
const MpWxAsyncComponentWebpackPlugin = require('./scripts/webpack-plugin/mp-wx-async-component-webpack-plugin');

const enableStats = false;
const enableHardSourceCache = false;
const enableBundleAnalyzer = false;
const enableSpeedMeasure = false;

// 速度分析
const smp = new SpeedMeasurePlugin({
  outputFormat: 'human',
});

const speedMeasureWrap = config => {
  if (enableSpeedMeasure) {
    return smp.wrap(config);
  }

  return config;
};

/** @type {ProjectOptions} */
module.exports = {
  devServer: {
    writeToDisk: true,
  },
  chainWebpack: chainConfig => {

    if (enableStats) {
      chainConfig.plugin('stats-plugin').use(require('webpack-stats-plugin').StatsWriterPlugin, [
        {
          stats: {
            all: true,
          },
        },
      ]);
    }

    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      if (process.env.UNI_PLATFORM === 'h5') {
        chainConfig.devtool('cheap-source-map');
      }
    }
  },
  configureWebpack: webpackConfig => {
    const isProduction = process.env.NODE_ENV === 'production';

    if (process.env.UNI_PLATFORM === 'mp-weixin') {
      webpackConfig.optimization.splitChunks = require('./scripts/webpack-plugin/lib/split-chunks')();

      if (process.env.UNI_OPT_TRACE) {
        const splitChunksJson = JSON.stringify(webpackConfig.optimization.splitChunks, undefined, 2);
        console.log('\nwebpackConfig.optimization.splitChunks:\n', splitChunksJson);
      }

      return speedMeasureWrap({
        plugins: [
          !isProduction && enableHardSourceCache && new HardSourceWebpackPlugin(),
          !isProduction && enableHardSourceCache && new SafeChunkIdPlugin(),
          enableBundleAnalyzer && new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '_bundle-analyzer-report.html',
          }),
          new MemoryInfoPlugin(),
          new MpWxModifyMiniCssExtractPlugin(),
          new MpWxJsonpScriptPlugin(),
          new MpWxRuntimeTemplatePlugin(),
          new MpWxAppJsonAsyncPackagePlugin({
            deleteComponents: ['ec-canvas', 'mp-slideview'],
            lazyCodeLoading: isProduction ? 'requiredComponents' : '',
          }),
          new MpWxAsyncComponentWebpackPlugin(),
        ].filter(Boolean),
      });
    }

    return {};
  },
};
