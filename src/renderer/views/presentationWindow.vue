<template>
  <div class="container">
    <div class="main-pip">
        <img id="presentationImg" v-show="presentationImgSrc" class="presentation-image" :src='presentationImgSrc'/>
        <video v-show="presentationVideoSrc && presentationVideoSrc != {}" autoplay id="presentationVideo"></video>
        <div class="presentation-name">共享显示源：{{presentationName}}</div>
    </div>
  </div>
</template>

<script>

export default {
  name: "presentation",
  data () {
    return {
      presentationImgSrc: '',
      presentationVideoSrc: {},
      presentationName: ''
    }
  },
  computed: {
    // globalService: function() {
    //   const _globalService = this.$electron.remote.getGlobal('presentationObj')
    //   console.log('computed globalService-----', _globalService)
    //   this.presentationImgSrc = _globalService.src;
    //   this.presentationVideoSrc = _globalService.videosrc;
    //   this.presentationName = _globalService.name;
    //   console.log(this.presentationImgSrc)
    //   return _globalService;
    // }
  },
  methods: {
    // presentationObj
  },
  watch: {
    // globalService: {
    //   handler(curval) {
    //     console.log('深度监听 globalService-----', curval)
    //     this.presentationImgSrc = curval.src;
    //     this.presentationVideoSrc = curval.videosrc;
    //     this.presentationName = curval.name;
    //   },
    //   deep:true
    // },
  },
  mounted() {
    const _this = this;
    const globalService = this.$electron.remote.getGlobal('presentationObj');
    this.presentationImgSrc = globalService.src;
    this.presentationVideoSrc = globalService.videosrc;
    this.presentationName = globalService.name;
    console.log(this.presentationImgSrc)

    const ipc = this.$electron.ipcRenderer;
    ipc.on('presentationObj', function (event, data) {
      _this.$nextTick(()=>{
        // _this.globalService = data;
        console.log('presentationObj======', data)
        _this.presentationImgSrc = data.src;
        _this.presentationVideoSrc = data.videosrc;
        _this.presentationName = data.name;
      })
    })
    // console.log(this.$electron)
    
   
  },
  destroyed() {
    
  },
}
</script>

<style scoped>
.main-pip{
  position: absolute;
  width: 100%;
  height: 100%;
  background: #000;
}
.main-pip video{
  width: 100%;
}
.presentation-name{
  position: absolute;
  bottom: 10px;
  left: 10px;
}
.presentation-image{
  width: 100%;
  height: 100%;
}
</style>

