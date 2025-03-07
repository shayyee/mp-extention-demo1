<template>
  <div
      ref="mpExtentionRef"
      :class="[{'match-point-show': show, 'folded': folded}, 'match-point-extension']"
      :style="mpExtentionStyle">
    <div class="match-point-title" @mousedown.prevent="startDrag">
      点聘 - 人才导入插件 V3.0
      <span class="position-right padding-horizon">
        <i class="crxicon crxicon-arrow pointer mr10" @click="folded = !folded"></i>
        <i class="crxicon crxicon-close pointer" @click="close"></i>
      </span>
    </div>
    <div class="match-point-content" v-show="!folded">
      <template v-if="user && user.id">
        <template v-if="view === 'index'">
          <select-search
            ref="selectProjectRef"
            key="selectProject"
            v-model="selectedProject"
            type="project"
            :userId="user.id"
            placeholder="请选择项目">
          </select-search>
          <section class="crxbtn-group float-clear">
							<span class="float-right padding-vertical">
                <el-button size="small" class="duidian-button" type="primary"
                           @click="changeViewToUpdate">更新人才</el-button>
								<el-button size="small" class="duidian-button" type="primary">导入系统</el-button>
							</span>
          </section>
          <section class="padding-vertical font-small" style="max-height: 600px;">
            <p class="similarity-title">
              <span>简历查重：</span>
              <template v-if="!hasFound && !loading">
                <el-button type="primary" link size="small" @click="startFindRepeat('start-click')">开始查重</el-button>
              </template>
              <template v-if="loading">
                <i class="crxicon crxicon-loading"></i>
              </template>
              <template v-if="loading">
                <el-button type="primary" link size="small" @click="stopFindRepeat">取消查重</el-button>
              </template>
              <template v-if="!resultList.length && !loading">
                <i class="crxicon crxicon-no-repeat"></i>
                <span>没有重复和相似人才</span>
                <el-button type="primary" link size="small" @click="startFindRepeat('no-repeat-click')">重新查重</el-button>
              </template>
              <template v-if="resultList.length">
                <span>查询到 {{ resultList.length }} 位相似人才（根据简历全文相似度查询）</span>
                <el-button type="primary" link size="small" v-if="!loading" @click="startFindRepeat('reclick')">重新查重</el-button>
              </template>
            </p>
            <template v-if="resultList.length">
              <div v-loading="loading">
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
          </section>
        </template>
        <template v-else-if="view === 'update'">
          <select-search
            ref="selectTalentRef"
            key="selectTalent"
            type="talent"
            v-model="selectedTalent"
            placeholder="请选择候选人">
          </select-search>
          <section class="crxbtn-group padding-vertical">
            <el-button size="small" @click="goBack">返回</el-button>
            <el-button class="float-right" size="small" :disabled="!(selectedTalent && selectedTalent.id)" @click="updateTalentHandler()">更新</el-button>
          </section>
        </template>
      </template>
      <template v-else>
        <section class="text-center match-point-flex flex-column">
          <span class="text-light padding-vertical">
            系统未登录
            {{ showRefreshBtn ? ', ' : '' }}
             <el-button v-if="showRefreshBtn" @click="refreshLogin" type="primary" link>点击刷新</el-button>
          </span>
          <el-button size="small" style="width: 188px" class="duidian-button" type="primary" @click="handleLogin">登录
          </el-button>
        </section>
      </template>
    </div>
  </div>
</template>
<script lang="ts" setup>
import axios from "axios";
import html2canvas from 'html2canvas';
import { jsPDF } from "jspdf";
import {useUserInfoStore} from "./store";
import {sendMessageToBackground, convertAllImg2Base64, getUrlQueryParam, dataURLtoFile} from "@/utils";
import type {UserInfo} from "@/utils/types";
import SelectSearch from "@/components/SelectSearch.vue";
const {setUserInfo, userInfo} = useUserInfoStore();
import packageJson from "../../package.json";

const axiosInstance = axios.create({
  baseURL: import.meta.env.WXT_BASE_URL,
  headers: {"Content-Type": "multipart/form-data", Accept: "*/*"},
});
axiosInstance.interceptors.request.use(
    (config) => {
      // 判断是否存在token，如果存在的话，则每个http header都加上token
      const token = userInfo.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (err) => {
      return Promise.reject(err);
    }
);

const BASE_WEB_URL = import.meta.env.WXT_BASE_URL;
const env = ref(BASE_WEB_URL);
const version = ref(packageJson.version || "1.0.0");
const show = ref(true)
const folded = ref(false)  // 是否折叠
const user = ref<UserInfo | null>(null)
const view = ref('index')
const selectedTalent = ref<any>({})  // 选中的人才
const uploadedTalent = ref<any>({})  // 更新简历对应人才
const selectedProject = ref<any>({})  // 选中的项目
const showRefreshBtn = ref(false)   // 是否显示刷新按钮
const hasFound = ref(false)   // 是否查重到人才
const loading = ref(false)   // 是否正在查重
const resultList = ref<any[]>([])   // 查重到的人才列表
const resume = ref<any>(null)   // 解析之后的简历
const resumeUrl = ref('')   // 解析之后简历地址
const att_id = ref('')   // 解析之后简历（附件）id
const visible = ref(false)   // 项目选择弹窗
onMounted(() => {
  refreshLogin();
})

const mpExtentionRef = ref<HTMLElement | null>(null)
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const translateX = ref(0);
const translateY = ref(0);

// 动态样式
const mpExtentionStyle = ref({
  transform: `translate(${translateX.value}px, ${translateY.value}px)`,
  userSelect: 'none' // 防止拖动时选中文本
});
const startDrag = (e: MouseEvent) => {
  isDragging.value = true;
  startX.value = e.clientX;
  startY.value = e.clientY;

  // 修复类型问题
  const transformValue = mpExtentionRef.value!.style.transform || "translate(0px, 0px)";
  const currentTranslate = transformValue.match(/-?\d+/g) ?? ["0", "0"];

  // 明确转换为字符串再解析
  translateX.value = parseInt(currentTranslate[0].toString(), 10);
  translateY.value = parseInt(currentTranslate[1].toString(), 10);

  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
};

const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;

  // 计算偏移量
  const dx = e.clientX - startX.value;
  const dy = e.clientY - startY.value;

  // 更新位置
  mpExtentionStyle.value.transform = `translate(${translateX.value + dx}px, ${translateY.value + dy}px)`;
};

const stopDrag = () => {
  isDragging.value = false;

  // 保存最后位置用于下次拖动
  const currentTranslate = mpExtentionStyle.value.transform.match(/-?\d+/g) ?? ["0", "0"];
  translateX.value = parseInt(currentTranslate[0]);
  translateY.value = parseInt(currentTranslate[1]);

  // 移除监听
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
};

const close = () => {
  show.value = false;
}
const refreshLogin = () => {
  sendMessageToBackground('getUser', null, (res: UserInfo) => {
    console.log(res);
    user.value = res;
    if(res && res.id) {
      setUserInfo(res);
      if (
          (window.location.href.indexOf("www.zhipin.com") !== -1 && window.location.href.indexOf("zhipin.com/web/common/viewer") === -1)
          ||
          (window.location.href.indexOf('maimai.cn') !== -1)
      ) {
        hasFound.value = true;
      } else {
        startFindRepeat("init");
      }
    }
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
// 返回按钮
const goBack = () => {
  view.value = "index";
  selectedTalent.value = {};
  selectedProject.value = {};
}

const importImmediately = ref(false)
const resumeParse = (convertedHTML: string, code: any) => {
  let payload: any = {
    is_html: 1,
    path_string: convertedHTML,
    url: window.location.href,
    version: version.value,
  }
  if(code) {
    payload.code = code;
  }
  sendMessageToBackground("resumeParse", payload, (res: any) => {
    if (res.code === 200) {
      resultList.value = res.data.similar_candidate || [];
      resume.value = res.data.resume;
      resumeUrl.value = res.data.path;
      att_id.value = res.data.attachment.id;

      // 如果需要立即打开，跳转
      if (importImmediately.value) {
        importToSystemHandler();
      }
    }
    hasFound.value = true;
    loading.value = false;
  });
}
const stopFindRepeat = () => {
  hasFound.value = false;
  loading.value = false;
}
const startFindRepeat = (type = 'init') => {
  if (
      window.location.host.indexOf("kepler22.hr-mp.com") !== -1 ||
      window.location.host.indexOf("kepler23.hr-mp.com") !== -1 ||
      window.location.host.indexOf("mhs.hr-mp.com") !== -1
  ) {
    return;
  }
  loading.value = true;
  setTimeout(() => {
    const platformConfig = getPlatformConfig();
    if (platformConfig.isBoss) {
      requestByBossPlatform({
        isImport: false,
      });
    } else if (platformConfig.isMaiMai) {
      requestByMaiMaiPlatform({
        isImport: false,
      });
    } else {
      _getCurrentHtml((convertedHTML: string) => {
        let url = window.location.href;
        resumeParse(convertedHTML, url.includes('maimai.cn') ? getMaiMaiRequestCodeParam() : '');
      });
    }
  }, 2000);
}
const detailUpdateTalent = (talentItem: any) => {
  updateTalentHandler(talentItem.id);
}
// 单条人才上传简历按钮
const detailUploadResume = (talentItem: any) => {
  uploadedTalent.value = talentItem;

  talentItem.S_upload_resume_text = "";
  talentItem.S_upload_resume_text = false;
  talentItem.ERR_upload_resume = false;

  sendMessageToBackground("resumeUpload", {
    id: talentItem.id,
    att_id: att_id.value,
  }, (res: any) => {
    if (res.code === 200) {
      uploadedTalent.value.ERR_upload_resume = false;
      uploadedTalent.value.S_upload_resume_text = "上传成功";
    } else {
      uploadedTalent.value.ERR_upload_resume = true;
      uploadedTalent.value.S_upload_resume_text = res.msg;
    }
    uploadedTalent.value.S_upload_resume = true;
  });
}
// 单条人才 加入项目
const detailJoinProject = (talentItem: any) =>  {
  const {id, chinese_name, english_name} = talentItem;
  window.open(`${BASE_WEB_URL}candidate/index?plugin_join_project=1&candidate_id=${id}&candidate_name=${chinese_name || english_name}&project_id=${selectedProject.value.id || ""}`);
}
// 按钮：更新人才-跳转到人才合并页面
const updateTalentHandler = (id = selectedTalent.value.id) => {
  if (!att_id.value) {
    alert("未解析到简历信息");
  } else {
    window.open(
        `${BASE_WEB_URL}candidate/detail/${id}/single/%7B"keyword_type":"and"%7D/0/?update_import=1&detail_id=${
            id}&att_id=${att_id.value}`
    );
  }
}
const getAttachment = (val: any) => {
  var formdata = new window.FormData();
  formdata.append("file", val);
  formdata.append("model_type", "candidate");
  formdata.append("tag", "Original CV");
  formdata.append("type", "pdf");
  axiosInstance.post("/v2/attachment", formdata).then((res) => {
    if (res.data.code == "401") {
      user.value = null;
    } else if (res.data.code == 200) {
      att_id.value = res.data.data.id;
      resumeUrl.value = res.data.data.file_url;
      const title = document.head.querySelector("title")?.innerText;
      window.open(`${BASE_WEB_URL}candidate/index?att_id=${att_id.value}&plugin_import=1&joborder_id=${selectedProject.value.id || ""}&fromUrl=${window.location.href}&version=${version.value}`);
    }
  }).catch((err) => {
    console.log(err);
  });
}
const importToSystemHandler = () => {
  if (window.location.host.indexOf("kepler22.hr-mp.com") !== -1 || window.location.host.indexOf("kepler23.hr-mp.com") !== -1 || window.location.host.indexOf("mhs.hr-mp.com") !== -1) {
    importImmediately.value = false;
    return;
  }
  if (window.location.href.indexOf("h.zhaopin.com/SearchResume/SearchZhaopinResumeInfo") !== -1 || window.location.href.indexOf("h.zhaopin.com/ResumeManage/HaveDownLoadResumeDetail") !== -1 || window.location.href.indexOf("h.zhaopin.com/searchresume/searchzhaopinresumeinfo") !== -1 || window.location.href.indexOf("h.zhaopin.com/resumemanage/havedownloadresumedetail") !== -1) {
    new Promise((resolve) => {
      let pafBody = document.getElementsByClassName("mainbox")[0] as HTMLElement;
      loadPdf(resolve, pafBody); //获取智联卓聘简历内容
    }).then((val: any) => {
      getAttachment(val);
    });
  } else if (window.location.href.indexOf("rd6.zhaopin.com") !== -1) {
    new Promise((resolve) => {
      let pafBody = document.getElementsByClassName("resume-detail")[0] as HTMLElement;
      loadPdf(resolve, pafBody); //获取智联简历内容
    }).then((val: any) => {
      getAttachment(val);
    });
  } else if (!importImmediately.value && window.location.href.indexOf("www.zhipin.com") !== -1) {
    requestByBossPlatform({
      isImport: true,
    });
  } else if (!importImmediately.value && window.location.href.indexOf("maimai.cn") !== -1) {
    requestByMaiMaiPlatform({
      isImport: true,
    });
  } else if (!importImmediately.value && window.location.href.indexOf("h.liepin.com/resume/batchshowresume") !== -1) {
    try {
      let pafBody = document.getElementsByTagName("iframe")[0]?.contentWindow?.document.getElementsByTagName("body")[0].outerHTML;
      setTimeout(() => {
        _getCurrentHtml((convertedHTML: string) => {
          importImmediately.value = true;
          // 还原客户端状态
          try {
            document.querySelector(".artdeco-dismiss")?.click();
          } catch (error) {
          }
          resumeParse(convertedHTML, '');
        }, pafBody);
      }, 800);
      return;
    } catch (e) {
      console.log(e);
    }
    const title = document.head.querySelector("title")?.innerText;
    window.open(`${BASE_WEB_URL}candidate/index?att_id=${att_id.value}&plugin_import=1&joborder_id=${selectedProject.value.id || ""}&fromUrl=${window.location.href}&version=${version.value}`);
  } else if (!importImmediately.value && window.location.href.indexOf("linkedin.cn/incareer/in") !== -1) {
    new Promise((resolve) => {
      let pafBody = document.querySelectorAll(`[data-testid="data-test-identity-full-profile"]`)[0] as HTMLElement;
      loadPdf(resolve, pafBody);
    }).then((val) => {
      getAttachment(val);
    });
  } else if (!importImmediately.value && window.location.href.indexOf("linkedin.com/in") !== -1) {
    new Promise((resolve) => {
      let pafBody = document.querySelector(".scaffold-layout .scaffold-layout__inner main") as HTMLElement;
      loadPdf(resolve, pafBody);
    }).then((val) => {
      getAttachment(val);
    });
  } else {
    const title = document.head.querySelector("title")?.innerText;
    if (!att_id.value) {
      setTimeout(() => {
        _getCurrentHtml((convertedHTML: string) => {
          importImmediately.value = true;
          let url = window.location.href;
          resumeParse(convertedHTML, url.includes('maimai') ? getMaiMaiRequestCodeParam() : url.split('/').pop() + '_code');
        });
      }, 800);
    } else {
      window.open(`${BASE_WEB_URL}candidate/index?att_id=${att_id.value}&plugin_import=1&joborder_id=${selectedProject.value.id || ""}&fromUrl=${window.location.href}&version=${version.value}`);
      importImmediately.value = false;
    }
  }
}
const loadPdf = (resolve: Function, pdfBody: HTMLElement, dpi = 300) => {
  var that = this;
  html2canvas(pdfBody).then((canvas) => {
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;

    //一页pdf显示html页面生成的canvas高度;
    var pageHeight = (canvasWidth / 595.28) * 841.89;
    //pdf页面偏移
    var position = 0;
    //a4纸的尺寸[595.28,841.89]，html页面生成的canvas在pdf中图片的宽高
    var imgWidth = 555.28;
    var imgHeight = (555.28 / canvasWidth) * canvasHeight;

    var pageData = canvas.toDataURL("image/jpeg", 1.0);

    var pdf = new jsPDF("p", "pt", "a4");
    //有两个高度需要区分，一个是html页面的实际高度，和生成pdf的页面高度(841.89)
    //当内容未超过pdf一页显示的范围，无需分页
    if (canvasHeight < pageHeight) {
      pdf.addImage(pageData, "JPEG", 0, 0, imgWidth, imgHeight);
    } else {
      while (canvasHeight > 0) {
        pdf.addImage(pageData, "JPEG", 0, position, imgWidth, imgHeight);
        canvasHeight -= pageHeight;
        position -= 841.89;
        //避免添加空白页
        if (canvasHeight > 841.89) {
          pdf.addPage();
        }
      }
    }
    // const pageCount = pdf.internal.getNumberOfPages();
    // pdf.deletePage(pageCount);
    // if (BASE_WEB_URL === "https://kepler22.hr-mp.com/") {
    //   pdf.save(`${new Date().getTime()}.pdf`);
    // }
    // 将pdf输入为base格式的字符串
    let buffer = pdf.output("datauristring");
    // 将base64格式的字符串转换为file文件
    var myfile = dataURLtoFile(buffer, "简历.pdf");
    return resolve(myfile);
    // return formdata
    // 之后ajax传递数据
  });
}
const getPlatformConfig = () => {
  const host = window.location.host;
  return {
    isBoss: host.includes('zhipin.com'),
    isMaiMai: host.includes('maimai.cn'),
  };
}
// 获取页面 html
const _getCurrentHtml = (callback: Function, currentHtml?: string) => {
  const _html = document.documentElement.cloneNode(true) as HTMLHtmlElement;
  let html: string = currentHtml || _html.outerHTML;
  if (window.location.href.indexOf("linkedin.com/in") !== -1) {
    html = document?.querySelector('.scaffold-layout .scaffold-layout__inner main')?.outerHTML ?? '';
  }
  convertAllImg2Base64(html, callback);
}
/**
 * 获取 MaiMai 平台信息，以后会从接口动态获取
 * @return {}
 */
const getMaiMaiConfig = (): any => {
  const platformConfig = getPlatformConfig();
  const href = window.location.href;
  // 以下代表的是代表，必须具备同时只满足一个页面为true得条件
  const config = {
    isMaiMai: platformConfig.isMaiMai,
    // 个人主页
    profile_detail: {
      isPage: href.includes('/profile/detail'),
      apiCode: 'profile_detail_code',
    },
    // 找不到入口的个人主页
    profile_resume_detail: {
      isPage: href.includes('/profile/resume_detail'),
      apiCode: 'profile_resume_detail_code',
    },
    // 人才库
    ent_v41_groups: {
      isPage: href.includes('/ent/v41/groups'),
      apiCode: 'ent_v41_groups_code',
    },
    // 聊天
    ent_v41_im: {
      isPage: href.includes('/ent/v41/im'),
      apiCode: 'ent_v41_im_code',
    },
    // 招聘
    ent_v41_recruit_talents: {
      isPage: href.includes('/ent/v41/recruit/talents'),
      apiCode: 'ent_v41_recruit_talents_code',
    },
  };
  return config;
}
/**
 * 获取 MaiMai code
 * @param suffix 部分页面是 iframe ，这种情况， 在code后面拼一个参数，特殊处理
 * @return {string}
 */
const getMaiMaiRequestCodeParam = () => {
  const config = getMaiMaiConfig();
  let code = ``;
  if (config.isMaiMai) {
    const pages = Object.keys(config).filter(pageKey => pageKey !== 'isMaiMai');
    for (let i = 0; i < pages.length; i++) {
      const pageKey = pages[i];
      if (config[pageKey].isPage) {
        code = config[pageKey].apiCode;
        break;
      }
    }
  }
  const tab_n = getUrlQueryParam('tab');
  return `${code}${tab_n ? `_${tab_n}` : ''}`;
}
/**
 * 获取 MaiMai HTML 上下文
 */
const getMaiMaiHtmlContext = () => {
  let contextHtml = null;

  let contentElement = null;

  let errorMessage = null;

  const config = getMaiMaiConfig();
  if (config.isMaiMai) {
    if (config.profile_detail.isPage) {
      contentElement = document.querySelector('.PCcontent');
    }

    if (config.ent_v41_recruit_talents.isPage) {
      contentElement = document.querySelector('.ant-drawer.ant-drawer-right.ant-drawer-open');
    }

    if (config.ent_v41_groups.isPage) {
      contentElement = document.querySelector('.ant-drawer.ant-drawer-right.ant-drawer-open');
    }

    if (config.ent_v41_im.isPage) {
      contentElement = document.querySelector('.ant-drawer.ant-drawer-right.ant-drawer-open');
    }
  }
  return {
    contextHtml,
    contentElement,
    errorMessage,
  };
}
/**
 * MaiMai 平台 发送请求
 */
const requestByMaiMaiPlatform = (options = {isImport: false}) => {
  const config = getMaiMaiConfig();
  if (config.isMaiMai) {
    const context = getMaiMaiHtmlContext();
    if (!context.contentElement) {
      loading.value = false;
      console.error(`脉脉没有打开人才详情`, config, context);
      alert("脉脉平台需要点开简历详情");
      return;
    }
    _getCurrentHtml((convertedHTML: string) => {
      importImmediately.value = options.isImport;
      resumeParse(convertedHTML, getMaiMaiRequestCodeParam());
    });
  }
}
/**
 * 获取 Boss 平台信息，以后会从接口动态获取
 * @return {}
 */
const getBossConfig = (): any => {
  const platformConfig = getPlatformConfig();
  const href = window.location.href;
  // 以下代表的是代表，必须具备同时只满足一个页面为true得条件
  const config = {
    isBoss: platformConfig.isBoss,
    // 推荐牛人
    recommend: {
      isPage: href.includes('/web/chat/recommend'),
      apiCode: 'recommend_code',
    },
    // 搜索牛人
    search: {
      isPage: href.includes('/web/chat/search'),
      apiCode: 'search_code',
    },
    // 沟通
    index: {
      isPage: href.includes('/web/chat/index'),
      apiCode: 'index_code',
    },
    // 意向沟通
    intention: {
      isPage: href.includes('/web/chat/intention'),
      apiCode: 'intention_code',
    },
    // 互动
    interaction: {
      isPage: href.includes('/web/chat/interaction'),
      apiCode: 'interaction_code',
    },
    // 牛人管理
    manage: {
      isPage: href.includes('/web/chat/geek/manage'),
      apiCode: 'manage_code',
    },
  };
  return config;
}
/**
 * 获取 Boss HTML 上下文，当是 iframe 时，需要拿的是 iframe下的HTML 而不是当前的 HTML
 */
const getBossHtmlContext = () => {
  // 如果是人才详情是iframe，并且iframe的人才详情元素检查成功（），那么 contextHtml 就是iframe的HTML
  // 该值在发起请求时，作为传递获取HTML元素的上下文，该值没有，则传当前document的HTML
  let contextHtml = null;

  // 如果是iframe则为iframe的人才详情元素，如果不是则为当前页面的人才详情元素
  // 该值用来判断是否打开详情，弹框提示用户
  let contentElement = null;

  let isIframe = false;

  let errorMessage = null;

  const bossConfig = getBossConfig();
  if (bossConfig.isBoss) {
    if (bossConfig.search.isPage) {
      contentElement = document.getElementsByClassName("top")[0];
    }

    if (bossConfig.recommend.isPage) {
      contentElement = document.getElementsByClassName("dialog-wrap active")[0];
      const dialogElementList = document.querySelectorAll('.dialog-wrap');
      if (dialogElementList.length > 0) {
        if (dialogElementList.length === 1) {
          if (dialogElementList[0].classList.contains("resume-qcc")) {
            const iframe = document.getElementsByName("recommendFrame")[0] as HTMLIFrameElement;
            if (iframe) {
              isIframe = true;
              contentElement = iframe.contentWindow?.document.getElementsByClassName("resume-dialog")[0];
              if (contentElement) {
                contextHtml = iframe.contentWindow?.document.documentElement.outerHTML;
              }
            }
          }
        }
      } else {
        const iframe = document.getElementsByName("recommendFrame")[0] as HTMLIFrameElement;
        if (iframe) {
          isIframe = true;
          contentElement = iframe.contentWindow?.document.getElementsByClassName("resume-dialog")[0];
          if (contentElement) {
            contextHtml = iframe.contentWindow?.document.documentElement.outerHTML;
          }
        }
      }
    }

    if (bossConfig.intention.isPage) {
      const iframe = document.getElementsByTagName("iframe")[0] as HTMLIFrameElement;
      if (iframe) {
        isIframe = true;
        contentElement = iframe.contentWindow?.document.getElementsByClassName("intention-resume")[0];
        if (contentElement) {
          contextHtml = iframe.contentWindow?.document.documentElement.outerHTML;
        }
      }
    }

    if (bossConfig.interaction.isPage) {
      contentElement = document.getElementsByClassName("dialog-wrap active")[0];
      const dialogElementList = document.querySelectorAll('.dialog-wrap');
      if (dialogElementList.length > 0) {
        if (dialogElementList.length === 1) {
          if (dialogElementList[0].classList.contains("resume-qcc")) {
            const iframe = document.getElementsByName("interactionFrame")[0] as HTMLIFrameElement;
            if (iframe) {
              isIframe = true;
              contentElement = iframe.contentWindow?.document.getElementsByClassName("resume-item-content")[0];
              if (contentElement) {
                contextHtml = iframe.contentWindow?.document.documentElement.outerHTML;
              }
            }
          }
        }
      } else {
        const iframe = document.getElementsByName("interactionFrame")[0] as HTMLIFrameElement;
        if (iframe) {
          isIframe = true;
          contentElement = iframe.contentWindow?.document.getElementsByClassName("resume-item-content")[0];
          if (contentElement) {
            contextHtml = iframe.contentWindow?.document.documentElement.outerHTML;
          }
        }
      }
    }

    if (bossConfig.index.isPage) {
      contentElement = document.getElementsByClassName("resume-box")[0];
      if (!contentElement) {
        const iframe = document.getElementsByTagName("iframe")[0] as HTMLIFrameElement;
        if (iframe) {
          isIframe = true;
          contentElement = iframe.contentWindow?.document.getElementById("viewer");
          if (contentElement) {
            contextHtml = iframe.contentWindow?.document.documentElement.outerHTML;
          }
        }
      }
    }

    if (bossConfig.manage.isPage) {
      contentElement = document.getElementsByClassName("dialog-wrap")[0];
    }
  }
  return {
    isIframe,
    contextHtml,
    contentElement,
    errorMessage,
  };
}

/**
 * 获取Boss code
 * @param suffix 部分页面是 iframe ，这种情况， 在code后面拼一个参数，特殊处理
 * @return {string}
 */
const getBossRequestCodeParam = (suffix = '') => {
  const bossConfig = getBossConfig();
  let code = ``;
  if (bossConfig.isBoss) {
    const pages = Object.keys(getBossConfig()).filter(pageKey => pageKey !== 'isBoss');
    for (let i = 0; i < pages.length; i++) {
      const pageKey = pages[i];
      if (bossConfig[pageKey].isPage) {
        code = bossConfig[pageKey].apiCode;
        break;
      }
    }
  }
  return `${code}${suffix}`;
}

/**
 * Boss 平台 发送请求
 */
const requestByBossPlatform = (options = {isImport: false}) => {
  const bossConfig = getBossConfig();
  if (bossConfig.isBoss) {
    const bossContext = getBossHtmlContext();
    if (!bossContext.contentElement) {
      loading.value = false;
      console.error(`Boss没有打开人才详情`, bossConfig, bossContext);
      alert("boss直聘需要点开简历详情");
      return;
    }
    _getCurrentHtml((convertedHTML: string) => {
      importImmediately.value = options.isImport;
      resumeParse(convertedHTML, getBossRequestCodeParam(bossContext.isIframe ? '_iframe' : ''))
    }, bossContext.contextHtml as string);
  }
}
</script>
