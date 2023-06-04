<template>
  <view class="content">
    <image class="logo" src="/static/logo.png" />
    <view>
      <text class="title">
        {{ title }}
      </text>
    </view>
  </view>
</template>

<script>
import { myFunc } from './ex';
export default {
  data() {
    return {
      title: 'Hello Sub Page 2',
    };
  },
  onLoad() {},
  async onReady() {
    myFunc(3, 5);

    import('../../common-pkg/abc').then(({ sum }) => {
      const res = sum(30, 50);
      console.log('myFunc sub sum is', res);
    });
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
