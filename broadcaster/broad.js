
//most include path to FFmpeg appliction on the fulent-ffmpeg module

var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var dgram = require('dgram');
var dgram2 = require('dgram');
var socket = dgram.createSocket('udp4');
var socket2 = dgram2.createSocket('udp4');




var RtpPacket=require("./RtpPacket.js");


//parameters

var testmessage = "[hello broadcaster] pid: ";
var address = '192.168.1.255'; //change for your LAN broacast IP !
console.log("\n*********\nmake sure to change your LAN address\ntype 'ifconfig' for broadcast address\n*********\n");
var port = 5000;
var portinit = 5556;
var host = '127.0.0.1';



//server

socket2.on('listening', function () {
    var address = socket2.address();
    console.log('RTP Server listening on ' + address.address + ":" + address.port);
});


socket2.on('message', function(msg, rinfo){
	  var rtpPacket = new RtpPacket(msg);
	  
    socket.setBroadcast(true);
	  socket.send(rtpPacket.getBuffer(), 
	  0,
	  rtpPacket.getBuffer().length,
	  port,
	  address,
	  function(err){
	    if (err) console.log(err);
	  });   
    
});
 

socket.bind(9999);
socket2.bind(portinit); 





function sendmessage (){
  socket.send(new Buffer(testmessage), 
    0,
    testmessage.length,
    port,
    address,
    function(err){
      if (err) console.log(err);

      console.log("Message sent");
    })
};









//RTP creation with FFmpeg

var proc = ffmpeg('SampleVideo.mp4').native()
  
  .videoCodec('mpeg2video')
  .videoBitrate('1024k')
  .audioCodec('libmp3lame')
  .audioBitrate('128k')
  
  .outputOptions('-f rtp_mpegts')

  .output('rtp://127.0.0.1:5556')
  
  
  // setup event handlers

 // .on('stderr', function(stderrLine) {
 //   console.log('Stderr output: ' + stderrLine);})

  .on('error', function(err) {
    console.log('an error happened: ' + err.message);
  })
  .on('start', function(commandLine) {
    console.log('Spawned Ffmpeg with command: ' + commandLine);})
   
   
  //.pipe(stream, { end: true });
  // save to stream
  .run();

