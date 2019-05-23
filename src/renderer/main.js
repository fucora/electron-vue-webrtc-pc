import Vue from 'vue'
import Vuex from 'vuex'
import VueCookies from 'vue-cookies'
import store from './store'
import axios from 'axios'
import VueAxios from 'vue-axios'
// import Electron from 'electron'
import App from './App.vue'
import router from './router'
import 'font-awesome/css/font-awesome.min.css'
import { post, get, patch, put, _delete } from './server/axios'
import * as filters from './filters'
import * as directives from './directives'
import { Hint, boxNotification } from './config/messagebox';


//定义全局变量
Vue.prototype.$post = post;
Vue.prototype.$get = get;
Vue.prototype.$patch = patch;
Vue.prototype.$put = put;
Vue.prototype.$delete = _delete;

Vue.use(VueCookies)
Vue.use(VueAxios, axios)//axios
// Vue.use(Electron)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

// Vue.prototype.Hint = Hint;
// Vue.prototype.$notification = boxNotification;
/**
 * 判断当前操作系统 
 * 显示不同的消息通知框
 * darwin -> macos
 * win32 -> win
 */
if(process.platform === 'darwin'){
  Vue.prototype.$notification = boxNotification;
}else{
  Vue.prototype.$notification = Hint;
}
// elementUI
import 'element-ui/lib/theme-chalk/index.css';
// import './element-variables.scss';//自定义样式
import ElementUI from 'element-ui';//全局-需取消配置.babelrc
import { Message } from 'element-ui';
Vue.use(ElementUI);


Vue.use(Vuex)

// iview
import 'iview/dist/styles/iview.css';
import { Drawer } from 'iview';//单组件-需配置.babelrc
Vue.component('Drawer', Drawer);
// iview end

Vue.config.productionTip = false

var app = new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
window.vue = app;

router.beforeEach((to, from, next) => {
  let loginData = store.state.loginData;
  next()
  // if (!loginData && to.path == '/seeting') {
  //   // next({ path: '/' })
  // } else {
  //   // next()
  // }
})
