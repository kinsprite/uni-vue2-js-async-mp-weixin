<template>
  <view class="content">
    <image
      class="logo"
      src="/static/logo.png"
    />
    <view>
      <text class="title">
        {{ title }}
      </text>
    </view>
    <Sk ref="mySkRefSub" />
  </view>
</template>

<script>
import Sk from '@/async/pkg-1/sk.vue';
import { myFunc, myEx2 } from './ex';
import { runUseInMain } from './use-in-main';
import { runCrossPkgs } from './cross-pkgs';
import { getInfoSync1 } from '@/async/pkg-use-in-main-and-one-sub-pkg/sync-import';
import { getInfoSync2 } from '@/async/pkg-use-in-two-sub-pkgs/sync-import';

export default {
  components: {
    Sk,
  },
  data() {
    return {
      title: 'Hello Sub Page 1',
    };
  },
  onLoad() {},
  async onReady() {
    runUseInMain('in pages_sub/index');
    runCrossPkgs('in pages_sub/index');
    myFunc(3, 5);
    myEx2();

    import('@/async/pkg-use-in-main-and-one-sub-pkg').then(({ getInfo }) => getInfo());
    import('@/async/pkg-use-in-main-and-two-sub-pkgs').then(({ getInfo }) => getInfo());
    import('@/async/pkg-use-in-one-sub-pkg').then(({ getInfo }) => getInfo());
    import('@/async/pkg-use-in-two-sub-pkgs').then(({ getInfo }) => getInfo());

    getInfoSync1();
    getInfoSync2();
  },
  methods: {},
};
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin: 200rpx auto 50rpx auto;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}
</style>
