
import { ex1func } from './e1';

export const myFunc =  (a, b) =>  import('../../common-pkg/abc').then(({sum}) => {
    const res = sum(a, b);
    console.log('myFunc sub sum is', res)
});

export const myEx2 = () => ex1func();


// const sum = (a,b ) => a + b;

// export const myFunc = (a, b) => {
//     const res = sum(a, b);
//     console.log('sum is', res)
// };