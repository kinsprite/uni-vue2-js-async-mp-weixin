
export const getInfo = () => {
  console.log('getInfo in "pkg-use-in-async/async-in-same-chunk"');
  import('./async-in-same-chunk-2').then(({getInfo}) => getInfo());
}
