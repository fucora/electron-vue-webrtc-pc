<template>
  <div class="tool-bar-center">
      <!-- 设置 -->
      <!-- <a href="javascript:;" class="tool-item pull-left toggle-sidebar" title="设置">
        <i class="tool-icon icon-mdi-setup-video"></i>
      </a> -->

      <!-- 摄像头开关 -->
      <a href="javascript:;" class="tool-item" @click="handleCamera()" title="摄像头">
        <i class="tool-icon" :class="[cameraMuted ? 'red icon-mdi-videocam-off' : 'icon-mdi-videocam']"></i>
        <span>摄像头</span>
      </a>
      <!-- 麦克风开关 -->
      <a href="javascript:;" class="tool-item" @click="handleMicrophone()" title="麦克风">
        <i class="tool-icon" :class="[microphoneMuted ? 'red icon-mdi-moff' : 'icon-mdi-mic']"></i>
        <span>语音</span>
      </a>
      <!-- 扬声器开关 -->
      <a href="javascript:;" class="tool-item" @click="handleMute()" title="扬声器">
        <i class="tool-icon" :class="[volumeMute ? 'red icon-mdi-volume-down' : 'icon-mdi-volume-up']"></i>
        <span>扬声器</span>
      </a>

      <!-- 共享 -->
      <a href="javascript:;" class="tool-item" title="共享应用程序" v-show="!screenShareMode" @click="startScreenShare()">
        <i class="tool-icon icon-share-screen"></i>
        <span>共享桌面</span>
      </a>
      <a href="javascript:;" class="tool-item" title="共享图片或pdf" v-show="!screenShareMode" @click="addFileDialog=true">
        <i class="tool-icon icon-share-files"></i>
        <span>共享文件</span>
      </a>
      <a href="javascript:;" class="tool-item red" title="停止共享" v-show="screenShareMode" @click="stopScreenShare()">
        <i class="tool-icon icon-share-stop red"></i>
        <span>停止共享</span>
      </a>
      <a href="javascript:;" class="tool-item" title="共享窗口" v-show="(prentAcceptScreen || screenShareMode) && !presentationWindow" @click="popOutPresentation()">
        <i class="tool-icon icon-share-popout"></i>
        <span>共享窗口</span>
      </a>

      <!-- 全屏 -->
      <a href="javascript:;" class="tool-item" @click="handleFullScreen()" title="全屏">
        <i class="tool-icon" :class="[fullScreen ? 'icon-mdi-fullscreen-exit' : 'icon-mdi-fullscreen']"></i>
        <span>全屏</span>
      </a>
      <!-- 显示/隐藏 参会者列表 -->
      <a href="javascript:;" class="tool-item pull-right toggle-sidebar" @click="toggleSideBar()">
        <i class="tool-icon" :class="[sideBarState ? 'icon-arrow-right' : 'icon-arrow-left']"></i>
      </a>

      <!-- 发起共享选择 展示内容 -->
      <el-dialog
        title="选择展示内容"
        :visible.sync="addFileDialog"
        append-to-body
        width="30%">
        <div style="text-align: right">
          <input id="input-slide-files" ref="filElem" type="file" multiple style="width:0; height: 0; overflow: hidden" accept="application/pdf, .pdf, image/*" @change="addSlides" />
          <label for="input-slide-files" class='btn btn-success'>
            <el-button type="primary" v-show="slideShareObj.slides.length" @click="deleteAllSlides">清除所有文件</el-button>
            <el-button type="primary" @click="choiceImg">增加文件</el-button>
          </label>
        </div>
        <!-- 预览已选择的图片/文件 -->
        <div style="text-align:center;" >
          <div class="slide-thumbnail" v-for="(slide,index) in slideShareObj.slides" :key="index" :style="{backgroundImage: 'url('+slide.objectURL+')'}">
            <div class="slide-delete" @click="deleteSlide(index)">
              <i class="tool-icon icon-tool-delete"></i>
            </div>
            <div class="badge-container">
              <div class="badge blue">
                {{index + 1}}
              </div>
            </div>
          </div>
          <!-- w未选择文件时 -->
          <div v-show="!slideShareObj.slides.length && slideShareObj.loadingSlideCount() < 1">
              无图片/幻灯片
          </div>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button @click="cancelUpload()">取 消</el-button>
          <el-button type="primary" v-show="slideShareObj.slides.length" @click="slideShareStart()">启动展示</el-button>
        </span>
      </el-dialog>

      <el-dialog
        title="共享屏幕"
        :visible.sync="screenDialog"
        append-to-body
        width="80%">
        <Screen v-on:emitlistenScreenShareMode="showScreenShareMode" />
      </el-dialog>

    </div>
</template>

<script>
import rtc from '../util/webrtc/lib/svocRTC';
import slideShare from '../util/webrtc/lib/slideShare';
import {common} from '../util/common';
import Screen from "../views/screenWindow.vue";
export default {
  name: 'Toolbar',
  props: ['parentScreenShareMode','prentAcceptScreen'],
  data() {
    return {
      screenDialog: false,
      cameraMuted: false,
      microphoneMuted: false,
      volumeMute: false,
      volumeValue: 1,
      fullScreen: false,
      sideBarState: true,
      slideShareObj: {
        slides: slideShare.slides,
        loadingSlideCount: slideShare.loadingSlideCount,
        currentSlide: 0,
      },
      addFileDialog: false,
      currentSlide: 0,
      screenShareMode: '',
      presentationImgSrc: '',
      presentationWindow: false // 是否打开了独立的共享窗口
    }
  },
  components: {
    Screen
  },
  methods: {
    // 摄像头
    handleCamera() {
      rtc.toggleCamera();
      this.cameraMuted = !this.cameraMuted;
    },
    // 麦克风
    handleMicrophone() {
      rtc.toggleMicrophone();
      this.microphoneMuted = !this.microphoneMuted;
    },
    // 扬声器
    handleMute() {
      if(this.volumeValue > 0) {
        this.volumeValue = 0
        this.volumeMute = true;
      }else{
        this.volumeValue = 1;
        this.volumeMute = false;
      }
      this.$store.commit('setLocalVolume', this.volumeValue);
      // this.volumeMute = !this.volumeMute;
    },
    // 全屏
    handleFullScreen() {
      let element = document.documentElement;
      common.fullScreen(element);

      this.fullScreen = !this.fullScreen;
      // this.fullScreen = !this.fullScreen;
    },
    // 显示/隐藏 右侧参会者列表
    toggleSideBar() {
      this.sideBarState = !this.sideBarState;
      this.$store.commit('setSideBarState', this.sideBarState);
    },

    // 共享
    // 选择共享文件
    choiceImg(){
      this.$refs.filElem.dispatchEvent(new MouseEvent('click'))
    },
    addSlides() {
      let that = this;
      const inputFile = this.$refs.filElem.files;
      slideShare.addSlidesFromFiles(inputFile);
    },
    // 移除某个共享文件
    deleteSlide(index){
      slideShare.deleteSlide(index);
    },
    // 清空已选择的文件
    deleteAllSlides(){
      slideShare.resetSlideCount();
      // const _data = new Set(slideShare.slides)
      // _data.clear()
      // const newSlide = [...slideShare.slides];
      // newSlide = new Set();
      // 深拷贝
      slideShare.slides = [...[]]
      this.slideShareObj.slides = slideShare.slides;
      console.log(slideShare.slides)
    },
    // 开始共享
    slideShareStart(){
      let that = this;
      if(slideShare.slides){
        that.currentSlide = that.slideShareObj.currentSlide = 0;
        rtc.imageShareStart(function () {
          setTimeout(() => {
            that.screenShareMode = 'screen_http';
            that.$emit('emitlistenScreenShareMode', 'screen_http'); // 向父组件传值
            rtc.presentationImgSrc = that.presentationImgSrc = slideShare.slides[that.currentSlide].dataURL;
            rtc.imageShareSetImage(slideShare.slides[that.currentSlide].blob)
            that.addFileDialog = false;
          });
        })
      }
    },
    // 下一页
    nextSlide() {
      this.currentSlide = this.slideShareObj.currentSlide = (this.currentSlide + 1) % slideShare.slides.length;
      rtc.presentationImgSrc = slideShare.slides[this.currentSlide].dataURL;
      rtc.imageShareSetImage(slideShare.slides[this.currentSlide].blob);
    },
    // 上一页
    previousSlide() {
      this.currentSlide = this.slideShareObj.currentSlide = (this.currentSlide - 1) % slideShare.slides.length;
      if (this.currentSlide < 0) {
        this.currentSlide = this.slideShareObj.currentSlide = slideShare.slides.length - 1;
      }
      rtc.presentationImgSrc = slideShare.slides[this.currentSlide].dataURL;
      rtc.imageShareSetImage(slideShare.slides[this.currentSlide].blob);
    },
    // 取消共享
    cancelUpload(){
      this.addFileDialog = false;
      slideShare.resetSlideCount();
    },
    // 停止共享
    stopScreenShare() {
      rtc.stopScreenShare();
      this.screenShareMode = '';
      this.$emit('emitlistenScreenShareMode', ''); // 向父组件传值
      this.presentationImgSrc = '';
      // 通知主进程关闭独立的共享窗口
      if(this.presentationWindow){
        this.presentationWindow = false;
        this.$electron.ipcRenderer.send('presentation-window', 'close')
      }
      

    },
    // 共享桌面应用程序
    startScreenShare() {
      this.screenDialog = true;
    },
    // sureScreenShare(id) {
    //   this.screenShareMode = 'screen';
    //   this.$emit('emitlistenScreenShareMode', 'screen'); // 向父组件传值
    // },
    showScreenShareMode(data) {
      this.screenShareMode = data;
      this.$emit('emitlistenScreenShareMode', 'screen'); // 向父组件传值
      this.screenDialog = false;
    },
    
    // 共享窗口 打开一个新的独立窗口
    popOutPresentation() {
      this.presentationWindow = true;
      const icp = this.$electron.ipcRenderer;
      icp.send('presentation-window', 'open')
      // this.$emit('emitPresentationWindow', this.presentationWindow);
      console.log('popOutPresentation')
    },

    /******************** 测试代码 *************************/
    startScreenShare_() {
      // const icp = this.$electron.ipcRenderer;
      // icp.send('screen-window')
      this.screenDialog = true;
    },
  /***************************测试代码 *************************/

  },
  watch: {
    // watch 深度监听
    slideShareObj: {
      handler(curval) {
        // console.log(curval)
         console.log('深度监听 slideShareObj-----',curval)
        this.slideShareObj = curval;
        this.$emit('emitSlideShareObj', curval);
      },
      deep:true
    },
    slideShare: {
      handler(curval) {
        console.log('深度监听 slideShare-----',curval)
        this.slideShareObj.slides = curval.slides
      },
      deep:true
    },
    
    presentationWindow(curVal) {
      this.$emit('emitPresentationWindow', curVal)
    },
    parentScreenShareMode(curVal) {
      console.log('深度监听 parentScreenShareMode-----', curVal)
      this.screenShareMode = curVal;
    },
  },
  mounted() {
    let _this = this;
    // 监听主进程中的值，改变独立窗口的状态
    this.$electron.ipcRenderer.on('ipcPresentationWin', function (event, data) {
      console.log('获取到的是主进程中 presentationWin 的状态====', data)
      _this.$nextTick(() =>{
        _this.presentationWindow = data;
      })
     
    })
  }

}
</script>

<style scoped>
/* 工具操作部分 */
.tool-bar-center{
  text-align: center;
}
.toggle-sidebar{
  margin: 14px 5px;
}
.slide-thumbnail{
  position: relative;
  display: inline-block;
  width: 160px;
  height: 90px;
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
  margin: 4px;
  border-radius: 2px;
}

.slide-delete {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #212121;
  opacity: .87;
  line-height: 90px;
  font-size: 32px;
  text-align: center;
  text-shadow: 1px 1px 1px black;
  color: white;
  cursor: pointer;
  border-radius: 2px;
}
.slide-thumbnail:hover .slide-delete {
  display: block;
}
.badge-container {
  position: absolute;
  right: -4px;
  bottom: -4px;
  font-weight: bolder;
  text-align: center;
  white-space: nowrap;
  font-size: 10px;
  line-height: 10px;
  overflow: hidden;
}
.badge {
  display: inline-block;
  height: 17px;
  width: 17px;
  line-height: 17px;
  color: #f2f2f2;
  /* padding: 3px; */
  border-radius: 50%;
  -webkit-box-shadow: inherit;
  box-shadow: inherit;
  background-color: #069cf5;
}
</style>
