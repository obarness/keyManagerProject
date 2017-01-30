
function playVideo(){
	openVlc();
	var aesKey;
	receiveAes();
	
}



 
function receive(aesKey){

		var RtpPacket=require("./RtpPacket.js");
		var dgram = require('dgram');
		var socket = dgram.createSocket('udp4');
		var dgram2 = require('dgram');
		var socket2 = dgram2.createSocket('udp4');
		var crypto = require('crypto');
		var Buffer = require('buffer').Buffer;
		var keysToKeep = 10;
		var keysList = createKeysList(null,keysToKeep,0);
		//var sharedKey =	getAesKey(keysList);	
		

		var port = 8000;
		var host = '127.0.0.1';
		socket.bind(port);
		socket2.bind(9992);
		socket.on('message', function (msg, info){
			console.log('received a message');
	        var rtpPacket = new RtpPacket(msg);
			var decrypted;
			var decipher = crypto.createDecipher('aes-128-ctr', aesKey),
			decrypted = Buffer.concat([decipher.update(rtpPacket.getPayload()) , decipher.final()]);
			var decryptedpay = new Buffer(decrypted);
			rtpPacket.setPayload(decryptedpay);
			socket2.send(rtpPacket.getBuffer(), 
			0,
			rtpPacket.getBuffer().length,6000,host,function(err){
			  if (err) console.log(err);
			}); 
		});

		socket.on('listening', function(){
		var address = socket.address();
		});
};

function openVlc(){
var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }
exec("vlc rtp://@:6000", puts);
}


function getAesKey(keysList){
  keysList.key = receiveAes();
  return keysList.key;
}



function createKeysList(head,length,count) {
  this.id=count++;	
  this.key=null;
  if(head==null)
  	head = this;
  if(length>0)
  	this.next = createKeysList(head,--length,count);
  else
  	this.next=head;
  return head;
}





//just for debug
function forward(payload, session){

	return;


	session.on("error",function(err){
    	console.log(err)
	});

	session.sendPayload(payload);
	console.log("Sent RTP packet to localhost port 6000");
};


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

			alert("buffer:" + aesKey.toString());
			var key = new Buffer(aesKey.toString(),'hex'); 
        	receive(key);




}

function receiveAes(){
		var dgram = require('dgram');
		var socket = dgram.createSocket('udp4');
		var port = 5004;
		socket.on('message', function (aesKey, info){

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
