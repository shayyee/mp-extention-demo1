// 1. Import the style
import './style.scss';
import { createApp } from 'vue';
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import {getUserInfo, sendMessageToBackground} from "@/utils";
import type {UserInfo} from "@/utils/types";

// https://www.linkedin.com/in/daniel-wu-b1a64929a/    https://www.linkedin.com/in/benjamin-chan-b63921273/
const matchUrls = [
  "h.liepin.com/resume/showresumedetail", //猎聘单个
  "h.liepin.com/resume/batchshowresume", //猎聘批量
  "h.highpin.cn/ResumeManage/SelfAcceptResume", //智联
  "h.zhaopin.com/SearchResume/SearchZhaopinResumeInfo", //智联卓聘
  "h.zhaopin.com/searchresume/searchzhaopinresumeinfo", //智联卓聘
  "h.zhaopin.com/ResumeManage/HaveDownLoadResumeDetail", // 智联卓聘
  "h.zhaopin.com/resumemanage/havedownloadresumedetail", // 智联卓聘
  "linkedin.cn/incareer/in", // 领英
  "www.linkedin.com/in", // 领英国际版
  "rd6.zhaopin.com/resume/detail",
  "rd6.zhaopin.com/talent/recommend",
  "rd6.zhaopin.com/app/recommend",
  "www.zhipin.com/web/chat/recommend", //boss推荐牛人
  "www.zhipin.com/web/chat/geek/manage", //boss牛人管理
  "www.zhipin.com/web/chat/index", // boss沟通页面
  "www.zhipin.com/web/chat/search",
  "www.zhipin.com/web/chat/interaction", // boss互动页面
  "www.zhipin.com/web/chat/intention", // boss意项沟通页面
  "zhipin.com/web/common/viewer",
  "maimai.cn/contact/detail", //脉脉
  "maimai.cn/ent/micro_resume",
  "maimai.cn/profile/detail",
  "maimai.cn/profile/resume_detail",
  "maimai.cn/chat", //脉脉
  "maimai.cn/ent",
  "ehire.51job.com/Candidate/ResumeView.aspx",
]
export default defineContentScript({
  // matches: matchUrls.map((item => `*://${item}/*`)),
  matches: ["*://*/*"],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',
  async main(ctx) {
    console.log('Hello from content script!')
    sendMessageToBackground('getUser', {}, (res: any) => {
      if(!res || !res.id) {
        // 获取用户信息送给background，background进行存储
        const userInfo = getUserInfo();
        sendMessageToBackground('setUser', userInfo);
      }
    })
    // 与路由表匹配的页面才会显示插件
    let router = window.location.href;
    let isMatched = false;
    for (let i = 0, routerLength = matchUrls.length; i < routerLength; i++) {
      if (router.match(matchUrls[i])) {
        if (matchUrls[i] === "rd6.zhaopin.com/talent/recommend") {
          if (router.includes("resumeNumber")) {
            isMatched = true;
          }
        } else {
          isMatched = true;
        }
        break;
      }
    }
    if(!isMatched) return;
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: 'mp-extension',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        // Define how your UI will be mounted inside the container
        const app = createApp(App);
        const pinia = createPinia();
        pinia.use(piniaPluginPersistedstate);
        app.use(pinia);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        // Unmount the app when the UI is removed
        app?.unmount();
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});
