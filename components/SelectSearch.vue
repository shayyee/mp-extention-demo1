<template>
  <el-select
      v-model="searchVal"
      filterable
      remote
      :placeholder="placeholder"
      :remote-method="remoteMethod"
      :loading="loading"
      @popup-scroll="handleScroll"
  >
    <template v-if="type === 'talent'">
      <el-option
          v-for="item in options"
          :key="item.id"
          :label="`${item.name} - ${item.company_name}`"
          :value="item.id"
      >
        <div class="item-tag">
          <span class="user-text flex-extensive">{{item.name}} - {{item.company_name}}</span>
          <span v-if="item.similarity" class="similarity flex-none">相似度 {{ item.similarity }}</span>
        </div>
      </el-option>
    </template>
    <template v-else>
      <el-option
          v-for="item in options"
          :key="item.id"
          :label="`#${item.id} ${item.name} - ${item.client_name}`"
          :value="item.id"
      >
        <div class="item-tag">
          <div class="left">
            <span>#{{item.id}}</span>
            <span class="text-dark">{{item.name}}</span>
            -
            <span class="color">{{item.client_name}}</span>
          </div>
        </div>
      </el-option>
    </template>
  </el-select>
</template>

<script setup lang="ts">
import { sendMessageToBackground } from "@/utils";
const props = defineProps({
  type: {
    type: String,
    default: 'talent'
  },
  placeholder: {
    type: String,
    default: '请选择'
  },
  userId: {
    type: Number,
    default: undefined
  }
})
const { type, userId } = toRefs(props)
const options = ref<any[]>([])
const loading = ref(false)
const searchVal = ref('');
const pageIndex = ref(1)
const total = ref(0)

const getData = (keyword: string) => {
  loading.value = true;
  let obj: any = {
    page: pageIndex.value,
    page_size: 25,
    keyword: keyword,
  };
  if (type.value === "project") {
    obj.joborderuser_id = Number(userId?.value);
    obj.job_status = "Live";
  }
  sendMessageToBackground("getSelectOptions", {
    type: type.value,
    params: obj,
  }, (res: any) => {
    if (res.data.list.length > 0) {
      options.value = options.value.concat(res.data.list);
    }
    total.value = res.data.count;
    loading.value = false;
  });
}
const remoteMethod = (query: string) => {
  options.value = [];
  pageIndex.value = 1;
  getData(searchVal.value);
}
const handleScroll = (e: any) => {
  if (options.value.length < total.value) {
    //加载数据判断
    if (e.target.scrollHeight - e.target.offsetHeight - e.target.scrollTop < 100) {
      pageIndex.value++;
      getData(searchVal.value);
    }
  }
}
</script>

<style scoped>

</style>
