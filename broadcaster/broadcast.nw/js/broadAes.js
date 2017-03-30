
//broadcaster code
var configs = require('./../../configs.js');



function revokeUser(){
	var user_id = document.forms["revoke"]["user_id"].value;
	configs.revoke_string += "_" + user_id;
	alert("revoke string:" + configs.revoke_string );
}

function broadcastAesKey(aesKey, aesSeq, channelId){
			aesKey = aesKey.toString('hex');
			const dgram = require('dgram');
			const message = new Buffer('Some bytes');
			const client = dgram.createSocket('udp4');
			const client2 = dgram.createSocket('udp4');
			var database = require('./../../database.js');
			


			const port = database.getKeyPortById(channelId);
			const path = require('path');
			__dirname = path.resolve(path.dirname(''));
			var aesKeyPath = path.join(__dirname + "/js/aeskey/key");
			var configs = require('./../../configs.js');
			var revoke_string = new String(configs.revoke_string);
			var BROADCAST_ADDRESSES = configs.BROADCAST_ADDRESSES;

			

			//save key as a file.
			var fs = require('fs');

			for(var i=0; i<BROADCAST_ADDRESSES.length;i++){
      			if(configs.BROADCAST_SERVER[i]==1){
			
					fs.writeFileSync(aesKeyPath, aesKey, function(err) {
			        	if(err) {
			        		throw err;
			           	return  console.log(err);
			        	}
		        	});
					
					//encrypt the file
					
					var pubkey = path.join(__dirname + "/js/companies/"+ configs.SERVER_NAMES[i] + "/pubkey_"+channelId);


					var sys = require('sys')
					var exec = require('child_process').execSync;
					function puts(error, stdout, stderr) { sys.puts(stdout) }
																									//replace 1 with revoke.
					exec("cpabe-enc "+ "-p " + pubkey  + " -i " + aesKeyPath +" -a" + revoke_string);
					//      cpabe-enc     -p     public     -m     master        -i     key           -a 1
					

					//read buffer from file and send it to client.
					var buf = fs.readFileSync(aesKeyPath+'.cpabe', (err, data) => {
				  		if (err) throw err;

						});	

					var keyId = aesSeq.toString();		
					var keyIdBuf = new Buffer(keyId);

					client2.send(keyIdBuf,0,keyIdBuf.length ,port, BROADCAST_ADDRESSES[i], (err) => {
				  		
					});

					client.send(buf,0,buf.length ,port, BROADCAST_ADDRESSES[i], (err) => {
			  			
					});
	
				}

				if(i == BROADCAST_ADDRESSES.length){
					client2.close();
					client.close();
				}

			}
			//we should be sending a few times, since udp is unreliable.
			client2.on('listening', function(){
				var address = client2.address();
				client2.setBroadcast(true);

				});

			client.on('listening', function(){
				var address = client.address();
				client.setBroadcast(true);

				});


	


}

