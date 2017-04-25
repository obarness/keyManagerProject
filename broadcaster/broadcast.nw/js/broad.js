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
  var configs = require('./../../configs.js');
  var database = require('./../../database.js');

  //parameters
  var BROADCAST_ADDRESSES = configs.BROADCAST_ADDRESSES;
  var ffmpegOutPort = configs.ffmpegOutPort;
  var channelId = document.forms["broadcastVideo"]["channelId"].value;
  var keysToKeep = configs.NUM_OF_AES_KEYS;
  var gap = configs.CHANGE_KEY_INTERVAL; 
  var clientPort = database.getVideoPortById(channelId);
  var keysList =  new createKeysList(null,keysToKeep,0);

  //our initial key.
  keysList.key = crypto.randomBytes(16);
  var aesKey =  keysList.key;
  var aesSeq = keysList.id;
  var lastKeyIdSent = [-1];

  //no encryption
  if(configs.NO_ENCRYPTION){
    if(configs.BROADCAST)
        no_encryption(configs.NO_ENCRYPTION_BROADCAST_ADDRESS);
    else
        no_encryption(configs.NO_ENCRYPTION_USER_ADDRESS);

  }

  // some/full encryption
  else{
  
    socket.on('close', function () {
        log("socket 1 closing");
       

    });

    socket.on('error', function (err) {
        log("socket 1 error: "+ err);
       
      
    });

    socket2.on('close', function () {
        log("socket 2 closing");
       
     
    });

   socket2.on('error', function (err) {
        log("socket 2 error: "+ err);
       
      //alert("this socket is sending the encrypted video"  );
    });


    //server
    socket.on('listening', function () {
        var address = socket.address();
        log('broadcasting will be done from port '+ socket.address().port);
        if(configs.BROADCAST)
           socket.setBroadcast(true);

    });


      //server
    socket2.on('listening', function () {
     log("encrypted video messages will be sent to " + socket2.address().port);

    });


    var timeStamp = Math.floor(Date.now());
    //the time of when we sent last key
    var lastKeySent=0;

    //in miliseconds
   
    //we get a video message from ffmpeg.
    //we're going to encrypt it, and broadcast the video!
    socket2.on('message', function(msg, rinfo){
    //alert("message on socket 2 " +  msg.toString());

    var newTimeStamp = (Math.floor(Date.now()));

     //we dont want to broadcast video with the new key immediately.
     //we want to give some time for the clients to decrypt the key before we start using it.
     //we will only start using the new key, after we've already sent it's following key.
     //for e.g, if we created key.id = 1, we'll only start using it after we've sent key.id=2 to all clients.
    
     if(newTimeStamp > gap + timeStamp){
        aesKey = keysList.key;
        aesSeq = keysList.id;
        timeStamp = newTimeStamp;
        lastKeySent = timeStamp;
        keysList = changeKey(keysList,channelId,lastKeyIdSent);
      //  alert("using aes id:" + keysList.id);

     }
     

     else if(newTimeStamp > lastKeySent + configs.SEND_KEY_INTERVAL){
     
         broadcastAesKey(aesKey,aesSeq,channelId,lastKeyIdSent); 
         lastKeySent = newTimeStamp;
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
        
        //
        for(var i=0; i<BROADCAST_ADDRESSES.length;i++){
            if(configs.BROADCAST_SERVER[i]==1){
                socket.send(rtpPacket.getBuffer(), 
                0,
                rtpPacket.getBuffer().length,
                clientPort,
                BROADCAST_ADDRESSES[i],
                function(err){
                  if (err) log(err);
                });   
          }
        }
    });
   // alert("wait....");
     socket.bind(9990,() => {
      socket2.bind(ffmpegOutPort, () =>{
        broadcastAesKey(aesKey,aesSeq,channelId,lastKeyIdSent); 
        var address = '127.0.0.1';
        var filePath =  'SampleVideo.mp4';
        //var filePath = 'CGIHDCHAPPiE.mp4';
        StartVideo(address,filePath); 

        });
    });
    
  }
}


function StartVideo(address, filePath){
  const ffmpeg = require('fluent-ffmpeg');
  const dialog = require('nw-dialog');
  var configs = require('./../../configs.js');
  var ffmpegOutPort = configs.ffmpegOutPort;

  if(configs.NO_ENCRYPTION)
    ffmpegOutPort = configs.VLC_PORT;

  //prompt file selection
  dialog.setContext(document); // work in client

  var vidBitare = '1024k';
  //var vidBitare = '2048k';

//  dialog.openFileDialog('.mp4',function(path){

    //path should be chosen by a file dialog.
    //for some reason, dialog is failing, this is a temp workaround.
    
    //RTP creation with FFmpeg
      var proc = ffmpeg(filePath).native()
      .videoCodec('mpeg2video')
      .videoBitrate(vidBitare)
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .outputOptions('-f rtp_mpegts')
      .output('rtp://'+address+':'+ffmpegOutPort)
      .on('error', function(err) {
       log('an error happened: ' + err.message);
      })
      .on('start', function(commandLine) {
        console.log('Spawned Ffmpeg with command: ' + commandLine);})
      .run();

 //      });
}

function changeKey(keysList,channelId,lastKeyIdSent){
  updateRevokeString(channelId);

  var crypto = require('crypto');
  keysList = keysList.next;
  keysList.key = crypto.randomBytes(16);

  log('changing AES key, key id:' + keysList.id +', key is '+ keysList.key.toString('hex'));
  broadcastAesKey(keysList.key,keysList.id,channelId,lastKeyIdSent);
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

function updateRevokeString(channelId){
    var https = require('https');
    var configs = require('./../../configs.js');
    const path = require('path');
   __dirname = path.resolve(path.dirname(''));
   var fs = require('fs');

      
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    for(var i=0; i<configs.BROADCAST_ADDRESSES.length;i++){
      if(configs.BROADCAST_SERVER[i]==1){
        var company = getServerNameByAddress(configs.SERVER_ADDRESSES[i]);
        https.get('https://'+configs.SERVER_ADDRESSES[i]+':'+configs.SERVER_PORT+'/revoke_'+channelId, (res) => {
          res.on('data', (d) => {
                var revokePath = path.join(__dirname + "/js/companies/"+company+"/revoke_" + channelId);
                log('saved new revoke file at: ' + revokePath);
                fs.writeFile(revokePath, d, function(err) {
                  if(err) {
                    return console.log(err);
                  }

                
                }); 
          });
        });
    }
  }
}

function getServerNameByAddress(address){
    var configs = require('./../../configs.js');
    var SERVER_ADDRESSES = configs.SERVER_ADDRESSES;
    var SERVER_NAMES = configs.SERVER_NAMES;

    for(var i =0; i<SERVER_ADDRESSES.length;i++){
      if(SERVER_ADDRESSES[i]== address){
          return SERVER_NAMES[i];

        }
    }
    return "error";
}

function no_encryption(address){
  var filePath = 'CGIHDCHAPPiE.mp4';
 // var filePath =  'SampleVideo.mp4';
  StartVideo(address,filePath );




}

