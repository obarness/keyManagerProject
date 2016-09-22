
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
	console.log("sent message to localhost port 6000");
};


function receive(){
		//var gui = require('..nw.gui');
		//var win = gui.Window.get();
		//gui.Window.open('https://github.com');
		var RtpSession=require("rtp-rtcp").RtpSession;
		var RtpPacket=require("rtp-rtcp").RtpPacket;
		var dgram = require('dgram');
		var socket = dgram.createSocket('udp4');

		var rtpPacket;
		var session = new RtpSession(6010);
		session.setRemoteAddress(6000,"localhost");
		var port = 5000;
		var host = 'localhost';

		socket.on('message', function (msg, info){
			console.log('received a message');
        //	console.log('message recieved by client: ' + msg.toString() );
        //	console.log('packet is being decrypted');
        	var sk = getKey();
        	//const decryptedMsg = new Buffer( decryptMsg(msg,sk) )
        	//forward(decryptedMsg,session);
        	var rtpPacket = new RtpPacket(msg);
        	socket.send(msg,6000,'localhost');
 
        	forward(rtpPacket.getBuffer(),session);

			});


		socket.on('listening', function(){
  	    var address = socket.address();
        console.log("listening on :" + address.address + ":" + address.port);
        });

		socket.bind(port);
};



