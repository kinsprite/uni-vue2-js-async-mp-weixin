<script>
	export default {
		onLaunch: function() {
			console.log('App Launch');
			wx.onLazyLoadError(res => {
				console.info('onLazyLoadError', res);
			})
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
	@import url('@/styles/common.less');
</style>
