class SafeChunkIdPlugin {
  apply(compiler) {
    const safeChunkIdMax = 100000;

    compiler.plugin('compilation', compilation => {
      compilation.plugin('optimize-chunk-order', () => {
        if (compilation.usedChunkIds) {
          const usedChunkIds = {};

          Object.keys(compilation.usedChunkIds).forEach(key => {
            if (compilation.usedChunkIds[key] < safeChunkIdMax) {
              usedChunkIds[key] = compilation.usedChunkIds[key];
            }
          });

          compilation.usedChunkIds = usedChunkIds;
        }
      });
    });
  }
}

module.exports = SafeChunkIdPlugin;
