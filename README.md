# uni-vue2-js-async-mp-weixin

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).


wx.navigateTo({url: '/pages_sub/index/index'});
wx.navigateTo({url: '/pages_sub/index/index2'});

NOTE: 异步加载配置影响到开发工具加载异步分包的JS，但是，真机上是OK的.
  "lazyCodeLoading": "requiredComponents",
