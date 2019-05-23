<template>
  <div class="">
      <!-- 会议主画面 -->
      <div class="meeting-stage" :class="{ 'fullmeeting': !sideBar}">
        <!-- header -->
        <div class="meeting-bar header-bar">
          <el-row type="flex" class="row-bg" justify="space-around">
            <el-col :sm="6" :md="8">
              <div class="conference-msg">
                <el-popover
                  placement="top-start"
                  trigger="hover">
                  <span slot="reference">{{conferenceDetail.conference.conferenceName}} <i class="icon-arrow-right" style="font-size:14px;"></i></span>
                  <div>
                    <p>会议号：{{ conferenceDetail.conference.vmrNumber }}</p>
                    <p>密  码：{{ conferenceDetail.conference.visitorPwd }}</p>
                    <p>发起人：{{ conferenceDetail.conference.s.realName }}</p>
                  </div>
                </el-popover>
              </div>
            </el-col>
            <el-col :sm="10" :md="14">
              <div class="conference-status">
                <el-tooltip class="item" effect="light" content="入会时长" placement="bottom">
                  <span>{{meetingTimer.timeLong}}</span>
                </el-tooltip>
                <span>|</span>
                <span class="network" @click="getMediaStatistics()">
                  <i class=" icon-conference-network" :class="{'network-good':percentageLost<=10, 'network-general': percentageLost>10 && percentageLost<20, 'network-bad':percentageLost>=20}"></i>
                  <span v-if="percentageLost<=10">网络良好</span>
                  <span v-if="percentageLost>10 && percentageLost<20">网络一般</span>
                  <span v-if="percentageLost>=20">网络不佳</span>
                </span>
              </div>
            </el-col>
            <el-col :sm="4" :md="2">
                <!-- 挂断 -->
              <a href="javascript:;" class="tool-item disconnect-btn" title="挂断" @click="disconnectDialog=true">
                <i class="tool-icon icon-mdi-call-end red"></i>
              </a>
            </el-col>
          </el-row>
        </div>

        <!-- main -->
        <div class="conn-main">
          <!-- 本地画面 -->
          <div class="right-video">
            <div class="local-video" v-show="!selfView.hidden">
              <video id="localVideo" class="" autoplay muted/>
            </div>
            <!-- <img src="../assets/img/camera-off.svg" v-show="rtc.cameraMuted"> -->
            <div class="self-view-toolbar" @click="toggleSelfView()">
              <a href="javascript:;" class="icon-conference-reduce" title="隐藏" v-show="!selfView.hidden"></a>
              <a href="javascript:;" class="icon-conference-add" title="显示" v-show="selfView.hidden"></a>
            </div>
          </div>
          <!-- v-rtcVolume="$store.getters.getLocalVolume"  -->
          <audio autoplay v-show="!remoteStream && remoteAudioStream" /> 
          <!-- 远端画面 -->
          <div class="remote-video" @click="presentationMaximized=false" :class="[presentationMaximized && !presentationWindow && (presentationImgSrc || presentationVideoSrc) ? 'left-video' : 'main-video']">
            <video v-show="!spinnerTimer" id="remoteVideo" autoplay />
            <img v-show="spinnerTimer" class="loading-image" src="../assets/img/video-spinner.svg" />
          </div>


          <!-- 双流画面 -->
          <div class="presentation-video" @click="presentationMaximized=true" :class="[presentationMaximized && !presentationWindow ? 'main-video' : 'left-video']" 
          v-show="(presentationImgSrc || presentationVideoSrc) && (!presentationWindow)">
            <video v-show="presentationVideoSrc && presentationVideoSrc != {}" id="presentationVideo" autoplay></video>
            <img v-show="presentationImgSrc" class="presentation-image sel-presentation-jpeg" id="presentationImgSrc" :src="presentationImgSrc"/>

            <!-- 切换共享的图片和pdf文件 -->
            <div class="presentation-toolbar" v-on:click.stop v-if="screenShareMode === 'screen_http' && slideShareObj.slides.length > 1">
              <span class="button-group">
                <a href="javascript:;" class="toolbar-button" @click="previousSlide"> <i class="icon-arrow-left"></i> </a>
                <span class="slide-counter">{{slideShareObj.currentSlide + 1}} / {{slideShareObj.slides.length}}</span>
                <a href="javascript:;" class="toolbar-button" @click="nextSlide"><i class="icon-arrow-right"></i></a>
              </span>
            </div>

            <div class="presentation-name">共享显示源:{{presentationName}}</div>
          </div>
          <!-- <div v-show="(presentationVideoSrc || presentationImgSrc) && !presentationWindow" class="screenShare-view-toolbar" @click="toggleScreenShareView()">
            <a href="javascript:;" class="icon-conference-reduce" title="隐藏" v-show="!screenShareView.hidden"></a>
            <a href="javascript:;" class="icon-conference-add" title="显示" v-show="screenShareView.hidden"></a>
          </div> -->
          <!-- todo -->
        </div>

        <!-- 底部操作栏 -->
        <div class="meeting-bar tool-bar">
          <toolbar ref="toolbarchild" 
          v-on:emitlistenScreenShareMode="showScreenShareMode" 
          v-on:emitSlideShareObj="showSlideShareObj"
          v-on:emitPresentationWindow="getPercentageWindow"
          v-bind:parentScreenShareMode="screenShareMode"
          v-bind:prentAcceptScreen="acceptScreenShare"></toolbar>
        </div>
      </div>

      <!-- 参会者列表 -->
      <div class="side-bar" :class="{ 'hide-sidebar': !sideBar}">
        <participantList> </participantList>
      </div>

      <!-- 挂断 弹出框 -->
      <el-dialog
        title="挂断"
        :visible.sync="disconnectDialog"
        width="38%">
        <span>结束会议之后，参会人员将被强制退出会议。</span>
        <span slot="footer" class="dialog-footer">
          <el-button @click="disconnectDialog = false">取 消</el-button>
          <el-button v-if="havePermission" type="primary" @click="closeConference()">结束会议</el-button>
          <el-button type="primary" @click="disconnect()">离开会议</el-button>
        </span>
      </el-dialog>

      <!-- 网络状态 弹出框 -->
      <el-dialog
        :visible.sync="statisticsDialog"
        width="40%"
        :modal="false"
        custom-class='statics-dialog'
        >
        <div >
          <el-row>
            <!-- <h4>呼出</h4> -->
            <ul id="outgoing">
              <li class="statistics-type" v-for="(mediatype_data, direction) in statisticsObj" :key="direction" style="padding-left:60px;">
                <p class="statistics-direction">{{direction | translateStatic}}</p>
                <div class="statistics-data" v-for="(stats, mediatype) in mediatype_data" :key="mediatype">
                  <p class="statistics-media-type">{{mediatype | translateStatic}}</p>
                  <ul>
                    <li v-for="(value, key) in stats" :key="key">
                      {{key | translateStatic}}： {{value}}
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </el-row>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button @click="closeStatisticsDialog()">关闭</el-button>
        </span>
      </el-dialog>
  </div>
</template>

<script>
import ParticipantList from "@/components/ParticipantList.vue";
import Toolbar from "@/components/Toolbar.vue";
// import rtcMain from '../util/webrtc/lib/svocRTCMain';
import rtc from '../util/webrtc/lib/svocRTC';
import { common } from '../util/common';
// import { setInterval, clearInterval } from 'timers';
import { conferenceApi } from '../server/api';
import { xmpp } from '../util/xmpp';

export default {
  name: "meeting",
  data() {
    return {
      disconnectDialog: false, // 挂断模态框
      statisticsDialog: false, // 会议状态模态框
      havePermission: false,
      localStream: null,
      remoteStream: null,
      remoteAudioStream: null,
      cid: '', // cid
      // 入会时长
      meetingTimerInterval: null,
      meetingTimer: {
        timeLong: '00:00:00',
        backH: 0,
        backM: 0,
        backS: 0
      },
      // 丢包率
      percentageLost: 0,
      percentageLostInterval: null,
      // 会议状态
      streamStatistics: {},
      statisticsObj: {outgoing: {}, incoming: {}},
      statisticsInterval: null,
      _sideBar: this.$store.getters.getSideBarState,
      spinnerTimer: true,
      // 本地视频画面
      selfView: {
        cameraMuted: false,
        hidden: false
      },
      // 共享画面
      screenShareView: {
        hidden: false
      },
      // -------------------
      presentationImgSrc: null,
      presentationVideoSrc: null,
      presentationName: '',
      presentationWinStaus: null,
      presentationWindow: false, // 是否打开了独立的新窗口
      presentationMaximized: false, //切换main和left窗口
       // 从组件获取到的
      screenShareMode: '',
      slideShareObj: {currentSlide: 1,slides:[]},
      acceptScreenShare: false //是否被动接收到了双流
      // -------------------
    };
  },
  components: {
    participantList: ParticipantList,
    toolbar: Toolbar
  },

  computed: {
    // 从状态管理器中获取会议信息
    conferenceDetail: function () {// 获取getters
      const _conferenceRole =this.$store.getters.getConferenceRoleData;
      if(_conferenceRole.conferenceRole === 0) {
        this.havePermission = false;
      }else{
        this.havePermission = true;
      }
      const _conferenceDetail = this.$store.getters.getConferenceData;
      this.cid = _conferenceRole.cid;
      return _conferenceDetail;
    },
    sideBar: function () {
      return this.$store.getters.getSideBarState;
    },
    localVolume: function () {
      return this.$store.getters.getLocalVolume;
    }

  },
  watch: {
    spinnerTimer(curVal) {
      if(curVal === false) {
        this.getPercentageLost()
      }
      // console.log('当前值---', curVal);
    },
    presentationWindow(curVal){
      console.log('watch监听 presentationWinStaus ====',curVal)
      this.presentationWindow = curVal;
      
    },
    localVolume(curVal) {
      console.log('声音改变了',curVal)
       const _remotedom = document.querySelector("#remoteVideo")
        _remotedom.volume = curVal;
    }
  },
  methods: {
    // 切换本地视频流的显示/隐藏
    toggleSelfView(event){
      // event.stopPropagation()
      this.selfView.hidden = !this.selfView.hidden
    },
    toggleScreenShareView(event){
      // event.stopPropagation()
      this.screenShareView.hidden = !this.screenShareView.hidden
    },
    // 结束会议
    closeConference(){
      conferenceApi.closeConference(this.cid)
      .then(res => {
        this.$notification('成功', '结束会议成功')
        this.disconnect()
      })
      .catch(error => {
        this.$notification('失败', '结束会议失败')
      })
    },
    // 离开会议
    disconnect() {
      rtc.disconnect();
      this.disconnectDialog = false;
      xmpp.disConnectXmpp();
      clearInterval(this.percentageLostInterval);
      this.$router.push('/index');
      // window.location.reload();
    },

    // 入会时长 定时器
    timeBackTimerFn() {
      this.meetingTimer.backS++;
      if(this.meetingTimer.backS == 8){
        this.spinnerTimer = false;
      }
      if(this.meetingTimer.backS == 60) {
        this.meetingTimer.backS = 0;
        this.meetingTimer.backM++;
      }
      if(this.meetingTimer.backM == 60) {
        this.meetingTimer.backM = 0;
        this.meetingTimer.backH++;
      }

      return common.addZero(this.meetingTimer.backH) + ':' + common.addZero(this.meetingTimer.backM) + ':' + common.addZero(this.meetingTimer.backS)
    },
    // 获取丢包率
    getPercentageLost() {
      this.percentageLostInterval = setInterval(() => {
        const _statistics = rtc.getCallStatistics();
        this.streamStatistics = _statistics;
        if(_statistics.incoming) {
          this.percentageLost = parseFloat(_statistics.incoming.video['percentage-lost'])
        }
      }, 4000);
    },
    // 流信息
    getMediaStatistics() {
      this.statisticsDialog = true;
      this.statisticsObj = this.streamStatistics;
      this.statisticsInterval = setInterval(() => {
        const _statistics = rtc.getCallStatistics();
        this.statisticsObj = _statistics;
        // console.log("_statistics======", _statistics)
      }, 1000);
    },
    closeStatisticsDialog() {
      this.statisticsDialog = false;
      if(this.statisticsInterval){
        clearInterval(this.statisticsInterval);
        this.statisticsInterval = null;
      }
    },
    showScreenShareMode(data) {
      this.screenShareMode = data;
    },
    showSlideShareObj(data) {
      console.log('收到来自子组件的toolbar值: ', data)
      this.slideShareObj = data;
    },
    previousSlide(){
      this.$refs.toolbarchild.previousSlide()
    },
    nextSlide() {
      this.$refs.toolbarchild.nextSlide()
    },
    // 获取子组件的值
    getPercentageWindow(state) {
      console.log('statestate====', state)
      this.presentationWindow = state;
    }
  },

  mounted() {
    let _this = this;
    // this.presentationWinStaus = this.$electron.remote.getGlobal('presentationWinStaus')
    console.log("mounted Meeting加载完成");

    this.meetingTimerInterval = setInterval(() => {
      _this.meetingTimer.timeLong = _this.timeBackTimerFn()
    }, 1000);

    // 本地流
    rtc.CallLocalMediaStream = function (stream) {
      _this.$nextTick(() => {
        const _localdom = document.querySelector("#localVideo")
        _this.localStream = stream;
        _localdom.srcObject = stream;
        console.log('本地视频流 mounted--------', _this.localStream)
      })
    };
    // 远端流
    rtc.CallRemoteMediaStream = function (stream) {
      _this.$nextTick(() => {
        const _remotedom = document.querySelector("#remoteVideo")
        _this.remoteStream = stream;
        _remotedom.srcObject = stream;
        console.log('远端视频流 mounted--------', _this.remoteStream)
      })
      
    },
    // 被挂断
    rtc.onCallDisconnect = function (reason) {
      _this.$nextTick(() => {
        _this.$confirm('通话方已将您挂断，请离开当前会议', '挂断', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        }).then(() => {
          _this.disconnect();
        }).catch(() => {
          _this.disconnect();
        });
      })
    },
    // 开始双流
    rtc.CallPresentationStarted = function (name) {
      _this.$nextTick(() => {
        _this.presentationMaximized = true;
        const nameMatch = /(.*)\s<(.*)>/.exec(name);
        console.log('被动接收 共享开始 PresentationStarted--name----', name)
        _this.presentationName = nameMatch && (nameMatch[1] || nameMatch[2]) || name
        if(_this.screenShareMode == 'screen'){
          rtc.startPresentationVideo()
        }
        _this.acceptScreenShare = true;
        console.log(_this.screenShareMode, rtc.screenShareMode)
        _this.$notification('共享', '开始展示双流共享')
      })
    },
    // 停止双流
    rtc.CallPresentationStopped = function () {
      _this.$nextTick(() => {
        console.log('收到消息-- 共享停止了 PresentationStopped------')
        // _this.$notification('共享', '停止展示双流共享')
        _this.presentationMaximized = false;
        _this.presentationImgSrc = null;
        _this.presentationVideoSrc = null;
        _this.presentationName = '';
        _this.screenShareMode = '';
        _this.acceptScreenShare = false;
        // rtc.disconnect();
      })
    },
    // 双流 - pdf文件/图片
    rtc.CallPresentationUpdate = function (src) {
      _this.$nextTick(()=>{
        _this.presentationName = _this.presentationName || rtc.presentationName+'(本人)';
        // console.log('展示双流-----name22----', rtc.presentationName)
        _this.presentationImgSrc = src;
        console.log('双流 - 图片 PresentationUpdate--------', _this.presentationImgSrc)
        const sendToMain = {
          name: _this.presentationName,
          src: _this.presentationImgSrc,
          videosrc: _this.presentationVideoSrc
        }
        const ipc = _this.$electron.ipcRenderer;
        ipc.send('accept-share',sendToMain);
        
      })
    },
    // 双流 - 桌面程序
    rtc.CallPresentationVideoUpdate = function (src, reason) {
      _this.$nextTick(()=>{
        console.log('双流 - 桌面程序 PresentationVideoUpdate 1--------', src)
        if(src === null && reason){
          alert(reason)
        } else {
          _this.presentationVideoSrc = src;
        }
      })
    },
    // 双流 - 桌面程序
    rtc.CallScreenshareConnected = function(src){
      _this.$nextTick(() => {
        console.log('双流 - 桌面程序 ScreenshareConnected --------', src)
        _this.presentationVideoSrc = src;
        // _this.presentationName = rtc.presentationName;
        const _screendom = document.querySelector("#presentationVideo")
        _screendom.srcObject = src;
      })
    },
    rtc.CallScreenshareStopped = function (reason) {
      _this.$nextTick(()=>{
         console.log('主动 停止共享 ScreenshareStopped ------')
        _this.$notification('共享', '停止展示双流共享')
        _this.presentationMaximized = false;
        _this.presentationImgSrc = null;
        _this.presentationVideoSrc = null;
        _this.presentationName = '';
        _this.screenShareMode = '';
        _this.acceptScreenShare = false;
        
      })
     
    },
    rtc.CallScreenShareMissing = function () {
      _this.$notification('共享', '未安装共享桌面应用插件程序')
    },
    window.addEventListener('message', function (event) {
      console.log('got window message',event.data)
    })
  },
  updated(){

  },
  destroyed() {
    if(this.meetingTimerInterval) {
      clearInterval(this.meetingTimerInterval);
      this.meetingTimerInterval = null;
    }
    if(this.statisticsInterval) {
      clearInterval(this.statisticsInterval);
      this.statisticsInterval = null;
    }
    if(this.percentageLostInterval) {
      clearInterval(this.percentageLostInterval);
      this.percentageLostInterval = null
    }
  }
};
</script>
<style>
.meeting-stage{
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 300px;
  color: #FAFAFA;
  background-color: rgb(163, 209, 240);
  text-align: center;
  overflow: hidden;
  opacity: 1;
  /* height: 100%;
  width: 100%; */
}
.meeting-stage.fullmeeting{
  right: 0;
}
.self-view-toolbar{
  position: absolute;
  right: -5px;
  top: -8px;
}
.screenShare-view-toolbar{
  position: absolute;
  left: 3px;
  top: 63px;
  z-index: 999;
}
.self-view-toolbar>a,
.screenShare-view-toolbar>a{
  font-size: 24px;
  color: #f2f2f2;
}

/* 参会者列表 */
.side-bar{
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  transition-property: left;
  transition-duration: 0.5s;
  background: #3f4a5d !important;
  color: #fff;
  width: 300px;
  overflow: auto;
}
.hide-sidebar{
  overflow: hidden;
  width: 0;
  /* display: none; */
}
.meeting-bar{
  position: absolute;
  background: #303847;
  height: 60px;
  width: 100%;
  z-index: 999;
  box-shadow: 0 0px 12px #888;
  /* line-height: 60px; */
}
.header-bar{
  top: 0;
  line-height: 60px
}
.tool-bar{
  bottom: 0;
  left: 0;
}
/** header **/
.conference-msg{
  float: left;
  font-size: 16px;
  cursor: pointer;
  margin-left: 10px;
}
.disconnect-btn{
  /* float: right; */
  margin: 10px 0;

}
.disconnect-btn i.tool-icon{
  font-size: 32px;
}
.conference-status span{
  margin: 0 5px;
  font-size: 16px;
}
.network{
  cursor: pointer;
}
.network i.network-bad{
  color: red;
}
.network i.network-good{
  color: #1fca1f;
}
.network i.network-general{
  color: #f7e83b;
}
div.el-dialog.statics-dialog{
  background: rgba(0, 0, 0, 0.59);
  box-shadow: 0 0 5px #f2f2f2;
}
.statics-dialog .el-dialog__body{
  color :#f2f2f2;
}
/* 视频主体部分 */
.conn-main{
  height: 100%;
  background: #000;
}
.video-div{
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  transform: translate(-50%,-50%);
  text-align: center;
}
.main-video{
  position: absolute;
  margin: auto;
  top: 60px;
  bottom: 60px;
  left: 0;
  right: 0;
  max-width: 100%;
  max-height: 100%;
  text-align: center;
  white-space: nowrap;
  background: #000;
}
.main-video video {
  width: 100%;
  height: 100%;
}
.main-video .presentation-image,
.loading-image{
  display: inline-block;
  height: 20%;
  width: 100%;
  vertical-align: middle;
  border: 0;
  padding: 0;
  background-color: inherit;
}
.loading-image{
  margin-top: 25%;
}

.main-video:before {
  content: '';
  display: inline-block;
  /* height: 100%; */
  vertical-align: middle;
  margin-right: -0.25em;
}
.right-video{
  position: absolute;
  top: 68px;
  right: 10px;
  /* width: 18%; */
  /* width: 240px;
  height: 210px; */
  background-color: #000;
  z-index: 999;
}
.right-video video {
  width: 100%;
  height: 100%;
  border-radius: 3px;
  box-shadow: 0 0 5px #7b7878;
}
.local-video{
  width: 200px;
  height: 120px;
}
.left-video{
  position: absolute;
  top: 68px;
  left: 10px;
  width: 18%;
  /* width: 240px;
  height: 210px; */
  background-color: #000;
  z-index: 999;
}
.left-video video,
.left-video .sel-presentation-jpeg,
.main-video .sel-presentation-jpeg {
  width: 100%;
  height: 100%;
  border-radius: 3px;
  box-shadow: 0 0 5px #7b7878;
}

/*  媒体流信息 */
.statistics-type{
  display: inline-block;
}
.statistics-direction {
  font-size: large;
  font-weight: bold;
}
.statistics-media-type {
  font-weight: bold;
  margin: 16px 0 8px 0;
}
.statistics-data {
  /*margin: 16px;*/
}
.statistics-data ul {
  width: 100%;
  font-size: smaller;
}
.statistics-data ul li:first-of-type {
  text-align: left;
}

.presentation-toolbar .button-group {
  background-color: black;
  background-color: rgba(0, 0, 0, .5);
  display: inline-block;
  border-radius: 20px;
}
.button-group .toolbar-button{
  color: #fff;
  padding: 0 12px;
  font-size: 14px;
}
.main-video .presentation-toolbar{
  margin-top: -45px;
}
.main-video .presentation-name {
  margin-top: -25px;
  text-align: left;
}
</style>
