<template>
<!-- 呼叫速率 -->
  <div class="definitionPage">
    <div class="sidebar-left">
      <span>选择呼叫速率</span>
      <el-select v-model="resolution" placeholder="请选择呼叫速率" @change="setResolution">
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
    </div>
    
  </div>
</template>

<script>
import { common } from '../../util/common';
export default {
  name: "definitionPage",
  data() {
    return {
      options: [{
          value: '192',
          label: '256kbps',
        }, {
          value: '448',
          label: '512kbps',
        }, {
          value: '704',
          label: '768kbps',
        }, {
          value: '958',
          label: '1024kbps',
        }, {
          value: '1984',
          label: '2048kbps',
        }, {
          value: '2496',
          label: '2560kbps',
        }, {
          value: '3008',
          label: '3072kbps',
        }, {
          value: '4032',
          label: '4096kbps',
        }],
        resolution: '958' // 默认带宽
    }
  },
  methods: {
    setResolution() {
      console.log('setResolution====>', this.resolution)
      this.$store.commit("setResolution", this.resolution);
      common.setLocstorage('defaultBandwidth', this.resolution)
    }
  }
};
</script>

<style scoped>
  
</style>