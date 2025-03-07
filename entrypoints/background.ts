import axios from "axios";
// import Qs from "qs";
// Executed when background is loaded
export default defineBackground(() => {
  console.log('Hello background!', {id: browser.runtime.id});
  let tabId: any = null;
  let userInfo: any = null;
  let axiosInstance = axios.create({
    baseURL: import.meta.env.WXT_BASE_URL,
    adapter: ['fetch'],
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    withCredentials: true,
    timeout: 50000,
  });
  axiosInstance.interceptors.request.use(
    async (config) => {
      config.headers.Authorization = `Bearer ${userInfo?.token}`;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  axiosInstance.interceptors.response.use(
    (response) => {
      return response.data;
    },
    (error) => {
      return Promise.reject(error);
    }
  )
  // 监听扩展安装事件
  browser.runtime.onInstalled.addListener(() => {
    console.log('onInstalled....');
  });
  // 监听消息（来自 popup/content script）
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    tabId = sender.tab?.id;
    const {type, payload} = request;
    const handleRequest = async () => {
      try {
        if (type === 'setUser') {
          await storage.setItem('local:__user__', payload);
          sendResponse({success: true});
        } else if (type === 'getUser') {
          const user: any = await storage.getItem('local:__user__');
          if(Object.prototype.toString.call(user) === '[object Object]') {
            userInfo = user;
          } else {
            userInfo = JSON.parse(user);
          }
          sendResponse(userInfo);
        } else if(type === 'getSelectOptions') {
          let url = payload.type === 'talent' ? '/v2/candidates' : '/v2/filter/project';
          const data: any = await axiosInstance.get(url, { params: payload.params });
          sendResponse(data);
        } else {
          sendResponse({error: 'INVALID_TYPE'}); // 强制响应
        }
      } catch (error: any) {
        sendResponse({error: error.message}); // 错误处理
      }
    };
    handleRequest();
    return true;
  });
  // 监听浏览器工具栏点击
  // browser.action.onClicked.addListener((tab) => {
  //   console.log("Toolbar icon clicked", tab);
  //   browser.tabs.captureVisibleTab().then((dataUrl) => {
  //     downloadImage(dataUrl);
  //   });
  // });
});
async function getUserInfo() {
  const userStr = await storage.getItem('local:__user__') as string;
  return JSON.parse(userStr);
}
// function sendMessageToForeground(type: string, data: any, callback?: Function) {
//   browser.tabs.sendMessage(tabId, {
//     type,
//     data,
//   }, (response: any) => {
//     if (browser.runtime.lastError) {
//       console.log(browser.runtime.lastError);
//     } else {
//       callback && callback(response);
//     }
//   });
// }

// async function downloadImage(dataUrl: string): Promise<void> {
//   const filename = `Screenshot-${new Date().toISOString().replaceAll(":", "-")}.png`;
//   console.log(`Downloading image: ${filename}`, {dataUrl});
//
//   if (import.meta.env.MANIFEST_VERSION === 3) {
//     // There are known issues with download images in background scripts: https://issues.chromium.org/issues/40774955
//     // But this works well enough for small screenshots
//     await browser.downloads.download({
//       url: dataUrl,
//       filename,
//     });
//   } else {
//     // Use "createObjectURL" for MV2
//     const blob = dataUrltoBlob(dataUrl);
//     const objectUrl = URL.createObjectURL(blob);
//     await browser.downloads.download({
//       url: objectUrl,
//       filename,
//     });
//   }
// }
