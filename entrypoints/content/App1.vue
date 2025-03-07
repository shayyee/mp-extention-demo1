<template>
  <div id="match-point-extense" class="match-point-extension" :class="folded ? 'folded' : ''">
    <div class="match-point-title">
      点聘 - 人才导入插件 V2.2.6.2
      <span class="position-right padding-horizon">
        <i class="crxicon crxicon-arrow pointer" :style="getCrxicon('arrow-down')" @click="folded = !folded"></i>
        <i class="crxicon crxicon-close pointer" :style="getCrxicon('close')" @click="close"></i>
      </span>
    </div>
    <div class="match-point-content" v-show="!folded">
      <template v-if="user && user.id">
        <template v-if="view === 'index'">
          <select-search ref="projectSearchCmp" key="cmp-1"
                         v-model="selectedProject"
                         type="project"
                         :userId="user.id"
                         placeholder="请选择项目"
                         :addtional-gql="'joborderuser_set__user__eq=' + user.id"
                         @requestList="selectSearchFunction">
          </select-search>
          <section class="crxbtn-group float-clear">
            <span class="float-right padding-vertical">
              <template v-if="S_update_processing">
                <i class="crxicon crxicon-loading bottom"></i>
              </template>
              <template v-else-if="S_update_success">
                <span class="text-primary">更新成功</span>
              </template>
              <template v-else>
                <el-button size="small" class="duidian-button" type="primary" @click="changeViewToUpdate">更新人才</el-button>
              </template>
              <el-button size="small" class="duidian-button" type="primary" @click="importToSystemHandler">导入系统</el-button>
            </span>
          </section>
          <section class="padding-vertical font-small" style="max-height: 600px;overflow: overlay;">
            <p class="similarity-title">
              <span>简历查重：</span>
              <template v-if="!hasFound && !S_loading">
                <el-button type="text" size="small" @click="startFindRepeat('start-click')">开始查重</el-button>
              </template>
              <template v-if="S_loading">
                <i class="crxicon crxicon-loading bottom"></i>
              </template>
              <template v-if="S_loading">
                <el-button type="text" size="small" @click="stopFindRepeat">取消查重</el-button>
              </template>
              <template v-if="!resultList.length && !S_loading">
                <i class="crxicon bottom" :style="getCrxicon('no-repeat')"></i>
                <span>没有重复和相似人才</span>
                <el-button type="text" size="small" @click="startFindRepeat('no-repeat-click')">重新查重</el-button>
              </template>
              <template v-if="resultList.length">
                <span>查询到 {{ resultList.length }} 位相似人才（根据简历全文相似度查询）</span>
                <el-button type="text" size="small" v-if="!S_loading" @click="startFindRepeat('reclick')">重新查重</el-button>
              </template>
            </p>
            <template v-if="resultList.length">
              <template>
                <div v-loading="S_loading">
                  <div v-for="(talentItem, talentIndex) in resultList" :key="talentIndex" class="similarity-box">
                    <div class="similarity-name">
                      <a class="click-text" :href="env + 'candidate/detail/'+talentItem.id+'/single'" target="_blank">
                        #{{ talentItem.id + ' ' + talentItem.chinese_name || talentItem.english_name }}
                      </a>
                      <p class="similarity-num">简历相似度{{ talentItem.similarity }}</p>
                    </div>
                    <p>
                      <a class="click-text" :href="env + 'company/detail/'+talentItem.c_id+'/single'" target="_blank">{{ talentItem.c_name }}</a>
                      <template v-if="talentItem.title">
                        - {{ talentItem.title }}
                      </template>
                    </p>
                    <el-button size="small" style="width: 88px" class="duidian-button" type="primary" :disabled="!hasFound" @click="detailUpdateTalent(talentItem)">更新人才</el-button>
                    <el-button size="small" style="width: 88px" :disabled="!hasFound || (!talentItem.ERR_upload_resume && talentItem.S_upload_resume)" @click="detailUploadResume(talentItem)">上传简历</el-button>
                    <el-button size="small" style="width: 88px" :disabled="!hasFound" @click="detailJoinProject(talentItem)">加入职位</el-button>
                    <p v-if="talentItem.S_upload_resume" :class="talentItem.ERR_upload_resume ? 'text-danger': 'text-primary'">{{ talentItem.S_upload_resume_text }}</p>
                    <section class="crxhr"></section>
                  </div>
                </div>
              </template>
            </template>
          </section>
        </template>
        <template v-else-if="view === 'update'">
          <select-search ref="talentSearchCmp" key="cmp-3"
                         type="talent"
                         v-model="selectedTalent"
                         @requestList="selectSearchFunction">
          </select-search>
          <section class="crxbtn-group padding-vertical">
            <el-button size="small" @click="goBack">返回</el-button>
            <template v-if="S_update_processing">
              <i class="crxicon crxicon-loading bottom float-right"></i>
            </template>
            <template v-else-if="S_update_success">
              <span class="text-primary float-right">更新成功</span>
            </template>
            <template v-else-if="ERR_update">
              <span class="text-danger float-right">{{ ERR_update }}</span>
            </template>
            <template v-else>
              <el-button class="float-right" size="small"
                         :disabled="!(selectedTalent && selectedTalent.id)"
                         @click="updateTalentHandler()">更新</el-button>
            </template>
          </section>
        </template>
      </template>
      <template v-else>
        <section class="text-center match-point-flex flex-column">
          <span class="text-light padding-vertical">
            系统未登录
            {{showRefreshBtn ? ', ' : ''}}
            <a href="javascript:void;" class="pointer ml10 refresh-btn" @click="refreshLogin" v-if="showRefreshBtn">点击刷新</a>
          </span>
          <el-button size="small" style="width: 188px" class="duidian-button" type="primary" @click="gotoLogin">登录</el-button>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useDraggable } from '@vueuse/motion';

const user = ref(null);
const view = ref("index");
const folded = ref(false);
const selectedTalent = ref({});
const uploadedTalent = ref({});
const selectedProject = ref({});
const hasFound = ref(false);
const S_loading = ref(false);
const S_update_processing = ref(false);
const S_update_success = ref(false);
const ERR_update = ref(null);
const resultList = ref([]);
const showRefreshBtn = ref(false);
const resume = ref(null);
const resumeUrl = ref("");
const att_id = ref("");
const T_update = ref(false);
const importImmediately = ref(false);
const env = BASE_WEB_URL;
const buffer = ref("");
const version = "2.2.6.2";

onMounted(() => {
  listenExtensionBackend();
  init();
});
const init = () => {
  view.value = "index";
  selectedTalent.value = {};
  selectedProject.value = {};
  hasFound.value = false;
  resultList.value = [];
  S_loading.value = false;
  showRefreshBtn.value = false;
  S_update_success.value = false;
  S_update_processing.value = false;
  ERR_update.value = null;
  resume.value = false;
  resumeUrl.value = false;
  importImmediately.value = false;

  setTimeout(() => {
    showRefreshBtn.value = true;
  }, 3000);

  useDraggable(".match-point-extension", {
    handle: ".match-point-title",
  });
  _requestExtensionBackground("checkLogin", getUserInfo());
  if (
      (window.location.href.indexOf("www.zhipin.com") !== -1 && window.location.href.indexOf("zhipin.com/web/common/viewer") === -1)
      ||
      (window.location.href.indexOf('maimai.cn') !== -1)
  ) {
    hasFound.value = true;
  } else {
    startFindRepeat("init");
    console.log('是否开始查重操作')
  }
};

const close = () => {
  document.getElementById("match-point-extense").style.display = "none";
};

const _getCurrentHtml = (callback, currentHtml) => {
  const _html = document.documentElement.cloneNode(true);

  ["#im-root", ".gllue-toolbar", ".match-point-extension"].forEach((query) => _html.querySelector(query)?.remove());

  let html = currentHtml || _html.outerHTML;
  if (window.location.href.indexOf("linkedin.com/in") !== -1) {
    html = document.querySelector('.scaffold-layout .scaffold-layout__inner main').outerHTML;
  }

  convertAllImg2Base64(html, callback);
};

const getUrlQueryParam = (name) => {
  const qs_obj = {};
  const qs = document.location.search.replace('?', '');
  const qs_arr = qs.split('&');
  qs_arr.forEach(qs_item => {
    const item_arr = qs_item.split('=');
    qs_obj[item_arr[0]] = item_arr[1];
  });
  return qs_obj[name] || null;
};

const getCrxicon = (icon) => {
  const iconUrl = chrome.extension.getURL(`icon/${icon}.png`);
  return {
    background: `url('${iconUrl}') center no-repeat`,
    backgroundSize: icon === "close" ? "10px" : "cover",
  };
};

const gotoLogin = () => {
  window.open(`${BASE_WEB_URL}/#/login`);
};

const getFileFromUrl = (url, fileName = "简历") => {
  return new Promise((resolve, reject) => {
    let blob = null;
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.setRequestHeader("Accept", "*/*");
    xhr.responseType = "blob";
    xhr.onload = () => {
      blob = xhr.response;
      let file = new File([blob], fileName, {type: "image/png"});
      resolve(file);
    };
    xhr.onerror = (e) => {
      reject(e);
    };
    xhr.send();
  });
};

const loadPdf = (resolve, pdfBody, dpi = 300) => {
  html2canvas(pdfBody, {
    dpi: window.devicePixelRatio * 300,
    scale: 1,
  }).then((canvas) => {
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;

    var pageHeight = (canvasWidth / 595.28) * 841.89;
    var position = 0;
    var imgWidth = 555.28;
    var imgHeight = (555.28 / canvasWidth) * canvasHeight;

    var pageData = canvas.toDataURL("image/jpeg", 1.0);

    var pdf = new jsPDF("", "pt", "a4");
    if (canvasHeight < pageHeight) {
      pdf.addImage(pageData, "JPEG", 0, 0, imgWidth, imgHeight);
    } else {
      while (canvasHeight > 0) {
        pdf.addImage(pageData, "JPEG", 0, position, imgWidth, imgHeight);
        canvasHeight -= pageHeight;
        position -= 841.89;
        if (canvasHeight > 841.89) {
          pdf.addPage();
        }
      }
    }
    let buffer = pdf.output("datauristring");
    var myfile = dataURLtoFile(buffer, "简历.pdf");
    return resolve(myfile);
  });
};

const dataURLtoFile = (dataurl, filename) => {
  var arr = dataurl.split(",");
  var mime = arr[0].match(/:(.*?);/)[1];
  var bstr = atob(arr[1]);
  var n = bstr.length;
  var u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type: mime});
};

const listenExtensionBackend = () => {
  chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
    switch (req.type) {
      case "open":
        openHandler(req, sendResponse);
        break;
      case "response":
        backgroundResponseDispatcher(req, sendResponse);
        break;
      default:
        break;
    }
  });
};

const refreshLogin = () => {
  _requestExtensionBackground("checkLogin", getUserInfo());
};

const goBack = () => {
  view.value = "index";
  selectedTalent.value = {};
  selectedProject.value = {};
};

const openHandler = (request, sendResponse) => {
  document.getElementById("match-point-extense").style.display = "block";
  startFindRepeat("open");
};

const backgroundResponseDispatcher = (request, sendResponse) => {
  const name = request.name;
  let data = request.data;
  if (data instanceof Error) {
    this.error = new Error("错误原因：" + res.message);
  }
  if (checkNullObj(data) || data?.response?.data?.code === 401) {
    view.value = "index";
    user.value = null;
    localStorage.removeItem("__user__");
    stopFindRepeat();
    _requestExtensionBackground("clearLogin", null);
    data = new Error("错误代码：" + data.code);
    return;
  }
  try {
    switch (name) {
      case "checkLogin":
        checkLoginResponse(data);
        break;
      case "talentList":
        talentListResponse(data);
        break;
      case "projectList":
        projectListResponse(data);
        break;
      case "parseResume":
        parseResumeResponse(data);
        break;
      case "updateTalent":
        updateTalentResponse(data);
        break;
      case "uploadResume":
        uploadResumeResponse(data);
        break;
      default:
        break;
    }
    sendResponse(null);
  } catch (error) {
    console.error(error);
    sendResponse(error);
  }
};

const _requestExtensionBackground = (name, data, callback) => {
  chrome.runtime.sendMessage(
      {
        type: "request",
        name,
        data,
      },
      function (err, data) {
        if (err) {
          return;
        }
        callback && callback(data);
      }
  );
};

const checkLoginResponse = (user) => {
  if (user.id) {
    user.value = user;
  }
};

const checkNullObj = (obj) => {
  return Object.keys(obj).length === 0;
};

const selectSearchFunction = (type, param) => {
  switch (type) {
    case "talent":
      _requestExtensionBackground("talentList", param);
      break;
    case "project":
      _requestExtensionBackground("projectList", param);
      break;
  }
};

const talentListResponse = (data) => {
  this.$refs.talentSearchCmp.onDataListResponse(data);
};

const projectListResponse = (data) => {
  this.$refs.projectSearchCmp.onDataListResponse(data);
};

const updateTalentHandler = (id = selectedTalent.value.id) => {
  if (!att_id.value) {
    alert("未解析到简历信息");
  } else {
    window.open(
        `${BASE_WEB_URL}candidate/detail/${id}/single/%7B"keyword_type":"and"%7D/0/?update_import=1&detail_id=${
            id}&att_id=${att_id.value}`
    );
  }
};

const importToSystemHandler = () => {
  let that = this;
  if (
      window.location.host.indexOf("kepler22.hr-mp.com") !== -1 ||
      window.location.host.indexOf("kepler23.hr-mp.com") !== -1 ||
      window.location.host.indexOf("mhs.hr-mp.com") !== -1
  ) {
    this.importImmediately = false;
    return;
  }
  if (
      window.location.href.indexOf("h.zhaopin.com/SearchResume/SearchZhaopinResumeInfo") !== -1 ||
      window.location.href.indexOf("h.zhaopin.com/ResumeManage/HaveDownLoadResumeDetail") !== -1 ||
      window.location.href.indexOf("h.zhaopin.com/searchresume/searchzhaopinresumeinfo") !== -1 ||
      window.location.href.indexOf("h.zhaopin.com/resumemanage/havedownloadresumedetail") !== -1
  ) {
    var axiosInstance = axios.create({
      baseURL: BASE_API_URL,
      headers: {"Content-Type": "multipart/form-data", Accept: "*/*"},
    });
    axiosInstance.interceptors.request.use(
        (config) => {
          // 判断是否存在token，如果存在的话，则每个http header都加上token
          const token = that.user.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (err) => {
          return Promise.reject(err);
        }
    );
    new Promise((resolve) => {
      let pafBody = document.getElementsByClassName("mainbox")[0];
      this.loadPdf(resolve, pafBody); //获取智联卓聘简历内容
    }).then((val) => {
      // console.log('输出val',val)
      var formdata = new window.FormData();
      formdata.append("file", val);
      formdata.append("model_type", "candidate");
      formdata.append("tag", "Original CV");
      formdata.append("type", "pdf");
      axiosInstance
          .post("/v2/attachment", formdata)
          .then((res) => {
            if (res.data.code == "401") {
              that.user = null;
            } else if (res.data.code == 200) {
              that.att_id = res.data.data.id;
              that.resumeUrl = res.data.data.file_url;
              const title = document.head.querySelector("title").innerText;
              window.open(
                  `${BASE_WEB_URL}candidate/index?att_id=${that.att_id}&plugin_import=1&joborder_id=${
                      that.selectedProject.id || ""
                  }&fromUrl=${window.location.href}&version=${that.version}`
              );
            }
          })
          .catch((err) => {
            console.log(err);
          });
    });
  } else if (window.location.href.indexOf("rd6.zhaopin.com") !== -1) {
    var axiosInstance = axios.create({
      baseURL: BASE_API_URL,
      headers: {"Content-Type": "multipart/form-data", Accept: "*/*"},
    });
    axiosInstance.interceptors.request.use(
        (config) => {
          // 判断是否存在token，如果存在的话，则每个http header都加上token
          const token = that.user.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (err) => {
          return Promise.reject(err);
        }
    );
    new Promise((resolve) => {
      let pafBody = document.getElementsByClassName("resume-detail")[0];
      this.loadPdf(resolve, pafBody); //获取智联简历内容
    }).then((val) => {
      var formdata = new window.FormData();
      formdata.append("file", val);
      formdata.append("model_type", "candidate");
      formdata.append("tag", "Original CV");
      formdata.append("type", "pdf");
      axiosInstance
          .post("/v2/attachment", formdata)
          .then((res) => {
            if (res.data.code == "401") {
              that.user = null;
            } else if (res.data.code == 200) {
              that.att_id = res.data.data.id;
              that.resumeUrl = res.data.data.file_url;
              const title = document.head.querySelector("title").innerText;
              window.open(
                  `${BASE_WEB_URL}candidate/index?att_id=${that.att_id}&plugin_import=1&joborder_id=${
                      that.selectedProject.id || ""
                  }&fromUrl=${window.location.href}&version=${that.version}`
              );
            }
          })
          .catch((err) => {
            console.log(err);
          });
    });
  } else if (!this.importImmediately && window.location.href.indexOf("www.zhipin.com") !== -1) {
    this.requestByBossPlatform({
      isImport: true,
    });
  } else if (
      (!this.importImmediately && window.location.href.indexOf("maimai.cn") !== -1)
  ) {
    this.requestByMaiMaiPlatform({
      isImport: true,
    });
  } else if (
      !this.importImmediately &&
      window.location.href.indexOf("h.liepin.com/resume/batchshowresume") !== -1
  ) {
    try {
      let pafBody = document
          .getElementsByTagName("iframe")[0]
          .contentWindow.document.getElementsByTagName("body")[0].outerHTML;
      setTimeout(() => {
        this._getCurrentHtml((convertedHTML) => {
          this.importImmediately = true;

          // 还原客户端状态
          try {
            document.querySelector(".artdeco-dismiss").click();
          } catch (error) {
          }
          let url = window.location.href
          this._requestExtensionBackground("parseResume", {
            is_html: 1,
            path_string: convertedHTML,
            url: window.location.href,
            version: this.version,
          });
        }, pafBody);
      }, 800);
      return;
    } catch (e) {
      console.log(e);
    }
    const title = document.head.querySelector("title").innerText;
    window.open(
        `${BASE_WEB_URL}candidate/index?att_id=${this.att_id}&plugin_import=1&joborder_id=${
            this.selectedProject.id || ""
        }&fromUrl=${window.location.href}&version=${this.version}`
    );
  } else if (!this.importImmediately && window.location.href.indexOf("linkedin.cn/incareer/in") !== -1) {
    var axiosInstance = axios.create({
      baseURL: BASE_API_URL,
      headers: {"Content-Type": "multipart/form-data", Accept: "*/*"},
    });
    axiosInstance.interceptors.request.use(
        (config) => {
          // 判断是否存在token，如果存在的话，则每个http header都加上token
          const token = that.user.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (err) => {
          return Promise.reject(err);
        }
    );
    new Promise((resolve) => {
      let pafBody = document.querySelectorAll(`[data-testid="data-test-identity-full-profile"]`)[0];
      this.loadPdf(resolve, pafBody);
    }).then((val) => {
      var formdata = new window.FormData();
      formdata.append("file", val);
      formdata.append("model_type", "candidate");
      formdata.append("tag", "Original CV");
      formdata.append("type", "pdf");
      axiosInstance
          .post("/v2/attachment", formdata)
          .then((res) => {
            if (res.data.code == "401") {
              that.user = null;
            } else if (res.data.code == 200) {
              that.att_id = res.data.data.id;
              that.resumeUrl = res.data.data.file_url;
              const title = document.head.querySelector("title").innerText;
              window.open(
                  `${BASE_WEB_URL}candidate/index?att_id=${that.att_id}&plugin_import=1&joborder_id=${
                      that.selectedProject.id || ""
                  }&fromUrl=${window.location.href}&version=${this.version}`
              );
            }
          })
          .catch((err) => {
            console.log(err);
          });
    });
  } else if (!this.importImmediately && window.location.href.indexOf("linkedin.com/in") !== -1) {
    var axiosInstance = axios.create({
      baseURL: BASE_API_URL,
      headers: {"Content-Type": "multipart/form-data", Accept: "*/*"},
    });
    axiosInstance.interceptors.request.use(
        (config) => {
          // 判断是否存在token，如果存在的话，则每个http header都加上token
          const token = that.user.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (err) => {
          return Promise.reject(err);
        }
    );
    new Promise((resolve) => {
      let pafBody = document.querySelector(".scaffold-layout .scaffold-layout__inner main");
      this.loadPdf(resolve, pafBody);
    }).then((val) => {
      var formdata = new window.FormData();
      formdata.append("file", val);
      formdata.append("model_type", "candidate");
      formdata.append("tag", "Original CV");
      formdata.append("type", "pdf");
      axiosInstance
          .post("/v2/attachment", formdata)
          .then((res) => {
            if (res.data.code == "401") {
              that.user = null;
            } else if (res.data.code == 200) {
              that.att_id = res.data.data.id;
              that.resumeUrl = res.data.data.file_url;
              const title = document.head.querySelector("title").innerText;
              window.open(
                  `${BASE_WEB_URL}candidate/index?att_id=${that.att_id}&plugin_import=1&joborder_id=${
                      that.selectedProject.id || ""
                  }&fromUrl=${window.location.href}&version=${this.version}`
              );
            }
          })
          .catch((err) => {
            console.log(err);
          });
    });
  } else {
    const title = document.head.querySelector("title").innerText;
    if (!this.att_id) {
      setTimeout(() => {
        this._getCurrentHtml((convertedHTML) => {
          this.importImmediately = true;
          let url = window.location.href;
          this._requestExtensionBackground("parseResume", {
            is_html: 1,
            path_string: convertedHTML,
            url: window.location.href,
            version: this.version,
            code: url.includes('maimai') ? this.getMaiMaiRequestCodeParam() : url.split('/').pop() + '_code',
          });
        });
      }, 800);
    } else {
      window.open(
          `${BASE_WEB_URL}candidate/index?att_id=${this.att_id}&plugin_import=1&joborder_id=${
              this.selectedProject.id || ""
          }&fromUrl=${window.location.href}&version=${this.version}`
      );
      this.importImmediately = false;
    }
  }
}

</script>
