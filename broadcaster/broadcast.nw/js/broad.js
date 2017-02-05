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
  var address = '192.168.0.255'; //change for your LAN broacast IP !
  var BROADCAST_ADDRESS = '192.168.1.255';
  var ffmpegOutPort = 7777;
  var clientPort = 8040;
  var host = '127.0.0.1';

  var keysToKeep = 10;
  var keysList =  new createKeysList(null,keysToKeep,0);

  //our initial key.
  keysList.key = crypto.randomBytes(16);
  var aesKey =  keysList.key;
  var aesSeq = keysList.id;
  broadcastAesKey(aesKey,aesSeq);      


  //server
  socket2.on('listening', function () {
      var address = socket2.address();
      console.log('RTP Server listening on ' + address.address + ":" + address.ffmpegOutPort);
  });

  //server
  socket.on('listening', function () {

      socket.setBroadcast(true);
  });


  var timeStamp = Math.floor(Date.now());
  //in miliseconds
  var gap = 10000; 


  //we get a video message from ffmpeg.
  //we're going to encrypt it, and broadcast the video!
  socket2.on('message', function(msg, rinfo){
  var newTimeStamp = (Math.floor(Date.now()));
   

   //we dont want to broadcast video with the new key immediately.
   //we want to give some time for the clients to decrypt the key before we start using it.
   //we will only start using the new key, after we've already sent it's following key.
   //for e.g, if we created key.id = 1, we'll only start using it after we've sent key.id=2 to all clients.
   if(newTimeStamp > gap + timeStamp){
      aesKey = keysList.key;
      aesSeq = keysList.id;
      timeStamp = newTimeStamp;
      keysList = changeKey(keysList);

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
   
  socket.bind(9990);
  socket2.bind(ffmpegOutPort); 
}

function broadcastVideo(){
  const ffmpeg = require('fluent-ffmpeg');
  const dialog = require('nw-dialog');

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
      .output('rtp://127.0.0.1:7777')
      .on('error', function(err) {
        console.log('an error happened: ' + err.message);
      })
      .on('start', function(commandLine) {
        console.log('Spawned Ffmpeg with command: ' + commandLine);})
       
      .run();



  });
  
    

}



function changeKey(keysList){
  var crypto = require('crypto');
  keysList = keysList.next;
  keysList.key = crypto.randomBytes(16);
  broadcastAesKey(keysList.key,keysList.id);

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



