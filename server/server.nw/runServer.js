
	var fs = require('fs');
	var http = require('http');
	var https = require('https');
	var path = require('path');
	var bodyParser = require('body-parser');
	var privateKey  = fs.readFileSync('server.key', 'utf8');
	var certificate = fs.readFileSync('server.crt', 'utf8');
	var credentials = {key: privateKey, cert: certificate};
	var express = require('express');
	var app = express();
	var configs = require('../../configs.js');
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());  

	//override console.log in order to display output on terminal.
	/*
	var console = new function(){
		this.log = function(message){
		process.stdout.write(message);
		}

	}
	*/


	var broadcastersList =[];
	
	var usersList = [];
	

	// your express configuration here
	var SERVER_PORT = configs.SERVER_PORT;
	var httpsServer = https.createServer(credentials, app);
	httpsServer.listen(SERVER_PORT);


	httpsServer.on('close', function (){
		console.log("server has been shut down");
	        	//httpsServer.close();
	        });

	httpsServer.on('listening', function (){
			console.log("server is running access on: https://localhost:" + httpsServer.address().port);
	        	
	});

	httpsServer.on('error', function (err){
			console.log("error on server: " + err);
	        httpsServer.close();
	});

	app.use(express.static(path.join(__dirname,'/')));

	app.get('/', function(req, res) {
		console.log("request for index.html is being processed");
		console.log("sending file index.html to user");
	    res.sendFile(path.join(__dirname + '/index.html'));
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

	  	broadcastersList.push({channelId:channelId,channelIP:req.ip});
	  		  	console.log(broadcastersList);
	  		  	console.log("==============");
	  			

	});

	app.get(/.revoke_*/, function(req,res) {
		var channelId = req.originalUrl.substr('/revoke_'.length);
		console.log("broadcaster has requested revoke file for channel:" + channelId);
		getRevokeFIle(req,res,channelId);


		/*
  		//TODO - NEW ENCRYPTION SCHEME: 
  		this function is triggered when a broadcaster asks for revocation data.
  		in the new scheme, revocation data isn't used to encrypt. 
  		this function and the functions it calls/uses should be modified in order to support the creation
  		and distribution of a SUM (state update message). 
  		in general - this is where we need to support the new scheme's function [Revoke(msk,S)] which outputs new PP and the SUM,.
  		*/
		

	});

	app.get(/.PrivateKey_*/, function(req,res) {
		var input = req.originalUrl.substr('/PrivateKey_'.length);
		var arr = input.split("_");
		var channelId = arr[0];
		var userId = arr[1];
		console.log("proccessing request for private key. user id:"+userId +", channel id: " +channelId);
		generatePrivateKey(userId,channelId,res);

		usersList.push({channelId:channelId, userId:userId, userIP:req.ip});
		

	});


	//HTML will trigger this in order to receive revocation data.
	app.post('/revo', function(req,res) {
		
		
		var channelId = req.body.channelId;
		var userId = req.body.userid;
		var revokeString;

		console.log("revoke user: " + userId + " in channel: " + channelId);
		revokeString = revokeUser(channelId,userId);
		res.set({'Content-Type': 'text/plain'});
		res.end(JSON.stringify(revokeString));
		

	});


	app.post('/unrevoke', function(req,res) {
		
		var channelId = req.body.channelId;
		var userId = req.body.userid;
		var revokeString;

		console.log("Unrevoke user: " + userId + " in channel: " + channelId);
		revokeString = unrevokeUser(channelId,userId);
		res.set({'Content-Type': 'text/plain'});
		res.end(JSON.stringify(revokeString));
		

	});

	
	app.get('/ajaxuser', function(req, res) {

		res.set({'Content-Type': 'text/plain'});
		res.send(usersList);
		
	});
	
	app.get('/ajaxbroad', function(req, res) {

		res.set({'Content-Type': 'text/plain'});
		res.send(broadcastersList);
		
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

		//TODO - NEW ENCRYPTION SCHEME: alternate the command parameters above ("cpabe-keygen") to fir the future scheme.


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

		//TODO - NEW ENCRYPTION SCHEME: alternate the command parameters above ("cpabe-keygen") to fir the future scheme.

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


	function revokeData(revoke_string){
		revoke_string = revoke_string.substr(1)
		var printString = revoke_string.toString().replace('_',' ');
		while(printString != revoke_string.toString()){
			printString = revoke_string.toString();
			revoke_string = revoke_string.toString().replace('_',' ');
		}
	return printString;

	}


	function revokeUser(channelId,userId){

	const path = require('path');
	__dirname = path.resolve(path.dirname(''));
	var fs = require('fs');
	//read old string

	var channelId = channelId;
	var userId = userId;
	

	var revokePath = path.join(__dirname + "/keys/revokeStrings/revoke_"+channelId);

	var revoke_string = fs.readFileSync(revokePath, (err, data) => {
			if (err) throw err;
	});	
	
	//check if user is already revoked
	if(revoke_string.toString().indexOf('_'+userId+'_') != -1){
			var newString = revokeData(revoke_string.toString());
	return {'revokeString': newString,'channelId':channelId}
	}
	

	//write new string
	var newRevokeString = revoke_string.toString() + userId+ '_';

    

	fs.writeFileSync(revokePath, newRevokeString, function(err) {
			        	if(err) {
			        		throw err;
			           	return  console.log(err);
			        	}
		        	});
	var newString = revokeData(newRevokeString);
	return {'revokeString': newString,'channelId':channelId}
}


function unrevokeUser(channelId,userId){

	const path = require('path');
	__dirname = path.resolve(path.dirname(''));
	var fs = require('fs');
	//read old string

	var channelId = channelId;
	var userId = userId;
	var revokePath = path.join(__dirname + "/keys/revokeStrings/revoke_"+channelId);

	var revoke_string = fs.readFileSync(revokePath, (err, data) => {
			if (err) throw err;
	});	


	var newRevokeString;
	revoke_string = revoke_string.toString();
	//in case user id is in middle of string
	var index = revoke_string.indexOf('_'+userId+'_');
	
	if(index==-1){

		var newString = revokeData(newRevokeString);
		return {'revokeString': newString,'channelId':channelId}

	}

	else{
		var preString = revoke_string.substr(0,index+1);
		var postString = revoke_string.substr(index+2+userId.length);
		newRevokeString = preString + postString;
	}

	
	//write new string
	fs.writeFileSync(revokePath, newRevokeString, function(err) {
			        	if(err) {
			        		throw err;
			           	return  console.log(err);
			        	}
		        	});

	
	var newString = revokeData(newRevokeString);
	return {'revokeString': newString,'channelId':channelId}

	
}

