
function start(channelId){

	openVlc();

	var configs = require('./../../configs.js');

	//in case there's no encryption applied, user only needs to start vlc 
	if(configs.NO_ENCRYPTION==0)
		receive(channelId);
}

 
function receive(channelId){
		var RtpPacket=require("./RtpPacket.js");
		var dgram = require('dgram');
		var get_video_Socket = dgram.createSocket('udp4');
		var dgram2 = require('dgram');
		var send_Dec_Socket = dgram2.createSocket('udp4');
		const path = require('path');
		__dirname = path.resolve(path.dirname(''));
		var crypto = require('crypto');
		var database = require('./../../database.js');
		var configs = require('./../../configs.js');
		var Buffer = require('buffer').Buffer;
		var keysToKeep = configs.NUM_OF_AES_KEYS;
		var keysList =  new createKeysList(null,keysToKeep,0);
		var get_video_port = database.getVideoPortById(channelId);
		var send_Dec_port = configs.send_Dec_port;
		var VLC_PORT = configs.VLC_PORT;
		var host = '127.0.0.1';
		get_video_Socket.bind(get_video_port);
		send_Dec_Socket.bind(send_Dec_port);
		
		var aesKey = keysList;
		
		get_video_Socket.on('message', function (msg, info){

			

	        var rtpPacket = new RtpPacket(msg);
	        var keyId = rtpPacket.getAesSeq();

	        //this is the first time we got a video!
	        

	        //this means key has changed!
	        if(aesKey.key!= null && aesKey.id != keyId){
	        	aesKey.key=null;
	        	aesKey = getAesKeyById(keysList, keyId);
	        }
	        else if(aesKey.key== null){
	        	aesKey = getAesKeyById(keysList, keyId);
	        }
	        if(aesKey.key!=null){
	        //	log('forwarding decrypted video to vlc');
	        
				var decrypted;
				var decipher = crypto.createDecipher('aes-128-ctr', aesKey.key),
				decrypted = Buffer.concat([decipher.update(rtpPacket.getPayload()) , decipher.final()]);
				var decryptedpay = new Buffer(decrypted);
				rtpPacket.setPayload(decryptedpay);

				//send decrypted patyload to vlc port.
				send_Dec_Socket.send(rtpPacket.getBuffer(), 
				0,
				rtpPacket.getBuffer().length,VLC_PORT,host,function(err){
				  if (err) log(err);
				}); 

			}
			else{

			
			}
		});

		get_video_Socket.on('listening', function(){
		log("awaiting decrypted video messages on:" + get_video_port);

		});

/*=========================================================================================================================
============================================CODE FOR AES SOCKET============================================================
===========================================================================================================================
===========================================================================================================================
*/
		var dgram3 = require('dgram');
		var AesSocket = dgram3.createSocket('udp4');
		var Aes_Socket_port = database.getKeyPortById(channelId);
		var keyId = -1;


		AesSocket.on('error', (err) => {
  			log(`====error====:\n${err.stack}`);
  			server.close();
			});

		AesSocket.on('message', function (msg, info){

			//this is not a number, this is a keyId.
			if (isNaN(msg.toString())) {
				var aesKey = msg;

				//either we don't know the seq of key yet, or the key was already obtained.
				if(keyId==-1 || getAesKeyById(keysList,keyId).key != null){
					log('we already have this key, no need to decrypt');
				}
				else{	
					log('received a decrypted AES key');
					log('key id is:' + keyId);
					log('decrypting key...');
					var aesKeyPath = path.join(__dirname + "/js/aeskey/key");
		        	var fs = require('fs');
		        	if(configs.FULL_ENCRYPTION)
						var wstream = fs.createWriteStream(aesKeyPath+".cpabe");
					else
						var wstream = fs.createWriteStream(aesKeyPath);

					wstream.write(aesKey);
					wstream.end(    function(){
						setAesKeyById(keysList, keyId, decrypt(channelId));
						keyId = -1;
					});
				
				}
			}

			else{

				keyId = (parseInt(msg.toString()));
				
			}
			
		

		});


		AesSocket.on('listening', function(){
			log("awaiting decrypted AES key  on:" + Aes_Socket_port);
        });

        AesSocket.on('close', function (){
        	log("AesSocket is closing")
        });
        
        AesSocket.bind(Aes_Socket_port);


};




function openVlc(){
var configs = require('./../../configs.js');
var VLC_PORT = configs.VLC_PORT;
var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }
log("opening vlc on port: "+ VLC_PORT);
exec("vlc rtp://@:"+ VLC_PORT, puts);
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


function decrypt(channelId){
			var configs = require('./../../configs.js');
			
			var fs = require('fs');
			const path = require('path');
			__dirname = path.resolve(path.dirname(''));
			var aesKeyPath = path.join(__dirname + "/js/aeskey/key");

			if(configs.FULL_ENCRYPTION){
				var pubkey = path.join(__dirname + "/js/privateKey/public_"+channelId);
				var private = path.join(__dirname + "/js/privateKey/private_"+channelId);
				var sys = require('sys')
				var exec = require('child_process').execSync;
				var userId = document.forms["playVideo"]["userId"].value; 
				function puts(error, stdout, stderr) { sys.puts(stdout) }
				
				exec("cpabe-dec -p " + pubkey + " -c " + private + " -i " + aesKeyPath+".cpabe" + " -o "+  aesKeyPath  +" -a "+userId);
			}
			

			var aesKey = fs.readFileSync(aesKeyPath, (err, data) => {
		  		if (err) throw err;

				});	

			var key = new Buffer(aesKey.toString(),'hex'); 
			log('our key is:' + aesKey.toString());
        	return key;

}





