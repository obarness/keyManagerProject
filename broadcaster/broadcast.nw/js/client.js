function func(){
	/*
		var gui = require('nw.gui');
		var win = gui.Window.get();

		var dgram = require('dgram');
		var socket = dgram.createSocket('udp4');

		var port = 5000;
		var host = 'localhost';

		socket.on('message', function (msg, info){
			win.minimize();
        	console.log(msg.toString());
        });
		socket.send('hello world',0,11,12345,'192.168.1.20');	
		socket.on('listening', function(){
  	    var address = socket.address();
        console.log("listening on :" + address.address + ":" + address.port);
        });

		socket.bind(port);
		*/
		console.log('somebody called func() on client.js.... must be a mistake');

	}
