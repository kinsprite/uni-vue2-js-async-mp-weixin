
// 官方组件，来源于 https://developers.weixin.qq.com/miniprogram/dev/component/
const officialTagList = [
  // 视图容器
  'cover-image', 'cover-view', 'grid-view', 'sticky-section', 'list-view', 'sticky-section',
  'match-media', 'movable-area', 'movable-view', 'movable-view', 'page-container', 'root-portal',
  'scroll-view', 'share-element', 'sticky-header', 'sticky-section', 'sticky-section',
  'swiper', 'swiper-item', 'swiper', 'view',

  // 基础内容
  'icon', 'progress', 'rich-text', 'text',

  // 表单组件
  'button', 'checkbox', 'checkbox-group', 'checkbox', 'editor',
  'form', 'input', 'keyboard-accessory', 'label', 'picker', 'picker-view', 'picker-view-column',
  'radio', 'radio-group', 'radio', 'slider', 'switch', 'textarea',

  // 导航
  'functional-page-navigator', 'navigator',

  // 媒体组件
  'audio', 'camera', 'channel-live', 'channel-video', 'image', 'live-player', 'live-pusher', 'video', 'voip-room',

  // 地图
  'map',

  // 画布
  'canvas',

  // 开放能力
  'web-view', 'ad', 'ad-custom', 'official-account', 'open-data',

  // 原生组件说明
  'native-component',

  // 无障碍访问
  'aria-component',

  // 导航栏
  'navigation-bar',

  // 页面属性配置节点
  'page-meta',
];

// 本地全局组件，来源于 src/route.pages.js > globalStyle.usingComponents
const localGlobalTagList = Object.keys(process.UNI_PAGES.globalStyle.usingComponents || {});

const globalTagSet = new Set(officialTagList.concat(localGlobalTagList));

module.exports = {
  officialTagList,
  localGlobalTagList,
  globalTagSet,
};
