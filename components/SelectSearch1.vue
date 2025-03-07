<template>
  <div class="crx-selectSearchFromDatabase" ref="selectSearchRef">
    <el-popover
        trigger="click"
        placement="bottom"
        v-model="visible"
        @show="showPopover"
        @hide="hide"
        :width="width"
        :offset="5"
        popper-class="crx-selectDataPopover"
    >
      <el-input
          :suffix-icon="icon"
          class="match-plugin-input"
          placeholder="请输入搜索条件"
          v-model="searchVal"
      ></el-input>

      <ul class="dataList" @scroll="scroll">
        <!-- 候选人列表渲染 -->
        <template v-if="type === 'talent'">
          <li
              v-for="(item, index) in dataList"
              :key="index"
              class="item-tag match-point-flex"
              @click="checkUser(item)"
          >
            <span class="user-text flex-extensive">{{ item.name }} - {{ item.company_name }}</span>
            <span v-if="item.similarity" class="similarity flex-none">相似度 {{ item.similarity }}</span>
          </li>
        </template>
        <!-- 候选人列表渲染 -->

        <!-- 项目列表渲染 -->
        <template v-else-if="type === 'project'">
          <li
              v-for="(item, index) in dataList"
              :key="index"
              class="item-tag"
              @click="checkUser(item)"
          >
            <div class="left">
              <span>#{{ item.id }}</span>
              <span class="text-dark">{{ item.name }}</span> - <span class="color">{{ item.client_name }}</span>
            </div>
          </li>
        </template>
        <!-- 项目列表渲染 -->

        <template v-if="!useList">
          <li v-if="dataList.length === 0 && !searching">
            <span>暂无搜索结果</span>
          </li>
          <li v-if="loading" class="padding text-center">
            <span>加载结果中...</span>
            <i class="el-icon-loading"></i>
          </li>
          <li v-if="error" class="padding text-center" style="color: red;">
            <span>加载失败，{{ error.message }}</span>
          </li>
        </template>
      </ul>

      <div slot="reference" id="reference" class="normal">
        <!-- 候选人 -->
        <template v-if="type === 'talent'">
          <div v-if="itemDetail.id" class="item-tag">
            <span>{{ itemDetail.name }} - {{ itemDetail.company_name }}</span>
            <i class="el-icon-close" @click.stop="clear"></i>
          </div>
          <div v-else style="color: #999;">请选择候选人</div>
        </template>
        <!-- 候选人 -->

        <!-- 项目 -->
        <template v-else-if="type === 'project'">
          <div v-if="itemDetail.id" class="item-tag">
            <span>#{{ itemDetail.id }}</span>
            <span class="text-dark">{{ itemDetail.job_title }}</span>
            <span v-if="itemDetail.client_name" class="color">-{{ itemDetail.client_name }}</span>
          </div>
          <div v-else style="color: #999;">请选择项目</div>
        </template>
        <!-- 项目 -->

        <span v-else style="color: #999;">请选择<i class="el-icon-caret-bottom"></i></span>
      </div>
    </el-popover>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onBeforeUpdate } from 'vue';
import { deepClone } from "@/utils";

const props = defineProps({
  type: {
    type: String,
    default: 'talent',
  },
  placeholder: {
    type: String,
    default: '请选择',
  },
  value: {
    type: Object,
    default: () => ({}),
  },
  list: Array,
  useList: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: Number,
    default: undefined,
  },
});

const emit = defineEmits(['checkVal', 'requestList']);

const selectSearchRef = ref<any>(null);
const searchVal = ref('');
const visible = ref(false);
const icon = ref('el-icon-loading');
const page = ref(1);
const dataList = ref<any[]>([]);
const count = ref(0);
const searching = ref(true);
const loading = ref(false);
const itemDetail = ref(deepClone(props.value));
const width = ref('');
const error = ref<any>(null);

watch(searchVal, (val) => {
  page.value = 1;
  icon.value = 'el-icon-loading';
  searching.value = true;
  getDataList(val);
});

watch(() => props.value, (newVal) => {
  itemDetail.value = deepClone(newVal);
});

watch(() => props.list, () => {
  if (props.useList) {
    dataList.value = props.list || [];
  }
});

onBeforeUpdate(() => {
  const ele = selectSearchRef.value?.$el;
  width.value = ele.offsetWidth;
});

const clear = () => {
  searchVal.value = '';
  itemDetail.value = {};
  emit('checkVal', {});
};

const showPopover = () => {
  dataList.value = [];
  page.value = 1;
  icon.value = 'el-icon-loading';
  getDataList(searchVal.value);
};

const getDataList = (val: string) => {
  if (props.useList) {
    searching.value = false;
    loading.value = false;
    error.value = null;
    dataList.value = props.list || [];
    return;
  }
  const obj: any = {
    page: page.value,
    page_size: 25,
    keyword: val,
  };
  if (props.type === 'project') {
    obj.joborderuser_id = Number(props.userId);
    obj.job_status = 'Live';
  }
  searching.value = true;
  loading.value = true;
  error.value = null;
  emit('requestList', props.type, obj);
};

const onDataListResponse = (res: any) => {
  if (res instanceof Error) {
    loading.value = false;
    error.value = new Error('错误原因：' + res.message);
    return;
  }
  if (res.code !== 200) {
    loading.value = false;
    error.value = new Error('错误代码：' + res.code);
    return;
  }
  const data = res.data;
  searching.value = false;
  loading.value = false;
  icon.value = 'icon icon-search';
  if (page.value === 1) {
    dataList.value = data.list;
  } else {
    dataList.value = dataList.value.concat(data.list);
  }
  dataList.value = uniqueFunc(dataList.value, 'id');
  count.value = data.count;
};

const uniqueFunc = (arr: any[], uniId: string) => {
  const res = new Map();
  return arr.filter((item) => !res.has(item[uniId]) && res.set(item[uniId], 1));
};

const scroll = (e) => {
  if (dataList.value.length < count.value) {
    if (e.target.scrollHeight - e.target.offsetHeight - e.target.scrollTop < 100) {
      page.value += 1;
      getDataList(searchVal.value);
    }
  }
};

const checkUser = (data: any) => {
  itemDetail.value = data;
  visible.value = false;
  emit('checkVal', data);
};

const hide = () => {
  searching.value = true;
};
</script>
<style>
.crx-selectSearchFromDatabase {
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  box-sizing: border-box;
  color: #606266;
  line-height: 30px;
  height: 30px;
  padding: 0 25px 0 15px;
  font-size: 14px;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.crx-selectSearchFromDatabase .normal {
  font-size: 13px;
  color: #262626;
  outline: 0;
  height: 100%;
  position: relative;
}

.crx-selectSearchFromDatabase .normal .item-tag {
  padding: 0;
  flex-wrap: nowrap;
}

.crx-selectSearchFromDatabase .normal .item-tag span {
  white-space: nowrap;
  overflow: hidden;
}

.crx-selectSearchFromDatabase .normal .el-icon-close,
.crx-selectSearchFromDatabase .normal .el-icon-caret-bottom {
  position: absolute;
  right: -18px;
  top: 8px;
}

.crx-selectSearchFromDatabase .crx-selectDataPopover .search-loading {
  line-height: 26px;
  font-size: 13px;
}

.crx-selectDataPopover .dataList {
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
}

.crx-selectSearchFromDatabase .crx-selectDataPopover .el-input__suffix .el-icon-circle-close {
  display: none;
}

.crx-selectSearchFromDatabase .item-tag {
  display: flex;
  flex-wrap: wrap;
  padding: 3px 7px 4px;
  cursor: pointer;
  align-items: center;
}

.crx-selectDataPopover .item-tag .left {
  padding: 10px;
}

.crx-selectDataPopover .item-tag .head {
  width: 28px;
  height: 28px;
  background: #FCFCFC;
  border: 1px solid #E3E3E3;
  border-radius: 100%;
  overflow: hidden;
  margin-right: 5px;
  display: inline-block;
  vertical-align: middle;
}


.crx-selectDataPopover .item-tag .head .noImg {
  width: 100%;
  height: 100%;
  line-height: 26px;
  text-align: center;
}


.crx-selectDataPopover .item-tag .head img {
  display: block;
  width: 100%;
  height: 100%;
}


.crx-selectDataPopover .item-tag span {
  word-break: break-all;
  word-wrap: break-word;
}

.crx-selectSearchFromDatabase .user-text {
  flex: 1;
  word-break: break-all;
  word-wrap: break-word;
}

.crx-selectSearchFromDatabase .company-text {
  display: flex;
  width: 100%;
  justify-content: space-between;
  flex-wrap: wrap;
  color: #999;
}

.crx-selectSearchFromDatabase .company-text .color {
  color: #FA7E7A;
}
.crx-selectDataPopover .item-tag .similarity {
  padding: 5px;
  color: cornflowerblue;
}

.crx-selectDataPopover .item-tag:hover {
  background: #3396F7;
  color: white;
}
.crx-selectDataPopover .item-tag:hover .similarity {
  color: white;
}
.crx-selectDataPopover .item-tag:hover .head {
  color: black;
}

.crx-selectSearchFromDatabase .crx-selectDataPopover {
  min-height: 260px;
}
</style>
