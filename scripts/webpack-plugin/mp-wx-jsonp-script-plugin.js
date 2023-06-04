/* eslint-disable quotes */
/* eslint-disable arrow-body-style */
const { SyncWaterfallHook } = require('tapable');
const Template = require('webpack/lib/Template');

class MpWxJsonpScriptPlugin {
  constructor(options) {
    this.options = options || {};
  }
  apply(compiler) {
    compiler.hooks.compilation.tap('MpWxJsonpScriptPlugin', compilation => {
      const { mainTemplate } = compilation;

      mainTemplate.hooks.jsonpScript = new SyncWaterfallHook(['source', 'chunk', 'hash']);

      mainTemplate.hooks.jsonpScript.tap('MpWxJsonpScriptPlugin', (_, chunk, hash) => {
        return Template.asString([
          '// create error before stack unwound to get useful stacktrace later',
          'var error = new Error();',
          'var onScriptComplete = function (event) {',
          Template.indent([
            'var chunk = installedChunks[chunkId];',
            'if(chunk !== 0) {',
            Template.indent([
              'if(chunk) {',
              Template.indent([
                "var errorType = (event && event.type) || 'missing';",
                "var errorMsg = (event && event.errMsg) || 'missing error message';",
                "error.message = 'Loading chunk ' + chunkId + ' failed.\\n' + errorMsg;",
                "error.name = 'ChunkLoadError';",
                'error.type = errorType;',
                'chunk[1](error);',
              ]),
              '}',
              'installedChunks[chunkId] = undefined;',
            ]),
            '}',
          ]),
          '};',
          // 动态加载模块的路径，必需相对于 common/runtime.js
          `require('../' + chunkId + '.js', function () {`,
          Template.indent([
            `console.log('require async OK, chunkId: ' + chunkId);`,
            `onScriptComplete({type: 'callback', errMsg: 'require async OK'});`,
          ]),
          `}, function (err) {`,
          Template.indent([
            `console.log('require async ERROR, chunkId: ' + chunkId);`,
            `onScriptComplete({type: 'error', errMsg: err && err.errMsg});`,
          ]),
          `});`,
        ]);
      });

      mainTemplate.hooks.requireEnsure.tap('MpWxJsonpScriptPlugin load', (source, chunk, hash) => {
        return Template.asString([
          source.replace('document.head.appendChild(script);', ''),
        ]);
      });
    });
  }
}

module.exports = MpWxJsonpScriptPlugin;
