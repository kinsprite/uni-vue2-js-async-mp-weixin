
export const getInfo = () => {
  console.log('getInfo in "pkg-use-in-async"');

  import('./async-in-same-chunk').then(({getInfo}) => getInfo());
}

export const getInfo2 = () => {
  console.log('getInfo in "pkg-use-in-async"');

  import('./async-in-same-chunk').then(({getInfo}) => getInfo());
  import('./async-in-same-chunk-2').then(({getInfo}) => getInfo());
}
