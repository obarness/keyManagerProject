var fs = require('fs');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('server.key', 'utf8');
var certificate = fs.readFileSync('server.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};
var express = require('express');
var app = express();

// your express configuration here
var PORT = 1111;
app.get('/', function(req,res) {
	handleRequest(req,res);
	httpsServer.close();
   

});

var httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT);

function handleRequest(request, response){
	console.log("received a request, user is from " + request.params)
	getKey(response);

    //this is so that we don't have to change port#
    //remove this for real functionality
    
}


function getKey(response){
	var userId=18;
	var channelId=13;
	var keyPath = generateKey(userId, channelId);
	 console.log("key generated");
  	sendKey(keyPath,response);
    return keyPath;
}

function generateKey(userId, channelId){

	console.log("TRYING TO GENERATE KEY");

var pubkey = "/home/omer/workspace/keyManagerProject/encryption/cpabe-0.11/pubkey";
var masterkey = "/home/omer/workspace/keyManagerProject/encryption/cpabe-0.11/masterkey";
var keyName = "channel#_"+channelId+"_user#_"+userId;
var keyPath = "/home/omer/workspace/keyManagerProject/server/"+keyName;
var sys = require('sys')
var exec = require('child_process').execSync;
function puts(error, stdout, stderr) { sys.puts(stdout) }
exec("cpabe-keygen "+ "-o " + "channel#_"+channelId+"_user# -p " + pubkey + " -m " + masterkey + " -a " + userId, puts);
return keyName;
}

function sendKey(fileName,response){
	var path = require('path');
	var filePath = path.join(__dirname, fileName);
   // var stat = fs.statSync(filePath);
    var file = fs.readFile(filePath, 'binary');
	response.sendFile(filePath);
    
    //var readStream = fs.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to readStream.pipe()
    //readStream.pipe(response);

}
