import {defineConfig} from 'wxt';
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import {ElementPlusResolver} from "unplugin-vue-components/resolvers";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: "点聘 - 人才插件",
    description: "点聘 - 人才插件",
    version: "1.0.0",
    permissions: [
      "tabs",
      "activeTab",
      "tabCapture",
      "pageCapture",
      "storage",
      "downloads"
    ],
    action: {
      default_title: "点聘 - 人才插件",
      default_icon: {
        16: "icon/16.png",
        48: "icon/48.png",
        128: "icon/128.png"
      }
    }
  },
  vite: () => ({
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
  }),
});
