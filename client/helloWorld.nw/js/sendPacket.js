function send(){

			const dgram = require('dgram');
			const message = new Buffer('Some bytes');
			const client = dgram.createSocket('udp4');
			console.log('trying to send message from sendPacket.js');
			client.send(message,0,message.length ,5004, '127.0.0.1', (err) => {
	  		client.close();
			});
			console.log('successfully sent message from sendPacket.js');
}

