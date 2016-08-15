var dgram = require('dgram');
var socket = dgram.createSocket('udp4');

var testmessage = "[hello broadcaster] pid: " + process.pid;

var address = '192.168.0.255';//change for your LAN
var port = 5555;



function sendmessage (){
	socket.send(new Buffer(testmessage), 
		0,
		testmessage.length,
		port,
		address,
		function(err){
			if (err) console.log(err);

			console.log("Message sent");
		})
}



socket.bind(function(){
	socket.setBroadcast(true);
	setInterval(sendmessage,2000);
});
