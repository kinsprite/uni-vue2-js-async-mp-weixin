
export const myFunc = (a, b) => import('../../common-pkg/abc').then(({sum}) => {
    const res = sum(a, b);
    console.log('sum is', res)
});

// const sum = (a,b ) => a + b;

// export const myFunc = (a, b) => {
//     const res = sum(a, b);
//     console.log('sum is', res)
// };