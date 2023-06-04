/**
 *
 * @param {import('webpack-sources').Source} source
 * @returns {string}
 */
const getSourceAsString = source => {
  let content = source.source();

  if (Buffer.isBuffer(content)) {
    content = content.toString();
  }

  return content;
};

module.exports = {
  getSourceAsString,
};
