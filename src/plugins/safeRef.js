/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */

/**
 * Vue实例提供 $safeRef(key: string) 函数.
 *
 * NOTE 1: 忽略占位符自定义组件（支持Vue与原生组件）。在占位符自定义组件中，定义成员函数。
 *   {
 *     method: {
 *       __safeRef_skip() { return true }
 *     }
 *   }
 *
 */

const enableLog = true;
const skipKey = '__safeRef_skip';

const isSkip = vm => {
  const skip = vm?.[skipKey];

  if (typeof skip === 'function') {
    return !!skip.call(vm);
  }

  return !!skip;
}

const getSafeRefKey = vm => {
  if (vm?.mpType !== 'component' || isSkip(vm)) {
    return undefined;
  }

  return vm?.$scope?.dataset?.ref;
};

export default {
  /**
   * @param {import('vue')} Vue
   */
  install(Vue) {
    Vue.prototype.__safeRef_cb = function safeRefCb(key, value) {
      enableLog && console.log('### safeRefCb', key, value);
      const obj = this.__safeRef_map?.[key];

      if (obj) {
        if (value) {
          obj.resolve?.(value);
        }

        delete this.__safeRef_map[key];
      }
    };

    Vue.prototype.__safeRef_emit = function safeRefEmit(isSet) {
      const key = getSafeRefKey(this);

      if (key) {
        this.$parent?.__safeRef_cb?.(key, isSet ? this : undefined);
      }
    }

    Vue.prototype.__safeRef_ensure = function safeRefEnsure(key) {
      if (!this.__safeRef_map) {
        this.__safeRef_map = {};
      }

      const map = this.__safeRef_map;

      if (map[key]) {
        return map[key].promise;
      }

      const obj = {};

      obj.promise = new Promise((resolve, reject) => {
        obj.resolve = resolve;
        obj.reject = reject;
      });

      map[key] = obj;
      return obj.promise;
    };

    Vue.prototype.$safeRef = function safeRef(key) {
      const refs = this.$refs.__original$refs__ || {};

      if (refs[key] && !isSkip(refs[key])) {
        enableLog && console.log('### safeRef [sync]', key);
        return Promise.resolve(refs[key]);
      }

      enableLog && console.log('### safeRef [async]', key);
      return this.__safeRef_ensure(key);
    };

    // 子组件生命周期中，向父组件提交Ref
    Vue.mixin({
      created() {
        this.__safeRef_emit(true);
      },
      beforeDestroy() {
        this.__safeRef_emit(false);
      },
    });
  },
};
