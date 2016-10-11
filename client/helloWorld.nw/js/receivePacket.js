
function getKey(){

	return 'my secret key';
};

function decryptMsg(msg, key){
/*
	var decryptedMsg = 'this message was decrypted successfuly! it used to be:' + msg.toString(); 
	return decryptedMsg;
	*/
	return msg.toString();
};




function forward(payload, session){

	return;


	session.on("error",function(err){
    	console.log(err)
	});

	session.sendPayload(payload);
	console.log("Sent RTP packet to localhost port 6000");
};


function receive(){
		//var gui = require('..nw.gui');
		//var win = gui.Window.get();
		//gui.Window.open('https://github.com');
		
		var RtpPacket=require("./RtpPacket.js");
		var dgram = require('dgram');
		var socket = dgram.createSocket('udp4');
		var dgram2 = require('dgram');
		var socket2 = dgram2.createSocket('udp4');
		var crypto = require('crypto');
		var Buffer = require('buffer').Buffer;
		var sharedKey =	new Buffer('a2674254abf859ea720e210016b13ad2','hex');			
		//var initializationVector = new Buffer('82b81f7c58c004dd0bdcd233b5a18ab7','hex');
		
		
		//var session = new RtpSession(6000);
		//session.setRemoteAddress(6000,"localhost");
		var port = 5000;
		var host = '127.0.0.1';
		socket.bind(port);
		socket2.bind(9998);
		socket.on('message', function (msg, info){
			console.log('received a message');
        //	console.log('message recieved by client: ' + msg.toString() );
        //	console.log('packet is being decrypted');
        	var sk = getKey();
        	//const decryptedMsg = new Buffer( decryptMsg(msg,sk) )
        	//forward(decryptedMsg,session);
        	var rtpPacket = new RtpPacket(msg);
		
		var decrypted;
		var decipher = crypto.createDecipher('aes-128-ctr', sharedKey),
		decrypted = Buffer.concat([decipher.update(rtpPacket.getPayload()) , decipher.final()]);

		
		var decryptedpay = new Buffer(decrypted);
		//console.log('Decrypt Payload length :'+ decryptedpay.length);
		rtpPacket.setPayload(decryptedpay);
		
		socket2.send(rtpPacket.getBuffer(), 
		0,
		rtpPacket.getBuffer().length,
		6000,
		host,
		function(err){
		  //console.log('Send RTP Packet');
		  if (err) console.log(err);
		}); 
        	//forward(rtpPacket.getBuffer(),session);
		});


		socket.on('listening', function(){
		var address = socket.address();
		console.log("listening on :" + address.address + ":" + address.port);
		});

		
};



