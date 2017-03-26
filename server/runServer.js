var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');
var privateKey  = fs.readFileSync('server.key', 'utf8');
var certificate = fs.readFileSync('server.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};
var express = require('express');
var app = express();
var configs = require('../configs.js');


// your express configuration here
var SERVER_PORT = configs.SERVER_PORT;
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(SERVER_PORT);



httpsServer.on('close', function (){
        	httpsServer.close();
        });

app.get('/', function(req, res) {
	console.log("we're here");
    res.sendFile(path.join(__dirname + '/html/index.html'));
    httpsServer.close();
});


app.get(/.PublicKey_*/, function(req,res) {
	var ChannelId = req.originalUrl.substr('/PublicKey_'.length);
	getPublicKey(req,res,ChannelId);
	


});

app.get(/.Masterkey_*/, function(req,res) {
	var ChannelId = req.originalUrl.substr('/Masterkey_'.length);
	console.log(ChannelId);
	generateMasterKey(ChannelId);
	var pubkey = path.join(__dirname + "/keys/pubkeys/public_"+ChannelId);
  	res.sendFile(pubkey);
	


});

app.get(/.PrivateKey_*/, function(req,res) {
	var input = req.originalUrl.substr('/PrivateKey_'.length);
	var arr = input.split("_");
	var ChannelId = arr[0];
	var userId = arr[1];
	generatePrivateKey(userId,ChannelId,res);
	

});


function getPublicKey(request, response, ChannelId){
	console.log(ChannelId);
	
	const path = require('path');
	__dirname = path.resolve(path.dirname(''));
	console.log("TRYING TO GENERATE KEY");
	var pubkey = path.join(__dirname + "/keys/pubkeys/public_"+ChannelId);
	console.log(pubkey);
  	response.sendFile(pubkey);
}





function generatePrivateKey(userId, channelId, response){
	const path = require('path');
	__dirname = path.resolve(path.dirname(''));
	console.log("TRYING TO GENERATE KEY");
	var pubkey = path.join(__dirname + "/keys/pubkeys/public_"+channelId);
	var masterkey = path.join(__dirname + "/keys/masterkeys/master_"+channelId);
	var keyName = path.join(__dirname + "/keys/privatekeys/private_"+ channelId + '_' + userId);
	var sys = require('sys')
	var exec = require('child_process').execSync;
	function puts(error, stdout, stderr) { sys.puts(stdout) }
	exec("cpabe-keygen "+ "-o " + keyName + " -p " + pubkey + " -m " + masterkey + " -a " + userId);
	response.sendFile(keyName);
}

function generateMasterKey(channelId){
	const path = require('path');
	__dirname = path.resolve(path.dirname(''));
	var pubkey = path.join(__dirname + "/keys/pubkeys/public_"+channelId);
	var masterkey = path.join(__dirname + "/keys/masterkeys/master_"+channelId);
	var sys = require('sys')
	var exec = require('child_process').execSync;
	function puts(error, stdout, stderr) { sys.puts(stdout) }
	exec("cpabe-setup "+ "-p " + pubkey+ " -m " + masterkey, puts);
	console.log("success");
}




/**  Do not delete.

	following functions were replaced with more flexible functions.
	new functions can parse the channelId that is requested.


app.get('/createPrivateKey', function(req,res) {
	getPrivateKey(req,res);
	httpsServer.close();
});


function getPrivateKey(request, response, channelId, userId){
	console.log("received a request, user is from " + request.query.id)
	generatePrivateKey(userId, channelId, response);

  
}


app.get('/createMasterkey', function(req,res) {
	var channelId=13;
	generateMasterKey(channelId);
	httpsServer.close();
});

app.get('/getPublicKey', function(req,res) {
	console.log ("pubkey?");
	getPublicKey(req,res);
	httpsServer.close();
});

*/