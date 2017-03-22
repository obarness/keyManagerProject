function setup(channelId){
 // setupAes();
  var ffmpeg = require('fluent-ffmpeg');
  var fs = require('fs');
  var dgram = require('dgram');
  var dgram2 = require('dgram');
  var socket = dgram.createSocket('udp4');
  var socket2 = dgram2.createSocket('udp4');
  var crypto = require('crypto');
  var Buffer = require('buffer').Buffer;
  var RtpPacket=require('RtpPacket');
  var configs = require('./../../configs.js');
  var database = require('./../../database.js');

  //parameters
  var BROADCAST_ADDRESS = configs.BROADCAST_ADDRESS;
  var ffmpegOutPort = configs.ffmpegOutPort;
  var clientPort = database.getVideoPortById(channelId);

  var host = '127.0.0.1';

  var keysToKeep = configs.NUM_OF_AES_KEYS;
  var keysList =  new createKeysList(null,keysToKeep,0);

  //our initial key.
  keysList.key = crypto.randomBytes(16);
  var aesKey =  keysList.key;
  var aesSeq = keysList.id;
  broadcastAesKey(aesKey,aesSeq,channelId);      


  //server
  socket2.on('listening', function () {
      var address = socket2.address();
      alert("SOCKET 2 IS LISTENING");
  });

  //server
  socket.on('listening', function () {

      socket.setBroadcast(true);
      alert("this socket is sending the encrypted video"  );
  });


  var timeStamp = Math.floor(Date.now());
  //in miliseconds
  var gap = 2500; 


  //we get a video message from ffmpeg.
  //we're going to encrypt it, and broadcast the video!
  socket2.on('message', function(msg, rinfo){
  // alert("message on socket 2");
  var newTimeStamp = (Math.floor(Date.now()));
   

   //we dont want to broadcast video with the new key immediately.
   //we want to give some time for the clients to decrypt the key before we start using it.
   //we will only start using the new key, after we've already sent it's following key.
   //for e.g, if we created key.id = 1, we'll only start using it after we've sent key.id=2 to all clients.
   if(newTimeStamp > gap + timeStamp){
      aesKey = keysList.key;
      aesSeq = keysList.id;
      timeStamp = newTimeStamp;
      keysList = changeKey(keysList,channelId);

   }

      var rtpPacket = new RtpPacket(msg);
      rtpPacket.setAesSeq(aesSeq);
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
      BROADCAST_ADDRESS,
      function(err){
        if (err) console.log(err);
      });   
  });

  //for some reason, the messages being sent from function StartVideo (below) aren't reaching socket2,
  // unless we put some alerts.
  alert("wait....");
  socket.bind(9994);
  socket2.bind(ffmpegOutPort); 
}

function StartVideo(){
  var channelId = document.forms["broadcastVideo"]["channelId"].value;
  setup(channelId);
  const ffmpeg = require('fluent-ffmpeg');
  const dialog = require('nw-dialog');
  var configs = require('./../../configs.js');
  var ffmpegOutPort = configs.ffmpegOutPort;
  //prompt file selection
  dialog.setContext(document); // work in client
  dialog.openFileDialog('.mp4',function(path){
    
    //RTP creation with FFmpeg
      var proc = ffmpeg(path).native()
      .videoCodec('mpeg2video')
      .videoBitrate('1024k')
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .outputOptions('-f rtp_mpegts')
      .output('rtp://127.0.0.1:'+ffmpegOutPort)
      .on('error', function(err) {
       console.log('an error happened: ' + err.message);
      })
      .on('start', function(commandLine) {
        console.log('Spawned Ffmpeg with command: ' + commandLine);})
       
      .run();



  });
  
    

}



function changeKey(keysList,channelId){
  var crypto = require('crypto');
  keysList = keysList.next;
  keysList.key = crypto.randomBytes(16);
  broadcastAesKey(keysList.key,keysList.id,channelId);

  return keysList;

}


function getAesKeyById(keysList, keyId){
  while(keysList.id != keyId){
      keysList = keysList.next;
  }
  return keysList;
}



//change key to new key, set following key to null. (this is in order to verify we're not using an old key!)
function setAesKeyById(keysList, keyId, newKey){
  while(keysList.id != keyId){
      keysList = keysList.next;
  }
   keysList.key = newKey;
   keysList.next.key = null;
}


function createKeysList(head,length,count) {
  this.id=count++;  
  this.key=null;
  if(head==null)
    head = this;
  if(length>0){
    this.next = new createKeysList(head,--length,count);
    return this;
  }
  else{
    this.next=head;
    return head;
  }
}



