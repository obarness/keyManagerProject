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
	console.log("received a request, user is from " + request.query.id)
	var channelId=13;
	keyPath ="/pubkeys/public";
	console.log("looking for public key");
  	sendKey(keyPath,response);
    return keyPath;
}

var httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT);



function getPrivateKey(request, response){
	console.log("received a request, user is from " + request.query.id)
	var userId=18;
	var channelId=13;
	var keyPath = generatePrivateKey(userId, channelId);
	 console.log("key generated");
  	sendKey(keyPath,response);
    return keyPath;
  
}

function getMasterKey(request, response){
	console.log("received a request, user is from " + request.query.id)
	var channelId=13;
	var keyPath = generateMasterKey(channelId);
	console.log("key generated");
  	sendKey(keyPath,response);
    return keyPath;
  
}

function sendKey(fileName,response){
	var filePath = path.join(__dirname, "/keys"+fileName);
    var file = fs.readFile(filePath, 'binary');
	response.sendFile(filePath);
}

function generatePrivateKey(userId, channelId){

	console.log("TRYING TO GENERATE KEY");
	var pubkey = "/home/omer/workspace/keyManagerProject/server/keys/pubkeys/public"
	var masterkey = "/home/omer/workspace/keyManagerProject/server/keys/masterkeys/master";
	//var keyName = "/privatekeys/channel#_"+channelId+"_user#_"+userId;
	var keyName = "/privatekeys/private";
	var keyPath = "/home/omer/workspace/keyManagerProject/server/keys/privatekeys/"+keyName;
	var sys = require('sys')
	var exec = require('child_process').execSync;
	function puts(error, stdout, stderr) { sys.puts(stdout) }
	exec("cpabe-keygen "+ "-o " + "private -p " + pubkey + " -m " + masterkey + " -a " + userId, puts);
	return keyName;
}

function generateMasterKey(channelId){

	console.log("Generating master key for channel # "  +channelId);
	masterKeyName = "master";
	pubKeyName ="public";
	var sys = require('sys')
	var exec = require('child_process').execSync;
	function puts(error, stdout, stderr) { sys.puts(stdout) }
	exec("cpabe-setup "+ "-p " + pubKeyName+ " -m " + masterKeyName, puts);

	return "/masterkeys/"+masterKeyName;
}




