var fs = require('fs');
var https = require('https');
var express = require('express');
var app = express();
var options = {
   key  : fs.readFileSync('server.key'),
   cert : fs.readFileSync('server.crt')
};

app.use(express.static(__dirname + '/public'));
//app.get()



var server = https.createServer(options, handleRequest);
var PORT =1111;


function handleRequest(request, response){
	getKey(response);
	//response.end("file sent?");
  response.end(null, 'binary');
  //  response.end('Private key created! key name: ' + getKey(response));

    //this is so that we don't have to change port#
    //remove this for real functionality
    server.close();
}


//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
   
});


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
    var stat = fs.statSync(filePath);
   
    response.writeHead(200, {
        'Content-Type': 'application/javascript',
        'Content-Length': stat.size
    });

	var file = fs.readFile(filePath, 'binary');
	response.write(file,'binary');
    
    //var readStream = fs.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to readStream.pipe()
    //readStream.pipe(response);

}
