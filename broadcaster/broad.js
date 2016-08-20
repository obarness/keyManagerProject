
//most include path to FFmpeg appliction on the fulent-ffmpeg module


var dgram = require('dgram');
var socket = dgram.createSocket('udp4');

var ffmpeg = require('fluent-ffmpeg');

var fs = require('fs');

var testmessage = "[hello broadcaster] pid: ";

var address = '192.168.0.255'; //change for your LAN
var port = 5000;
var host = '127.0.0.1';

var RtpSession=require("rtp-rtcp").RtpSession;
var RtpPacket=require("rtp-rtcp").RtpPacket;
 
//server
 
var r1=new RtpSession(5556);
//var r2 = new RtpSession(5557);
//r2.setRemoteAddress(5558,"127.0.0.1");
 
r1.on("listening",function(){
    console.log("rtp server is listening...");
});

socket.bind(port);
 

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



r1.on("message",function(msg,info){
    var rtpPacket = new RtpPacket(msg);
    //console.log(rtpPacket.getSeqNumber().toString()+" from "+info.address+" "+info.port);
    //r2.sendPacket(rtpPacket,msg.length);
    socket.send(rtpPacket.getBuffer(), 
    0,
    rtpPacket.getBuffer().length,
    port,
    address,
    function(err){
      if (err) console.log(err);
    });
});




/*
require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('addr: '+add);
  host=add;
})

var rtptext = fs.createWriteStream("received.json",{ flags: 'w',
  encoding: "utf8",
  mode: 0666 });



socket.on('listening', function(){
    var address = socket.address();
    console.log("listening on :" + address.address + ":" + address.port);
});

socket.on('message', function (message, remote) {
    rtptext.write(message);

});
*/



// setInterval(sendmessage,2000);



 
//server
 













var proc = ffmpeg('SampleVideo2.ts').native()
  // use the 'flashvideo' preset (located in /lib/presets/flashvideo.js)
  .videoCodec('copy')
  .noAudio()
  
  .outputOptions('-f rtp')

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






/*

socket.bind(function(){
	socket.setBroadcast(true);
	setInterval(sendmessage,1000);
});

*/