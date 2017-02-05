//broadcaster code
function broadcastAesKey(aesKey, aesSeq){
			aesKey = aesKey.toString('hex');
			const dgram = require('dgram');
			const message = new Buffer('Some bytes');
			const client = dgram.createSocket('udp4');
			const client2 = dgram.createSocket('udp4');
			var BROADCAST_ADDRESS = '192.168.1.255';
			const port = 6022;
			const path = require('path');
			__dirname = path.resolve(path.dirname(''));
			var aesKeyPath = path.join(__dirname + "/js/aeskey/key");

			//save key as a file.
			var fs = require('fs');
			fs.writeFileSync(aesKeyPath, aesKey, function(err) {
	        	if(err) {
	        		throw err;
	           	return  console.log(err);
	        	}
        	});
			
			//encrypt the file
			
			var pubkey = path.join(__dirname + "/js/masterkey/public");
			var masterkey = path.join(__dirname + "/js/masterkey/master");

			var sys = require('sys')
			var exec = require('child_process').execSync;
			function puts(error, stdout, stderr) { sys.puts(stdout) }
			exec("cpabe-enc "+ "-p " + pubkey + " -m " + masterkey + " -i " + aesKeyPath +" -a 1");
			//      cpabe-enc     -p     public     -m     master        -i     key           -a 1
			

			//read buffer from file and send it to client.
			var buf = fs.readFileSync(aesKeyPath+'.cpabe', (err, data) => {
		  		if (err) throw err;

				});	
		
			
			
			var keyId = aesSeq.toString();
			var keyIdBuf = new Buffer(keyId);

			var timesToSend = 3;


			//we should be sending a few times, since udp is unreliable.
			
			client2.send(keyIdBuf,0,keyIdBuf.length ,port, BROADCAST_ADDRESS, (err) => {
		  		client2.close();
			});
			


			
			client2.on('listening', function(){
			var address = client2.address();
			client2.setBroadcast(true);

			});
			
			
			client.send(buf,0,buf.length ,port, BROADCAST_ADDRESS, (err) => {
	  			client.close();
			});
			

			
			client.on('listening', function(){
			var address = client.address();
			client.setBroadcast(true);

			});


}

