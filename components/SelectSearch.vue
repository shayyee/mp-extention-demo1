<template>
  <el-select
      ref="selectSearchRef"
      v-model="value"
      value-key="id"
      filterable
      clearable
      remote
      :placeholder="placeholder"
      :remote-method="remoteMethod"
      :loading="loading"
      popper-class="select-search-popper"
  >
    <template v-if="type === 'talent'">
      <el-option
          v-for="item in options"
          :key="item.id"
          :label="`${item.name} - ${item.company_name}`"
          :value="item"
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
          :value="item"
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
const { type, userId, placeholder } = toRefs(props)
const selectSearchRef = ref<any>(null)
const options = ref<any[]>([])
const loading = ref(false)
const value = ref(0)
const searchVal = ref('');
const pageIndex = ref(1)
const total = ref(0)
watch([value, searchVal], (data) => {
  console.log(data)
})
const getData = (keyword: string) => {
  console.log(selectSearchRef.value)
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
  searchVal.value = query;
  options.value = [];
  pageIndex.value = 1;
  getData(query);
}
const handleScroll = () => {
  console.log(selectSearchRef.value.popperRef.querySelector(".el-select-dropdown__wrap"));
  if (options.value.length < total.value) {
    //加载数据判断
    // if (e.target.scrollHeight - e.target.offsetHeight - e.target.scrollTop < 100) {
    //   pageIndex.value++;
    //   getData(searchVal.value);
    // }
  }
}
</script>

<style lang="scss">
.select-search-popper {
  .item-tag {
    display: flex;
    flex-wrap: wrap;
    padding: 3px 7px 4px;
    cursor: pointer;
    align-items: center;
  }
}
</style>
