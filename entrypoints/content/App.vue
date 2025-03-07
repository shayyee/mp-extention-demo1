<template>
  <div id="match-point-extense" :class="[{'match-point-show': show, 'folded': folded}, 'match-point-extension']">
    <div class="match-point-title">
      点聘 - 人才导入插件 V3.0
      <span class="position-right padding-horizon">
        <i class="crxicon crxicon-arrow pointer mr10" @click="folded = !folded"></i>
        <i class="crxicon crxicon-close pointer" @click="close"></i>
      </span>
    </div>
    <div class="match-point-content" v-show="!folded">
      <template v-if="user && user.id">
        <template v-if="view === 'index'">
          <select-search ref="projectSearchRef"
                         key="selectProject"
                         v-model="selectedProject"
                         type="project"
                         :userId="user.id"
                         placeholder="请选择项目">
          </select-search>
          <section class="crxbtn-group float-clear">
							<span class="float-right padding-vertical">
                <el-button size="small" class="duidian-button" type="primary" @click="changeViewToUpdate">更新人才</el-button>
								<el-button size="small" class="duidian-button" type="primary">导入系统</el-button>
							</span>
          </section>
        </template>
        <template v-else-if="view === 'update'">
        </template>
      </template>
      <template v-else>
        <section class="text-center match-point-flex flex-column">
          <span class="text-light padding-vertical">
            系统未登录
            {{showRefreshBtn ? ', ' : ''}}
             <el-button v-if="showRefreshBtn" @click="refreshLogin" type="primary" link>点击刷新</el-button>
          </span>
          <el-button size="small" style="width: 188px" class="duidian-button" type="primary" @click="handleLogin">登录</el-button>
        </section>
      </template>
    </div>
  </div>
</template>
<script lang="ts" setup>
import Draggabilly from 'draggabilly';
import { useUserInfoStore } from "./store";
import { sendMessageToBackground } from "@/utils";
import type { UserInfo } from "@/utils/types";
import SelectSearch from "@/components/SelectSearch.vue";
const { setUserInfo } = useUserInfoStore();

const show = ref(true)
const folded = ref(false)
const user = ref<UserInfo | null>(null)
const view = ref('index')
const showRefreshBtn = ref(false)
const selectedProject = ref<any>(null)

onMounted(() => {
  sendMessageToBackground('getUser', null, (res: UserInfo) => {
    console.log(res);
    user.value = res;
    setUserInfo(res);
  })
  new Draggabilly('#match-point-extense', {
    handle: '.match-point-title'
  });
})

const close = () => {
  show.value = false;
}
const refreshLogin = () => {
  sendMessageToBackground('getUser', null, (res: UserInfo) => {
    console.log(res);
    user.value = res;
    setUserInfo(res);
  })
}
const handleLogin = () => {
  let timer = setTimeout(() => {
    showRefreshBtn.value = true
  }, 2000)
  window.open(`${import.meta.env.WXT_BASE_URL}#/login`);
}
const changeViewToUpdate = () => {
  view.value = 'update'
}
const importImmediately = ref(false)
// const importToSystemHandler = () => {
//   if (
//       window.location.host.indexOf("kepler22.hr-mp.com") !== -1 ||
//       window.location.host.indexOf("kepler23.hr-mp.com") !== -1 ||
//       window.location.host.indexOf("mhs.hr-mp.com") !== -1
//   ) {
//     importImmediately.value = false;
//     return;
//   }
//   if (
//       window.location.href.indexOf("h.zhaopin.com/SearchResume/SearchZhaopinResumeInfo") !== -1 ||
//       window.location.href.indexOf("h.zhaopin.com/ResumeManage/HaveDownLoadResumeDetail") !== -1 ||
//       window.location.href.indexOf("h.zhaopin.com/searchresume/searchzhaopinresumeinfo") !== -1 ||
//       window.location.href.indexOf("h.zhaopin.com/resumemanage/havedownloadresumedetail") !== -1
//   ) {
//     var axiosInstance = axios.create({
//       baseURL: BASE_API_URL,
//       headers: {"Content-Type": "multipart/form-data", Accept: "*/*"},
//     });
//     axiosInstance.interceptors.request.use(
//         (config) => {
//           // 判断是否存在token，如果存在的话，则每个http header都加上token
//           const token = that.user.token;
//           if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//           }
//           return config;
//         },
//         (err) => {
//           return Promise.reject(err);
//         }
//     );
//     new Promise((resolve) => {
//       let pafBody = document.getElementsByClassName("mainbox")[0];
//       this.loadPdf(resolve, pafBody); //获取智联卓聘简历内容
//     }).then((val) => {
//       // console.log('输出val',val)
//       var formdata = new window.FormData();
//       formdata.append("file", val);
//       formdata.append("model_type", "candidate");
//       formdata.append("tag", "Original CV");
//       formdata.append("type", "pdf");
//       axiosInstance
//           .post("/v2/attachment", formdata)
//           .then((res) => {
//             if (res.data.code == "401") {
//               that.user = null;
//             } else if (res.data.code == 200) {
//               that.att_id = res.data.data.id;
//               that.resumeUrl = res.data.data.file_url;
//               const title = document.head.querySelector("title").innerText;
//               window.open(
//                   `${BASE_WEB_URL}candidate/index?att_id=${that.att_id}&plugin_import=1&joborder_id=${
//                       that.selectedProject.id || ""
//                   }&fromUrl=${window.location.href}&version=${that.version}`
//               );
//             }
//           })
//           .catch((err) => {
//             console.log(err);
//           });
//     });
//   } else if (window.location.href.indexOf("rd6.zhaopin.com") !== -1) {
//     var axiosInstance = axios.create({
//       baseURL: BASE_API_URL,
//       headers: {"Content-Type": "multipart/form-data", Accept: "*/*"},
//     });
//     axiosInstance.interceptors.request.use(
//         (config) => {
//           // 判断是否存在token，如果存在的话，则每个http header都加上token
//           const token = that.user.token;
//           if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//           }
//           return config;
//         },
//         (err) => {
//           return Promise.reject(err);
//         }
//     );
//     new Promise((resolve) => {
//       let pafBody = document.getElementsByClassName("resume-detail")[0];
//       this.loadPdf(resolve, pafBody); //获取智联简历内容
//     }).then((val) => {
//       var formdata = new window.FormData();
//       formdata.append("file", val);
//       formdata.append("model_type", "candidate");
//       formdata.append("tag", "Original CV");
//       formdata.append("type", "pdf");
//       axiosInstance
//           .post("/v2/attachment", formdata)
//           .then((res) => {
//             if (res.data.code == "401") {
//               that.user = null;
//             } else if (res.data.code == 200) {
//               that.att_id = res.data.data.id;
//               that.resumeUrl = res.data.data.file_url;
//               const title = document.head.querySelector("title").innerText;
//               window.open(
//                   `${BASE_WEB_URL}candidate/index?att_id=${that.att_id}&plugin_import=1&joborder_id=${
//                       that.selectedProject.id || ""
//                   }&fromUrl=${window.location.href}&version=${that.version}`
//               );
//             }
//           })
//           .catch((err) => {
//             console.log(err);
//           });
//     });
//   } else if (!this.importImmediately && window.location.href.indexOf("www.zhipin.com") !== -1) {
//     this.requestByBossPlatform({
//       isImport: true,
//     });
//   } else if (
//       (!this.importImmediately && window.location.href.indexOf("maimai.cn") !== -1)
//   ) {
//     this.requestByMaiMaiPlatform({
//       isImport: true,
//     });
//   } else if (
//       !this.importImmediately &&
//       window.location.href.indexOf("h.liepin.com/resume/batchshowresume") !== -1
//   ) {
//     try {
//       let pafBody = document
//           .getElementsByTagName("iframe")[0]
//           .contentWindow.document.getElementsByTagName("body")[0].outerHTML;
//       setTimeout(() => {
//         this._getCurrentHtml((convertedHTML) => {
//           this.importImmediately = true;
//
//           // 还原客户端状态
//           try {
//             document.querySelector(".artdeco-dismiss").click();
//           } catch (error) {
//           }
//           let url = window.location.href
//           this._requestExtensionBackground("parseResume", {
//             is_html: 1,
//             path_string: convertedHTML,
//             url: window.location.href,
//             version: this.version,
//           });
//         }, pafBody);
//       }, 800);
//       return;
//     } catch (e) {
//       console.log(e);
//     }
//     const title = document.head.querySelector("title").innerText;
//     window.open(
//         `${BASE_WEB_URL}candidate/index?att_id=${this.att_id}&plugin_import=1&joborder_id=${
//             this.selectedProject.id || ""
//         }&fromUrl=${window.location.href}&version=${this.version}`
//     );
//   } else if (!this.importImmediately && window.location.href.indexOf("linkedin.cn/incareer/in") !== -1) {
//     var axiosInstance = axios.create({
//       baseURL: BASE_API_URL,
//       headers: {"Content-Type": "multipart/form-data", Accept: "*/*"},
//     });
//     axiosInstance.interceptors.request.use(
//         (config) => {
//           // 判断是否存在token，如果存在的话，则每个http header都加上token
//           const token = that.user.token;
//           if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//           }
//           return config;
//         },
//         (err) => {
//           return Promise.reject(err);
//         }
//     );
//     new Promise((resolve) => {
//       let pafBody = document.querySelectorAll(`[data-testid="data-test-identity-full-profile"]`)[0];
//       this.loadPdf(resolve, pafBody);
//     }).then((val) => {
//       var formdata = new window.FormData();
//       formdata.append("file", val);
//       formdata.append("model_type", "candidate");
//       formdata.append("tag", "Original CV");
//       formdata.append("type", "pdf");
//       axiosInstance
//           .post("/v2/attachment", formdata)
//           .then((res) => {
//             if (res.data.code == "401") {
//               that.user = null;
//             } else if (res.data.code == 200) {
//               that.att_id = res.data.data.id;
//               that.resumeUrl = res.data.data.file_url;
//               const title = document.head.querySelector("title").innerText;
//               window.open(
//                   `${BASE_WEB_URL}candidate/index?att_id=${that.att_id}&plugin_import=1&joborder_id=${
//                       that.selectedProject.id || ""
//                   }&fromUrl=${window.location.href}&version=${this.version}`
//               );
//             }
//           })
//           .catch((err) => {
//             console.log(err);
//           });
//     });
//   } else if (!this.importImmediately && window.location.href.indexOf("linkedin.com/in") !== -1) {
//     var axiosInstance = axios.create({
//       baseURL: BASE_API_URL,
//       headers: {"Content-Type": "multipart/form-data", Accept: "*/*"},
//     });
//     axiosInstance.interceptors.request.use(
//         (config) => {
//           // 判断是否存在token，如果存在的话，则每个http header都加上token
//           const token = that.user.token;
//           if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//           }
//           return config;
//         },
//         (err) => {
//           return Promise.reject(err);
//         }
//     );
//     new Promise((resolve) => {
//       let pafBody = document.querySelector(".scaffold-layout .scaffold-layout__inner main");
//       this.loadPdf(resolve, pafBody);
//     }).then((val) => {
//       var formdata = new window.FormData();
//       formdata.append("file", val);
//       formdata.append("model_type", "candidate");
//       formdata.append("tag", "Original CV");
//       formdata.append("type", "pdf");
//       axiosInstance
//           .post("/v2/attachment", formdata)
//           .then((res) => {
//             if (res.data.code == "401") {
//               that.user = null;
//             } else if (res.data.code == 200) {
//               that.att_id = res.data.data.id;
//               that.resumeUrl = res.data.data.file_url;
//               const title = document.head.querySelector("title").innerText;
//               window.open(
//                   `${BASE_WEB_URL}candidate/index?att_id=${that.att_id}&plugin_import=1&joborder_id=${
//                       that.selectedProject.id || ""
//                   }&fromUrl=${window.location.href}&version=${this.version}`
//               );
//             }
//           })
//           .catch((err) => {
//             console.log(err);
//           });
//     });
//   } else {
//     const title = document.head.querySelector("title").innerText;
//     if (!this.att_id) {
//       setTimeout(() => {
//         this._getCurrentHtml((convertedHTML) => {
//           this.importImmediately = true;
//           let url = window.location.href;
//           this._requestExtensionBackground("parseResume", {
//             is_html: 1,
//             path_string: convertedHTML,
//             url: window.location.href,
//             version: this.version,
//             code: url.includes('maimai') ? this.getMaiMaiRequestCodeParam() : url.split('/').pop() + '_code',
//           });
//         });
//       }, 800);
//     } else {
//       window.open(
//           `${BASE_WEB_URL}candidate/index?att_id=${this.att_id}&plugin_import=1&joborder_id=${
//               this.selectedProject.id || ""
//           }&fromUrl=${window.location.href}&version=${this.version}`
//       );
//       this.importImmediately = false;
//     }
//   }
// }
</script>
