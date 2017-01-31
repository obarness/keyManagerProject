
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
		var crypto = require('crypto');
		var Buffer = require('buffer').Buffer;
		var keysToKeep = 10;
		var keysList =  new createKeysList(null,keysToKeep,0);
		receiveAes(keysList);
		var get_video_port = 7068;
		var send_Dec_port = 10032;
		var vlc_port = 6000;
		var host = '127.0.0.1';
		get_video_Socket.bind(get_video_port);
		send_Dec_Socket.bind(send_Dec_port);
		var aesKey = null;


		get_video_Socket.on('message', function (msg, info){
			console.log('received a message');
	        var rtpPacket = new RtpPacket(msg);
	        var keyId = rtpPacket.getAesSeq();

	        //poll until you got the key!
	        while(aesKey == null){
	        	aesKey = getAesKeyById(keysList, keyId);

	        }
			var decrypted;
			var decipher = crypto.createDecipher('aes-128-ctr', aesKey),
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

function receiveAes(keysList){
		var dgram = require('dgram');
		var socket = dgram.createSocket('udp4');
		var port = 5032;
		var keyId = 8;
		



		socket.on('message', function (msg, info){
			//this is not a number, this is a keyId.
			if (isNaN(msg.toString())) {
				aesKey = msg;
	        	var aesKeyPath = "/home/omer/workspace/keyManagerProject/client/client.nw/js/aeskey/key"
	        	var fs = require('fs');
				var wstream = fs.createWriteStream(aesKeyPath+".cpabe");
				wstream.write(aesKey);
				wstream.end(    function(){
					setAesKeyById(keysList, keyId, decrypt());
				//	keyId = -1;
				})
			}

			else{
				keyId = (parseInt(msg.toString()));
			}
			//alert("file written");
		

		});


		socket.on('listening', function(){
  	    var address = socket.address();
        });

        socket.bind(port);
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
  return keysList.key;
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

			var fs = require('fs');
			var aesKeyPath = "/home/omer/workspace/keyManagerProject/client/client.nw/js/aeskey/key"
			var pubkey =  "/home/omer/workspace/keyManagerProject/client/client.nw/js/privateKey/public";
			var private = "/home/omer/workspace/keyManagerProject/client/client.nw/js/privateKey/private";
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








//// DO NOT USE
function receiveAes2(keysList){
		alert("this works");
		var dgram = require('dgram');
		var socket = dgram.createSocket('udp4');
		var port = 5016;
		socket.on('message', function (aesKey, info){
			alert("AES message!");
        	//alert('we got a new  message: ' + aesKey.toString('hex'));
        	//alert('trying to save into file');
        	var aesKeyPath = "/home/omer/workspace/keyManagerProject/client/client.nw/js/aeskey/key"



        	var fs = require('fs');
			var wstream = fs.createWriteStream(aesKeyPath+".cpabe");
			wstream.write(aesKey);
			wstream.end(    function(){
				decrypt();
			});
			//alert("file written");
		

		});


		socket.on('listening', function(){
  	    var address = socket.address();
        console.log("waiting for aes key on: " + address.address + ":" + address.port);
        });

		socket.bind(port);
}
