
	var fs = require('fs');
	var http = require('http');
	var https = require('https');
	var path = require('path');
	var privateKey  = fs.readFileSync('server.key', 'utf8');
	var certificate = fs.readFileSync('server.crt', 'utf8');
	var credentials = {key: privateKey, cert: certificate};
	var express = require('express');
	var app = express();
	var configs = require('../../configs.js');

	//override console.log in order to display output on terminal.
	/*
	var console = new function(){
		this.log = function(message){
		process.stdout.write(message);
		}

	}
*/
	var broadcastersList =[];
	broadcastersList.push("broadcaster ip        channel id");
	var usersList = [];
	usersList.push("user id     user ip           channel id");

	// your express configuration here
	var SERVER_PORT = configs.SERVER_PORT;
	var httpsServer = https.createServer(credentials, app);
	httpsServer.listen(SERVER_PORT);


	httpsServer.on('close', function (){
		console.log("server has been shut down");
	        	//httpsServer.close();
	        });

	httpsServer.on('listening', function (){
			console.log("server is running on port:" + httpsServer.address().port);
	        	
	});

	httpsServer.on('error', function (err){
			console.log("error on server: " + err);
	        httpsServer.close();
	});

	app.get('/', function(req, res) {
		console.log("request for index.html is being processed");
		console.log("sending file index.html to user");
	    res.sendFile(path.join(__dirname + '/html/index.html'));
	    httpsServer.close();
	});


	app.get(/.PublicKey_*/, function(req,res) {
		var channelId = req.originalUrl.substr('/PublicKey_'.length);
		console.log("proccessing request for public key, channel: "+channelId);
		getPublicKey(req,res,channelId);
		
	});

	app.get(/.Masterkey_*/, function(req,res) {
		var channelId = req.originalUrl.substr('/Masterkey_'.length);
		console.log("proccessing request elements initialization for channel: "+channelId);
		generateMasterKey(channelId);
		generateRevokeString(channelId);
		console.log("sending public key to broadcaster for channel: "+channelId);
		var pubkey = path.join(__dirname + "/keys/pubkeys/public_"+channelId);
	  	res.sendFile(pubkey);
	  	console.log("public key sent");
	  	console.log("==============")

	  	broadcastersList.push(req.ip  + "     " + channelId);
	  	console.log(broadcastersList);
	  	console.log("==============")
		

	});

	app.get(/.revoke_*/, function(req,res) {
		var channelId = req.originalUrl.substr('/revoke_'.length);
		console.log("broadcaster has requested revoke file for channel:" + channelId);
		getRevokeFIle(req,res,channelId);
		

	});

	app.get(/.PrivateKey_*/, function(req,res) {
		var input = req.originalUrl.substr('/PrivateKey_'.length);
		var arr = input.split("_");
		var channelId = arr[0];
		var userId = arr[1];
		console.log("proccessing request for private key. user id:"+userId +", channel id: " +channelId);
		generatePrivateKey(userId,channelId,res);

		usersList.push(userId +'       '+  req.ip+'      '+channelId);
		console.log("==============")
	  	console.log(usersList);
	  	console.log("==============")
		

	});

	function getRevokeFIle(request, response, channelId){
		
			const path = require('path');
		__dirname = path.resolve(path.dirname(''));
		var revokePath = path.join(__dirname + "/keys/revokeStrings/revoke_"+channelId);
		console.log("sending revoke file to broadcaster");
	  	response.sendFile(revokePath);

	}


	function getPublicKey(request, response, channelId){
		const path = require('path');
		__dirname = path.resolve(path.dirname(''));
		var pubkey = path.join(__dirname + "/keys/pubkeys/public_"+channelId);
	  	response.sendFile(pubkey);
	}

	function generatePrivateKey(userId, channelId, response){
		const path = require('path');
		__dirname = path.resolve(path.dirname(''));
		console.log("generating private key. user id:"+userId +", channel id: " +channelId);
		var pubkey = path.join(__dirname + "/keys/pubkeys/public_"+channelId);
		var masterkey = path.join(__dirname + "/keys/masterkeys/master_"+channelId);
		var keyName = path.join(__dirname + "/keys/privatekeys/private_"+ channelId + '_' + userId);
		var sys = require('sys')
		var exec = require('child_process').execSync;
		function puts(error, stdout, stderr) { sys.puts(stdout) }
		exec("cpabe-keygen "+ "-o " + keyName + " -p " + pubkey + " -m " + masterkey + " -a " + userId);
		console.log("private key created. user id:"+userId +", channel id: " +channelId);
		console.log("sending private key. user id:"+userId +", channel id: " +channelId);
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
		console.log("elements for channel "+channelId + "initialized");
	}

	function generateRevokeString(channelId){
	const path = require('path');
	__dirname = path.resolve(path.dirname(''));
	var revokePath = path.join(__dirname + "/keys/revokeStrings/revoke_"+channelId);

	var fs = require('fs');
	fs.writeFileSync(revokePath, '0_', function(err) {
			        	if(err) {
			        		throw err;
			           	return  console.log(err);
			        	}
		        	});
	}
