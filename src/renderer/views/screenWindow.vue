<template>
  <div class="container">
    <div class="screen-title">
      请选择您要共享的屏幕或窗口
    </div>
    <div class="main-pip" 
    v-loading="screenLoading"
    element-loading-text="拼命加载中">
      <div class="screen-priew" v-for="screen in allScreenObj" :key="screen.id" @click="shareScreen(screen.id)">
        <img :src="screen.thumbnail.toDataURL()" alt="">
        <span class="screen-name">{{screen.name}}</span> 
      </div>

      <!-- <video src="" autoplay></video> -->
    </div>

    <div>
      <!-- <button @click="gotScreen()">捕捉</button> -->
    </div>
  </div>
</template>

<script>
import { throws } from 'assert';
import rtc from '../util/webrtc/lib/svocRTC';
export default {
  name: "screen",
  data () {
    return {
      screenLoading: true,
      allScreenObj: null,
      allWindowObj: null,
      desktopCapturer: this.$electron.desktopCapturer,
      electronScreen: this.$electron.screen
    }
  },
  computed: {

  },
  methods: {
    gotScreen() {
      let that = this;
      const thumbSize = this.determineScreenShotSize()
      let options = { types: ['screen', 'window'], thumbnailSize: thumbSize }
      this.desktopCapturer.getSources(options, function (error, sources) {
        if (error) return console.log(error)
        that.allScreenObj = sources;
        sources.forEach(function (source) {
          console.log('source===', source)
          that.screenLoading = false;
          // navigator.webkitGetUserMedia({
          //     audio: false,
          //     video: {
          //       mandatory: {
          //         chromeMediaSource: 'desktop',
          //         chromeMediaSourceId: source.id,
          //         minWidth: 1280,
          //         maxWidth: 1280,
          //         minHeight: 720,
          //         maxHeight: 720
          //       }
          //     }
          //   },that.gotStream, that.getUserMediaError);
        })
      })
    },
    shareScreen(id) {
      rtc.startScreenShare(id)
      this.$emit('emitlistenScreenShareMode', 'screen'); // 向父组件传值
    },
    gotScreen_() {
      this.desktopCapturer.getSources({types: ['window', 'screen']}, function (error, sources) {
        if (error) return console.log(error)
        for (var i = 0; i < sources.length; ++i) {
          console.log('source===', sources[i])
          if (sources[i].name == "Electron") {
            navigator.webkitGetUserMedia({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: sources[i].id,
                  minWidth: 1280,
                  maxWidth: 1280,
                  minHeight: 720,
                  maxHeight: 720
                }
              }
            }, gotStream, getUserMediaError);
            return;
          }
        }

      })
    },
    gotStream(stream) {
      document.querySelector('video').src = URL.createObjectURL(stream);
    },
    getUserMediaError() {
      console.log('getUserMediaError');
    },
    determineScreenShotSize() {
      const screenSize = this.electronScreen.getPrimaryDisplay().workAreaSize
      const maxDimension = Math.max(screenSize.width, screenSize.height)
      return {
        width: maxDimension * window.devicePixelRatio,
        height: maxDimension * window.devicePixelRatio
      }
    }
  },
  mounted() {
    this.gotScreen();
    // const desktopCapturer = this.$electron.desktopCapturer;
    // const electronScreen = this.$electron.screen;
    // const size = electronScreen.getPrimaryDisplay().size;
    // const alldisplays = electronScreen.getAllDisplays();
    // console.log('alldisplays=====', alldisplays)
    // this.allScreenObj = alldisplays;
    // console.log(`当前屏幕是: ${size.width}px x ${size.height}px`)
  },
  destroyed() {
    
  },
}
</script>

<style scoped>
.container{
  color: #000;
}
.main-pip{
  min-height: 200px;
  text-align: center;
}
.screen-title{
  font-size: 22px;
  text-align: center;
  margin-bottom: 20px;
}
.screen-priew{
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  display: inline-block;
  margin: 5px;
  width: 120px;
  /* height: 120px; */
}
.screen-priew img{
  max-width: 100%;
  max-height: 100%;
}
.screen-name{
  overflow: hidden;
  text-overflow: ellipsis;
  color: #000;
  display: block;
  text-align: center;
}
</style>

