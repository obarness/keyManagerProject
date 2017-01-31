function setup(){

  var ffmpeg = require('fluent-ffmpeg');
  var fs = require('fs');
  var dgram = require('dgram');
  var dgram2 = require('dgram');
  var socket = dgram.createSocket('udp4');
  var socket2 = dgram2.createSocket('udp4');
  var crypto = require('crypto');
  var Buffer = require('buffer').Buffer;
  var RtpPacket=require('RtpPacket');


  //parameters

  var testmessage = "[hello broadcaster] pid: ";
  var address = '192.168.0.255'; //change for your LAN broacast IP !
  var ffmpegOutPort = 7777;
  var clientPort = 7068;
  var host = '127.0.0.1';

  var aesKey = crypto.randomBytes(16); 
   crypto.randomBytes(16, (err, aesKey) => {
  if (err) throw err;
  });


  broadcastAesKey(aesKey);      


  //server
  socket2.on('listening', function () {
      var address = socket2.address();
      console.log('RTP Server listening on ' + address.address + ":" + address.ffmpegOutPort);
  });

  var timeStamp = Math.floor(Date.now());
  var gap = 5000; //5 seconds, this is how often we'll change AES key.
  socket2.on('message', function(msg, rinfo){

   if((Math.floor(Date.now()))> gap + timeStamp){
      timeStamp = Math.floor(Date.now());
      changeKey(aesKey);
    
   }

      var rtpPacket = new RtpPacket(msg);
      rtpPacket.setAesSeq(8);
    // alert("seq number? = " + rtpPacket.getAesSeq());

      //need to set RTP HEADERS!!!!!!
      var encrypted;
      var cipher = crypto.createCipher('aes-128-ctr', aesKey);
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
}

function broadcastVideo(){
    var ffmpeg = require('fluent-ffmpeg');
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

}

function changeKey(aesKey){

  broadcastAesKey(aesKey);

}



