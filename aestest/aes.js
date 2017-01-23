		var dgram = require('dgram');
		var socket = dgram.createSocket('udp4');
		var dgram2 = require('dgram');
		var socket2 = dgram2.createSocket('udp4');
		var crypto = require('crypto');
		var Buffer = require('buffer').Buffer;
		var sharedKey =	new Buffer('a2674254abf859ea720e210016b13ad2','hex');			
		//var initializationVector = new Buffer('82b81f7c58c004dd0bdcd233b5a18ab7','hex');
		var RtpPacket=require("./RtpPacket.js");
		var fs = require('fs');
		
		var wstream = fs.createWriteStream('packetlog.txt');
		wstream.on('finish', function () {
		  console.log('file has been written');
		  wstream.end();
		});
		

		var port = 5000;
		var host = '127.0.0.1';
		socket.bind(port);
		socket.on('message', function (msg, info){
			//console.log('received a message');

        	var rtpPacket = new RtpPacket(msg);
		//wstream.write("Encrypted packet Sequnce Number: " + rtpPacket.getSeqNumber() + "\n");
		//wstream.write(rtpPacket.getPayload());
		var decrypted;
		var decipher = crypto.createDecipher('aes-128-ctr', sharedKey),
		decrypted = Buffer.concat([decipher.update(rtpPacket.getPayload()) , decipher.final()]);

		
		var decryptedpay = new Buffer(decrypted);
		//console.log('Decrypt Payload length :'+ decryptedpay.length);
		rtpPacket.setPayload(decryptedpay);
		
		//wstream.write("Decrypted packet Sequnce Number: " + rtpPacket.getSeqNumber() + "\n");
		//wstream.write(rtpPacket.getPayload());
		
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
		console.log("Listening on :" + address.address + ":" + address.port);
		});