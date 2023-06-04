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
      <button @click="onClickMe">
        Click me
      </button>
      <button @click="onClickSubPage1">
        SubPkg 1, Page 1
      </button>
      <button @click="onClickSubPage2">
        SubPkg 1, Page 2
      </button>
      <button @click="onClickSubPage3">
        SubPkg 2, Page 1
      </button>
    </view>
    <Sk ref="mySkRef" />
    <SkeletonHome ref="mySkHomeRef" />
  </view>
</template>

<script>
import { myFunc } from './ex';
import SkeletonHome from './components/skeletonHome.vue';
import Sk from '@/async/pkg-1/sk.vue';
import { runUseInMain } from '@/pages_sub/index/use-in-main';
import { getInfoSync1 } from '@/async/pkg-use-in-main-and-one-sub-pkg/sync-import'

export default {
  components: {
    SkeletonHome,
    Sk,
  },
  data() {
    return {
      title: 'Hello',
    };
  },
  onLoad() {
    this.$safeRef('myViewRef').then(v => console.log('### safeRef then myViewRef', v));
    this.$safeRef('mySkRef').then(v => console.log('### safeRef then mySkRef', v));
    this.$safeRef('mySkHomeRef').then(v => console.log('### safeRef then mySkHomeRef', v));
  },
  async onReady() {
    import('@/async/pkg-use-in-main-and-one-sub-pkg').then(({ getInfo }) => getInfo());
    import('@/async/pkg-use-in-main-and-two-sub-pkgs').then(({ getInfo }) => getInfo());
    import('@/async/pkg-use-in-main-call-async-js').then(({ getInfo }) => getInfo());
    import('@/async/pkg-use-in-main-only').then(({ getInfo }) => getInfo());

    getInfoSync1();
  },
  methods: {
    onClickMe() {
      runUseInMain('in pages/index/index');
      myFunc(3, 5);
    },
    onClickSubPage1() {
      uni.navigateTo({ url: '/pages_sub/index/index' });
    },
    onClickSubPage2() {
      uni.navigateTo({ url: '/pages_sub/index/index2' });
    },
    onClickSubPage3() {
      uni.navigateTo({ url: '/pages_sub2/index' });
    },
  },
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
