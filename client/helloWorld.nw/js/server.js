var http = require('http'); //require the 'http' module

//create a server
http

var server = http.createServer();

server.on('request', function(request, response) {
	console.log('request has arrived');
	var url = request.url;
	console.log(url);
  // the same kind of magic happens here!
}).listen(1337, '127.0.0.1');


console.log('Server running at http://127.0.0.1:1337/');