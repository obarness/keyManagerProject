
//most include path to FFmpeg appliction on the fulent-ffmpeg module

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
var port = 5000;
var portinit = 5556;
var host = '127.0.0.1';

//aes encryption

var sharedKey =	new Buffer('a2674254abf859ea720e210016b13ad2','hex');					//crypto.randomBytes(16); 
//var initializationVector = new Buffer('82b81f7c58c004dd0bdcd233b5a18ab7','hex');			//crypto.randomBytes(16); 
var cipher2;

var text = new Buffer("Hello this is the words that will be given to you by the Lord of CryptoNight");
cipher2 = crypto.createCipher('aes-128-ctr', sharedKey);
var decoded  = Buffer.concat([cipher2.update(text), cipher2.final()]);
console.log('Encrypted text: ' + decoded.toString());
var decipher2 = crypto.createDecipher('aes-128-ctr', sharedKey);
var decrypted = Buffer.concat([decipher2.update(decoded) , decipher2.final()]);
var dectext = new Buffer(decrypted);
console.log('Decrypted text: ' + decrypted.toString());
console.log('Buffer.compare: ' + areBuffersEqual(text,dectext));


var wstream = fs.createWriteStream('packetlog.txt');
wstream.on('finish', function () {
  console.log('file has been written');
  wstream.end();
});

//server
socket2.on('listening', function () {
    var address = socket2.address();
    console.log('RTP Server listening on ' + address.address + ":" + address.port);
});


socket2.on('message', function(msg, rinfo){
	  
  
	  var rtpPacket = new RtpPacket(msg);
	  var encrypted;
	  //console.log('Unencrypted payload lentgh ' + encrypted.length);
	  //wstream.write("Origin packet Sequnce Number: " + rtpPacket.getSeqNumber() + "\n");
	  //wstream.write(rtpPacket.getPayload());
	  var cipher = crypto.createCipher('aes-128-ctr', sharedKey);
	  encrypted = Buffer.concat([cipher.update(rtpPacket.getPayload()), cipher.final()]);

	  
	  var encryptedpay = new Buffer(encrypted);
	  //console.log('Encrypted payload lentgh ' + encryptedpay.length);
	  rtpPacket.setPayload(encryptedpay);
	  
	  
// 	  var decrypted;
// 	  var decipher = crypto.createDecipher('aes-128-ctr', sharedKey),
// 	  decrypted = Buffer.concat([decipher.update(rtpPacket.getPayload()) , decipher.final()]);
// 
// 	  
// 	  decrypted = new Buffer(decrypted);
// 	  rtpPacket.setPayload(decrypted);
	  //wstream.write("Encrypted packet Sequnce Number: " + rtpPacket.getSeqNumber() + "\n");
	  //wstream.write(rtpPacket.getPayload());
	  

	  
	  socket.send(rtpPacket.getBuffer(), 
	  0,
	  rtpPacket.getBuffer().length,
	  port,
	  host,
	  function(err){
	    if (err) console.log(err);
	  });   
});
 

socket.bind(9999);
socket2.bind(portinit); 


function areBuffersEqual(bufA, bufB) {
    var len = bufA.length;
    if (len !== bufB.length) {
        return false;
    }
    for (var i = 0; i < len; i++) {
        if (bufA.readUInt8(i) !== bufB.readUInt8(i)) {
            return false;
        }
    }
    return true;
}






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

