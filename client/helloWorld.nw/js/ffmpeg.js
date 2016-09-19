var
  Player = require('nw-f2cwa-play').Player,
  player;

player = new Player({
  selector:'#cnv', // selector for canvas to render video
  ffmpegPath: 'ffmpeg' // in case ffmpeg is available on standard path
});

player.openSrc('rtp://@127.0.0.1:6000'); // pass stream url (rtp, udp, http ... anything supported by ffmpeg) or file path

// auto start playback
player.on('canplay',function(){
          player.play();
})

player.on('time',function(time){
  // time is current stream time in seconds
});