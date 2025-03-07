import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserInfo } from "@/utils/types";

export const useUserInfoStore = defineStore('userInfo',
  () => {
    const userInfo: any = ref(null);
    function setUserInfo(data: UserInfo) {
      userInfo.value = data;
    }
    return { userInfo, setUserInfo }
  },
  {
    persist: true
  })
