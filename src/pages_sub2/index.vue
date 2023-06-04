<template>
  <view class="content">
    <view>
      <text class="title">
        {{ title }}
      </text>
    </view>
  </view>
</template>

<script>
import { runCrossPkgs } from '@/pages_sub/index/cross-pkgs';
import { getInfoSync2 } from '@/async/pkg-use-in-two-sub-pkgs/sync-import';

export default {
  data() {
    return {
      title: 'Hello Sub 2 Page index',
    };
  },
  onLoad() {},
  async onReady() {
    runCrossPkgs('pages sub 2');

    import('@/async/pkg-use-in-main-and-two-sub-pkgs').then(({ getInfo }) => getInfo());
    import('@/async/pkg-use-in-two-sub-pkgs').then(({ getInfo }) => getInfo());

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
