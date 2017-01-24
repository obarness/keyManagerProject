//broadcaster code
function broadcastAesKey(aesKey){

			alert("our session key is:" + aesKey.toString('hex'));

	 		var crypto = require('crypto');
			const dgram = require('dgram');
			const message = new Buffer('Some bytes');
			const client = dgram.createSocket('udp4');
			var port = 5004;
			alert('trying to send message from sendPacket.js');


			//encrypt key before sending.
			//key must be sent as a file.














			client.send(aesKey,0,aesKey.length ,port, '127.0.0.1', (err) => {
	  		client.close();
			});
			alert('successfully sent message from sendPacket.js');

}

