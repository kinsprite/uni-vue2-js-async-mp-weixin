class MemoryInfoPlugin {
  apply(compiler) {
    compiler.plugin('done', () => {
      console.log('Memory info:', require('util').inspect(process.memoryUsage()));
    });
  }
}

module.exports = MemoryInfoPlugin;
