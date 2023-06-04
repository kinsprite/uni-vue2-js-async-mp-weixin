<template>
  <view class="mps-home-content-skeleton">
    <view>
      <view class="mps-contract-list-skeleton2-item">
        <view class="mps-contract-list-skeleton2-box">
          <view
            class="mps-contract-list-skeleton2-left"
            style="width: 334rpx; height: 280rpx"
          />
          <view
            class="mps-contract-list-skeleton2-right"
            style="width: 334rpx; height: 280rpx"
          />
        </view>
        <view class="mps-contract-list-skeleton2-box">
          <view
            class="mps-contract-list-skeleton2-left"
            style="width: 420rpx; height: 184rpx"
          />
          <view
            class="mps-contract-list-skeleton2-right"
            style="width: 250rpx; height: 184rpx"
          />
        </view>
        <view class="mps-contract-list-skeleton2-box">
          <view class="mps-contract-list-skeleton2-left" />
        </view>
        <view class="mps-contract-list-skeleton2-box">
          <view
            class="mps-contract-list-skeleton2-left"
            style="width: 100vw; height: 136rpx"
          />
        </view>
        <view class="mps-contract-list-skeleton2-box">
          <view
            class="mps-contract-list-skeleton2-left"
            style="width: 100vw; height: 152rpx"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<script>

export default {
  onReady() {
    console.log('--- Skeleton home: onReady')
  },
  methods: {
    __safeRef_skip: function () {
      return false;
    }
  }
}
</script>


<style lang="less">
.mps-home-content-skeleton {
  position: relative;
}

/* 收据列表骨架屏处理 */
.mps-contract-list-skeleton2-item {
  background-color: unset;
  padding: 0rpx;
  margin-bottom: 0rpx;
  position: relative;
}

.mps-contract-list-skeleton2-box {
  width: 100%;
  margin-top: 0rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32rpx;
}

.mps-contract-list-skeleton2-left {
  height: 32rpx;
  width: 200rpx;
  background-image: linear-gradient(90deg, #f4f3f4, rgba(255, 255, 255), #f4f3f4);
  background-size: 400% 100%;
  animation: mps-contract-move2 2.6s 0.2s ease infinite;
  border-radius: 6rpx;
}

.mps-contract-list-skeleton2-right {
  height: 32rpx;
  width: 200rpx;
  background-image: linear-gradient(90deg, #f4f3f4, rgba(255, 255, 255), #f4f3f4);
  background-size: 400% 100%;
  animation: mps-contract-move2 2.6s 0.6s ease infinite;
  border-radius: 6rpx;
}

@keyframes mps-contract-move2 {
  0% {
    background-position: 100% 50%;
  }

  20% {
    background-position: 0 50%;
  }

  100% {
    background-position: 0 50%;
  }
}
</style>
