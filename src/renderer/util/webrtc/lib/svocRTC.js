'use strict';

let RTCMain = require('./svocRTCMain').default;
let tool = require('./tool').default;
function svocRTC() {
  var _this = this;
  _this.remoteMediaStream = null;
  _this.CallPresentationStarted = null;
  _this.CallPresentationStopped = null;
  _this.CallPresentationUpdate = null;
  _this.CallPresentationVideoUpdate = null;
  _this.CallLocalMediaStream = null;
  _this.CallRemoteMediaStream = null;
  _this.onPresentationReload = null;
  _this.CallScreenshareConnected = null;
  _this.CallScreenshareStopped = null;
  _this.CallScreenShareMissing = null;
  _this.onCallDisconnect = null;
}
var screenshareCallback = null;
svocRTC.prototype.init = function (host, alias, displayName, pin, bw, token, registration_token) {
  var _this = this;
  _this.displayName = displayName;
  
  RTCMain.onConnect = function (stream) {
    // tool.init('remoteVideo', stream);
    console.log('-----remoteMediaStream-----', stream)
    _this.CallRemoteMediaStream(stream)
  }
  RTCMain.onSetup = function (stream, pinStatus, conferenceExtension) {
    setTimeout(() => {
      if(stream) {
        // tool.init('localVideo', stream);
        console.log('-----localMediaStream-----', stream)
        _this.CallLocalMediaStream(stream);
        _this.connect();
      } else if (_this.remoteMediaStream) { //platformSettings.hasWebRTC && 
        RTCMain.connect();
      } else if(pinStatus !== 'none') {
        console.log('-----pinStatus-----', pinStatus)
        _this.connect(pin);
      }else{
        _this.connect();
      }
    },5000);
    
  }
  RTCMain.onError = function (reason) {
    console.error('call::error', reason)
  }
  RTCMain.onDisconnect = function (msg) {
    if(msg == 'Disconnected by another participant'){
      _this.onCallDisconnect('通话方已将您挂断')
    }else {
      _this.onCallDisconnect(msg)
    }
    return msg;
  }

  RTCMain.onPresentation = function(isActive, presenter) {
    setTimeout(() => {
      console.log('RTCMain.onPresentation', isActive, presenter);
      if (isActive) {
        _this.CallPresentationStarted(presenter)
        _this.presentationAcitve = true;
        // _this.presentationName = presenter;
      } else {
          delete _this.presentationAcitve;
          if (typeof _this.screenShareMode === 'undefined') {
              // suppress presentationStopped event when we have stolen presentation
              _this.CallPresentationStopped()
          }
      }
    });
  };
  RTCMain.onPresentationReload = function(src) {
    setTimeout(() => {
      console.log('RTCMain.onPresentationReload', src);
       _this.CallPresentationUpdate(src)
      if (_this.presentationAcitve || _this.screenShareMode === 'screen') {
          // $rootScope.$broadcast('call::presentationUpdate', src);
          _this.presentationImgSrc = src;
          console.log('this presentationImgSrc： ----------', src);
          
      }
    });
  };
  RTCMain.onPresentationConnected = function(src) {
    setTimeout(() => {
      console.log('RTCMain.onPresentationConnected', src);
      // $rootScope.$broadcast('call::presentationVideoUpdate', src);
      _this.CallPresentationVideoUpdate(src)
      if (src instanceof MediaStream) {
          _this.presentationVideoSrc = src;
          console.log('in MediaStream')
      } else {
          _this.presentationVideoSrc = src; //$sce.trustAsResourceUrl(src);
          console.log('in trustAsResourceUrl')
      }
      console.log('----------', src)
      // tool.init('presentationVideo', src);
    });
  };
  RTCMain.onPresentationDisconnected = function(reason) {
    setTimeout(() => {
          // Only called when we are receiving video presentation and remote side stop
          console.log('RTCMain.onPresentationDisconnected', reason);
          if (reason && reason.indexOf(': ') > 0) {
              reason = reason.substr(reason.lastIndexOf(': ') + 2);
          }
          // $rootScope.$broadcast('call::presentationVideoUpdate', null, reason);
          _this.CallPresentationVideoUpdate(null, reason)
          delete _this.presentationVideoSrc;
      });
  };
  RTCMain.onScreenshareConnected = function (src) {
    setTimeout(() => {
      console.log('RTCMain.onScreenshareConnected', src);
      // _this.CallScreenshareConnected(src);
      delete _this.presentationAcitve;
      _this.presentationName = `${displayName}`
      if (screenshareCallback) {
        screenshareCallback();
      }
      screenshareCallback = null;
    });
  };
  RTCMain.onScreenshareStopped = function (reason) {
    setTimeout(() => {
      console.log('RTCMain.onScreenshareStopped', reason);
      delete _this.screenShareMode;
      if (reason !== RTCMain.trans.ERROR_SCREENSHARE_CANCELLED) {
        delete _this.presentationImgSrc;
        delete _this.presentationVideoSrc;
      }
      _this.CallScreenshareStopped(reason)
    })
  };
  RTCMain.onScreenshareMissing = function () {
    setTimeout(() => {
      console.log('RTCMain.onScreenshareMissing');
      RTCMain.onScreenshareStopped();
      _this.CallScreenShareMissing()
    })
  }
  
  RTCMain.makeCall(host, alias, displayName, pin, bw, 'none');
}
svocRTC.prototype.startCall = function (callType, videoSource, audioSource, flashElement) {
  var _this = this;
  console.log('----startCall-----', callType, videoSource, audioSource, flashElement)
  RTCMain.call_type = callType;
  RTCMain.flash = flashElement;
  RTCMain.video_source = videoSource;
  RTCMain.audio_source = audioSource;
  // platformSettings.hasWebRTC &&
  if (_this.remoteMediaStream) {
      RTCMain.renegotiate(callType);
  } else {
      RTCMain.addCall(callType, flashElement);
  }
  console.log('----startCall RTCMain-----', RTCMain)
}

svocRTC.prototype.connect = function (pin, extension) {
  var _this = this;
  console.log('Call.connect', pin, extension);
  _this.microphoneMuted = RTCMain.muteAudio();
  _this.cameraMuted = RTCMain.muteVideo();
  RTCMain.connect(pin, extension);
}

svocRTC.prototype.startPresentationVideo = function () {
  var _this = this;
  RTCMain.getPresentation();
}

svocRTC.prototype.stopPresentationVideo = function () {
  var _this = this;
  console.log('Call.stopPresentationVideo');
  RTCMain.stopPresentation();
  // $rootScope.$broadcast('call::presentationVideoUpdate', null);
  delete _this.presentationVideoSrc;
  _this.refreshPresentation();
}
svocRTC.prototype.refreshPresentation = function () {
  var _this = this;
  RTCMain.onPresentationReload(RTCMain.getPresentationURL());
}

svocRTC.prototype.startScreenShare = function (sourceVideoId) {
  var _this = this;
  console.log('Call.startScreenShare');
  _this.screenShareMode = 'screen';
  _this.presentationName = _this.displayName;
  RTCMain.present(_this.screenShareMode, sourceVideoId);
}

svocRTC.prototype.stopScreenShare = function () {
  var _this = this;
  console.log('Call.stopScreenShare');
  delete _this.screenShareMode;
  delete _this.presentationImgSrc;
  delete _this.presentationVideoSrc;
  RTCMain.present(null, null);
}


svocRTC.prototype.imageShareStart = function (cb) {
  var _this = this;
  console.log('Call.imageShareStart');
  screenshareCallback = cb;
  _this.screenShareMode = 'screen_http';
  RTCMain.present(_this.screenShareMode, null);
  _this.presentationName = _this.displayName;
};
svocRTC.prototype.imageShareSetImage = function (dataURL) {
  var _this = this;
  console.log('Call.imageShareSetImage', dataURL);
  RTCMain.sendPresentationImage({files: [dataURL]});
}

svocRTC.prototype.getCallStatistics = function(callback) {
  var _this = this;
  if (RTCMain.call && RTCMain.call.getMediaStatistics) {
      return RTCMain.call.getMediaStatistics();
  } else {
      return RTCMain.getMediaStatistics();
  }
};

svocRTC.prototype.toggleMicrophone = function() {
  var _this = this;
  _this.microphoneMuted = RTCMain.muteAudio();
};
svocRTC.prototype.toggleCamera = function() {
  var _this = this;
  _this.cameraMuted = RTCMain.muteVideo();
  return _this.cameraMuted;
};

svocRTC.prototype.disconnectAll = function() {
  var _this = this;
  RTCMain.disconnectAll();
};
svocRTC.prototype.disconnect = function(reason) {
  var _this = this;
  console.log('Call.disconnect');
  delete _this.presentationVideoSrc;
  try {
    RTCMain.present(null, null);
    RTCMain.stopPresentation();
    RTCMain.disconnectCall();
    RTCMain.disconnect(reason);
  } catch (e) {
    console.error('Failed to disconnect pexrtc', e);
  }
};
  // if (localStorage.screenshareFrameRate !== undefined) {
  //   var resolution = calculateScreenshareResolution(localStorage.screenshareFrameRate)
  //   RTCMain.screenshare_width = resolution[0]
  //   RTCMain.screenshare_height = resolution[1]
  //   RTCMain.screenshare_fps = localStorage.screenshareFrameRate;
  // }
  // if (localStorage.defaultBandwidth !== undefined) {
  //   RTCMain.bandwidth_in = parseInt(localStorage.defaultBandwidth) - 64;
  //   if (RTCMain.bandwidth_in < 0) {
  //     RTCMain.bandwidth_in = 0;
  //   }
  //   RTCMain.bandwidth_out = RTCMain.bandwidth_in;
  // }

  function calculateScreenshareResolution (fps) {
    /* Calculate the appropriate max screen share resolution for a given
       frame rate. The logic is such that for any frame rate the
       bandwidth and cpu usage will be approximately constant.

       It's possible to process more pixels per second at higher fps
       since there is less change between each frame. Assume that the
       increase in number of pixels per second as a function of frame
       rate is linear. Upper limit is set to UHD (4K) to avoid issues
       with sharing displays with crazy high resolution. */
    var r1 = {w: 3840, h: 2160, f:  1};
    var r2 = {w: 1366, h:  768, f: 15};

    // pixels_per_second = a * fps + b
    var p1 = r1.w * r1.h * r1.f;            // pixels per second for min fps
    var p2 = r2.w * r2.h * r2.f;            // pixels per second for max fps
    var a = (p2 - p1) / (r2.f - r1.f);
    var b = (r2.f * p1 - r1.f * p2) / (r2.f - r1.f);

    // Find pixels per second for current fps and resulting scaling ratio
    var pixels_per_second = a * fps + b;
    var ratio_pixels_per_frame = (pixels_per_second / r1.f) / (p1 * fps);
    var ratio_dimension = Math.sqrt(ratio_pixels_per_frame);

    var w = window.screen.width;
    var h = window.screen.height;

    if (h > w) {
        // Screen is rotated
        var tmp = r1.w;
        r1.w = r1.h;
        r1.h = tmp;
    }

    w = Math.min(Math.ceil(r1.w * ratio_dimension), w);
    h = Math.min(Math.ceil(r1.h * ratio_dimension), h);

    return [w, h];
  }


export default new svocRTC()