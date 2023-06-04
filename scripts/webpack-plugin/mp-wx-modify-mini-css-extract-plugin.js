const { getSourceAsString } = require('./lib/source-helper');

const miniCssExtractTapName = 'mini-css-extract-plugin';
const runtimeAssetId = 'common/runtime.js';

function removeTapFromHook(hook, tapName) {
  const index = hook.taps.findIndex(tap => tap.name === tapName);

  if (index > -1) {
    hook.taps.splice(index, 1);
    // eslint-disable-next-line no-underscore-dangle
    hook._resetCompilation();
  }
}

class MpWxModifyMiniCssExtractPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('MpWxModifyMiniCssExtractPlugin', compilation => {
      const { localVars, requireEnsure } = compilation.mainTemplate.hooks;
      // webpack v4 only
      removeTapFromHook(localVars, miniCssExtractTapName);
      removeTapFromHook(requireEnsure, miniCssExtractTapName);
    });

    compiler.hooks.emit.tap('MpWxModifyMiniCssExtractPlugin', compilation => {
      try {
        const runtimeAsset = compilation.getAsset(runtimeAssetId);

        // check CSS runtime removed
        if (getSourceAsString(runtimeAsset.source).includes('document.getElementsByTagName')) {
          throw new Error('Found CSS lazy loading\'s runtime');
        }
      } catch (e) {
        compilation.errors.push(e);
      }
    });
  }
}

module.exports = MpWxModifyMiniCssExtractPlugin;
