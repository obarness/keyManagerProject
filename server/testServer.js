var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');
var privateKey  = fs.readFileSync('server.key', 'utf8');
var certificate = fs.readFileSync('server.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};
var express = require('express');
var app = express();

// your express configuration here
var PORT = 1111;

app.get('/', function(req, res) {
	console.log("we're here");
    res.sendFile(path.join(__dirname + '/html/index.html'));
    httpsServer.close();
});




app.get('/createPrivateKey', function(req,res) {
	getPrivateKey(req,res);
	httpsServer.close();
});


app.get('/createMasterkey', function(req,res) {
	getMasterKey(req,res);
	httpsServer.close();
});

app.get('/getPublicKey', function(req,res) {
	getPublicKey(req,res);
	httpsServer.close();
});

function getPublicKey(request, response){
	const path = require('path');
	__dirname = path.resolve(path.dirname(''));
	console.log("TRYING TO GENERATE KEY");
	var pubkey = path.join(__dirname + "/keys/pubkeys/public");
  	response.sendFile(pubkey);
}

var httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT);



function getPrivateKey(request, response){
	console.log("received a request, user is from " + request.query.id)
	var userId=100;
	var channelId=13;
	generatePrivateKey(userId, channelId, response);

  
}

function getMasterKey(request, response){
	console.log("received a request, user is from " + request.query.id)
	var channelId=13;
	generateMasterKey(channelId, response);

  
}



function generatePrivateKey(userId, channelId, response){
	const path = require('path');
	__dirname = path.resolve(path.dirname(''));
	console.log("TRYING TO GENERATE KEY");
	var pubkey = path.join(__dirname + "/keys/pubkeys/public");
	var masterkey = path.join(__dirname + "/keys/masterkeys/master");
	var keyName = path.join(__dirname + "/keys/privatekeys/private");
	var sys = require('sys')
	var exec = require('child_process').execSync;
	function puts(error, stdout, stderr) { sys.puts(stdout) }
	exec("cpabe-keygen "+ "-o " + keyName + " -p " + pubkey + " -m " + masterkey + " -a " + userId);
	response.sendFile(keyName);
}

function generateMasterKey(channelId,response){
	const path = require('path');
	__dirname = path.resolve(path.dirname(''));
	var pubkey = path.join(__dirname + "/keys/pubkeys/public");
	var masterkey = path.join(__dirname + "/keys/masterkeys/master");
	var sys = require('sys')
	var exec = require('child_process').execSync;
	function puts(error, stdout, stderr) { sys.puts(stdout) }
	exec("cpabe-setup "+ "-p " + pubkey+ " -m " + masterkey, puts);
	console.log("success");
	response.sendFile(masterkey);

}


