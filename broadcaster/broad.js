
  var ffmpeg = require('fluent-ffmpeg');
  var fs = require('fs');
  var dgram = require('dgram');
  var dgram2 = require('dgram');
  var socket = dgram.createSocket('udp4');
  var socket2 = dgram2.createSocket('udp4');
  var crypto = require('crypto');
  var Buffer = require('buffer').Buffer;
  var RtpPacket=require("./RtpPacket.js");



  //parameters

  var testmessage = "[hello broadcaster] pid: ";
  var address = '192.168.0.255'; //change for your LAN broacast IP !
  var ffmpegOutPort = 7777;
  var clientPort = 8000;
  var host = '127.0.0.1';



  var aesKey = crypto.randomBytes(16); 
  console.log("=========================");
  console.log("new aes key created");
  console.log(aesKey);
  console.log("=========================");

  var sharedKey = new Buffer('a2674254abf859ea720e210016b13ad2','hex');         
  //var initializationVector = new Buffer('82b81f7c58c004dd0bdcd233b5a18ab7','hex');      //crypto.randomBytes(16); 


  //server
  socket2.on('listening', function () {
      var address = socket2.address();
      console.log('RTP Server listening on ' + address.address + ":" + address.ffmpegOutPort);
  });


  socket2.on('message', function(msg, rinfo){
      var rtpPacket = new RtpPacket(msg);

      //need to set RTP HEADERS!!!!!!
      var encrypted;
      var cipher = crypto.createCipher('aes-128-ctr', sharedKey);
      encrypted = Buffer.concat([cipher.update(rtpPacket.getPayload()), cipher.final()]); 
      var encryptedpay = new Buffer(encrypted);

      //update only payload of packet.
      rtpPacket.setPayload(encryptedpay);

      //send packet to client.
      socket.send(rtpPacket.getBuffer(), 
      0,
      rtpPacket.getBuffer().length,
      clientPort,
      host,
      function(err){
        if (err) console.log(err);
      });   
  });
   
  socket.bind(9990);
  socket2.bind(ffmpegOutPort); 


//RTP creation with FFmpeg
var proc = ffmpeg('SampleVideo.mp4').native()
  .videoCodec('mpeg2video')
  .videoBitrate('1024k')
  .audioCodec('libmp3lame')
  .audioBitrate('128k')
  .outputOptions('-f rtp_mpegts')
  .output('rtp://127.0.0.1:7777')
  
  
  .on('error', function(err) {
    console.log('an error happened: ' + err.message);
  })
  .on('start', function(commandLine) {
    console.log('Spawned Ffmpeg with command: ' + commandLine);})
   
  .run();



