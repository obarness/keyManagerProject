function receiveDecrypted(){
		//var gui = require('..nw.gui');
		//var win = gui.Window.get();
		//gui.Window.open('https://github.com');


		var dgram = require('dgram');
		var socket = dgram.createSocket('udp4');

		var port = 6000;
		var host = 'localhost';

		socket.on('message', function (msg, info){

        	console.log('DECRYPTED!!!!!!!!!!!!!!!!: ' + msg.toString() );

			});




		socket.on('listening', function(){
  	    var address = socket.address();
        console.log("listening on :" + address.address + ":" + address.port);
        });

		socket.bind(port);
}
