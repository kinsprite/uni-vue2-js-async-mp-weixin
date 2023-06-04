
export const getInfo = () => {
  console.log('getInfo in "pkg-use-in-main-call-async-js"');

  import('../pkg-use-in-async')
    .then(({ getInfo }) => getInfo())
    .then(() => console.log('getInfo called ../pkg-use-in-async'));
};
