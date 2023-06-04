module.exports = {
  root: true,
  env: {
    "browser": true,
    "commonjs": true
  },
  extends: [
    // add more generic rulesets here, such as:
    'eslint:recommended',
    // 'plugin:vue/vue3-recommended',
    'plugin:vue/recommended' // Use this if you are using Vue.js 2.x.
  ],
  rules: {
    // override/add rules settings here, such as:
    'no-unused-vars': 'warn',
    'vue/no-unused-vars': 'warn',
  }
}
