
function playVideo(){
	openVlc();
	receive();
}

 
function receive(){
		var RtpPacket=require("./RtpPacket.js");
		var dgram = require('dgram');
		var get_video_Socket = dgram.createSocket('udp4');
		var dgram2 = require('dgram');
		var send_Dec_Socket = dgram2.createSocket('udp4');
		const path = require('path');
		__dirname = path.resolve(path.dirname(''));
		var crypto = require('crypto');
		var Buffer = require('buffer').Buffer;
		var keysToKeep = 10;
		var keysList =  new createKeysList(null,keysToKeep,0);
	//	receiveAes(keysList);
		var get_video_port = 8040;
		var send_Dec_port = 10108;
		var vlc_port = 6000;
		var host = '127.0.0.1';
		get_video_Socket.bind(get_video_port);
		send_Dec_Socket.bind(send_Dec_port);
		
		var aesKey = keysList;

		get_video_Socket.on('message', function (msg, info){
			

	        var rtpPacket = new RtpPacket(msg);
	        var keyId = rtpPacket.getAesSeq();

	        //this means key has changed!
	        if(aesKey.key!= null && aesKey.id != keyId){
	        	aesKey.key=null;
	        	aesKey = getAesKeyById(keysList, keyId);
	        }
	        if(aesKey.key==null){
	        		return;
	        }
	        else{
				var decrypted;
				var decipher = crypto.createDecipher('aes-128-ctr', aesKey.key),
				decrypted = Buffer.concat([decipher.update(rtpPacket.getPayload()) , decipher.final()]);
				var decryptedpay = new Buffer(decrypted);
				rtpPacket.setPayload(decryptedpay);


				//send decrypted patyload to vlc port.

				send_Dec_Socket.send(rtpPacket.getBuffer(), 
				0,
				rtpPacket.getBuffer().length,vlc_port,host,function(err){
				  if (err) console.log(err);
				}); 

			}
		});

		get_video_Socket.on('listening', function(){
		var address = get_video_Socket.address();
	//	get_video_Socket.setBroadcast(true);

		});

/*=========================================================================================================================
============================================CODE FOR AES SOCKET============================================================
===========================================================================================================================
===========================================================================================================================
*/
		var dgram3 = require('dgram');
		var AesSocket = dgram3.createSocket('udp4');
		var Aes_Socket_port = 6022;
		var keyId = -1;


		AesSocket.on('error', (err) => {
  			alert(`====error====:\n${err.stack}`);
  			server.close();
			});

		AesSocket.on('message', function (msg, info){

			
			//this is not a number, this is a keyId.
			if (isNaN(msg.toString())) {
				var aesKey = msg;

				//either we don't know the seq of key yet, or the key was already obtained.
				if(keyId==-1 || getAesKeyById(keysList,keyId).key != null){
					// do nothing.
					// return???
				}
				else{	
					var aesKeyPath = path.join(__dirname + "/js/aeskey/key");
		        	var fs = require('fs');
					var wstream = fs.createWriteStream(aesKeyPath+".cpabe");
					wstream.write(aesKey);
					wstream.end(    function(){
						setAesKeyById(keysList, keyId, decrypt());
						keyId = -1;
					});
				
				}
			}

			else{
				keyId = (parseInt(msg.toString()));
			}
			//alert("file written");
		

		});


		AesSocket.on('listening', function(){
//		AesSocket.setBroadcast(true);
  	    var address = AesSocket.address();
        });

        AesSocket.on('close', function (){
        	alert("this socket got closed!");
        });

        AesSocket.bind(Aes_Socket_port);




};


//not in use!! maybe should be.
function receiveAes(keysList){
		alert("func called");
		
		var dgram3 = require('dgram');
		var AesSocket = dgram3.createSocket('udp4');
		var Aes_Socket_port = 5096;
		var keyId = -1;
		const path = require('path');
		__dirname = path.resolve(path.dirname(''));
		
		AesSocket.on('error', (err) => {
  			alert(`====error====:\n${err.stack}`);
  			server.close();
			});


		AesSocket.on('message', function (msg, info){
			alert("received an AES message!");
			//this is not a number, this is a keyId.
			if (isNaN(msg.toString())) {
				var aesKey = msg;

				//either we don't know the seq of key yet, or the key was already obtained.
				if(keyId==-1 || getAesKeyById(keysList,keyId).key != null){
					// do nothing.
					// return???
				}
				else{	
					var aesKeyPath = path.join(__dirname + "/js/aeskey/key");
		        	var fs = require('fs');
					var wstream = fs.createWriteStream(aesKeyPath+".cpabe");
					wstream.write(aesKey);
					wstream.end(    function(){
						setAesKeyById(keysList, keyId, decrypt());
						keyId = -1;
					});
				
				}
			}

			else{
				alert("key seq: " + (parseInt(msg.toString())));
				keyId = (parseInt(msg.toString()));
			}
			//alert("file written");
		

		});


		AesSocket.on('listening', function(){
  	    var address = socket.address();
        });

        AesSocket.on('close', function (){
        	alert("this socket got closed!");
        });

        AesSocket.bind(Aes_Socket_port);
}

function openVlc(){
var vlc_port = 6000;
var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }
exec("vlc rtp://@:"+ vlc_port, puts);
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


function decrypt(){
			const path = require('path');
			__dirname = path.resolve(path.dirname(''));
			var fs = require('fs');
			var aesKeyPath = path.join(__dirname + "/js/aeskey/key");
			var pubkey = path.join(__dirname + "/js/privateKey/public");
			var private = path.join(__dirname + "/js/privateKey/private");;
			var sys = require('sys')
			var exec = require('child_process').execSync;
			function puts(error, stdout, stderr) { sys.puts(stdout) }
			exec("cpabe-dec -p " + pubkey + " -c " + private + " -i " + aesKeyPath+".cpabe" + " -o "+  aesKeyPath  +" -a 100");

						//read decrypted buffer
			var aesKey = fs.readFileSync(aesKeyPath, (err, data) => {
		  		if (err) throw err;

				});	

			var key = new Buffer(aesKey.toString(),'hex'); 
			
        	return key;

}

function receiveAes(){
	alert("this does nothing!");

}

function receivebackup(){

		var RtpPacket=require("./RtpPacket.js");
		var dgram = require('dgram');
		var get_video_Socket = dgram.createSocket('udp4');
		var dgram2 = require('dgram');
		var send_Dec_Socket = dgram2.createSocket('udp4');
		var crypto = require('crypto');
		var Buffer = require('buffer').Buffer;
		var keysToKeep = 10;
		var keysList =  new createKeysList(null,keysToKeep,0);
		receiveAes(keysList);
		var get_video_port = 8026;
		var send_Dec_port = 10094;
		var vlc_port = 6000;
		var host = '127.0.0.1';
		get_video_Socket.bind(get_video_port);
		send_Dec_Socket.bind(send_Dec_port);
		var aesKey = keysList;


		get_video_Socket.on('message', function (msg, info){
			console.log('received a message');
	        var rtpPacket = new RtpPacket(msg);
	        var keyId = rtpPacket.getAesSeq();

	        //this means key has changed!
	        if(aesKey.key!= null && aesKey.id != keyId){
	        	aesKey.key=null;
	        	//receiveAes(keysList);
	        }

	        //poll until you got the key!
	        while(aesKey.key == null){
	        	aesKey = getAesKeyById(keysList, keyId);

	        }
			var decrypted;
			var decipher = crypto.createDecipher('aes-128-ctr', aesKey.key),
			decrypted = Buffer.concat([decipher.update(rtpPacket.getPayload()) , decipher.final()]);
			var decryptedpay = new Buffer(decrypted);
			rtpPacket.setPayload(decryptedpay);
			send_Dec_Socket.send(rtpPacket.getBuffer(), 
			0,
			rtpPacket.getBuffer().length,vlc_port,host,function(err){
			  if (err) console.log(err);
			}); 
		});

		get_video_Socket.on('listening', function(){
		var address = get_video_Socket.address();

		});
};