/**
 * @typedef {{ from: string | RegExp; to: string | ((...args) => string) }} Replacer
 *
 * @param {string} input
 * @param {Replacer[]} replacers
 * @param {boolean} strict
 */
const stringReplace = (input, replacers, strict) => {
  let res = input;

  replacers.forEach(({ from, to }) => {
    if (strict) {
      if (typeof from === 'string') {
        if (res.indexOf(from) === -1) {
          throw new Error(`can't find replacer.from string: "${from}"`);
        }
      } else if (res.search(from) === -1) {
        throw new Error(`can't find replacer.from regex: "${from.toString()}"`);
      }
    }

    res = res.replace(from, to);
  });

  return res;
};

module.exports = {
  stringReplace,
};
