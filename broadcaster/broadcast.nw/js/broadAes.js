//broadcaster code
function broadcastAesKey(aesKey){

			aesKey = aesKey.toString('hex');
			alert("our session key is:" + aesKey);

	 		var crypto = require('crypto');
			const dgram = require('dgram');
			const message = new Buffer('Some bytes');
			const client = dgram.createSocket('udp4');
			var port = 5004;
			var aesKeyPath = "/home/omer/workspace/keyManagerProject/broadcaster/broadcast.nw/js/aeskey/key";

			//save key as a file.
			var fs = require('fs');
			fs.writeFileSync(aesKeyPath, aesKey, function(err) {
	        	if(err) {
	        		throw err;
	           	return  alert(err);
	        	}
        	});
			
			alert("passedfilewriting");
			//encrypt the file
			var pubkey = 	"/home/omer/workspace/keyManagerProject/broadcaster/broadcast.nw/js/masterkey/public";
			var masterkey = "/home/omer/workspace/keyManagerProject/broadcaster/broadcast.nw/js/masterkey/master";
			var sys = require('sys')
			var exec = require('child_process').execSync;
			function puts(error, stdout, stderr) { sys.puts(stdout) }
			exec("cpabe-enc "+ "-p " + pubkey + " -m " + masterkey + " -i " + aesKeyPath +" -a 1");
			//      cpabe-enc     -p     public     -m     master        -i     key           -a 1
			

			var buf = fs.readFileSync(aesKeyPath+'.cpabe', (err, data) => {
		  		if (err) throw err;

				});	
		
			//read buffer from file and send it to client.


			client.send(buf,0,buf.length ,port, '127.0.0.1', (err) => {
	  		client.close();
			});
			alert('successfully sent buffer');

}

