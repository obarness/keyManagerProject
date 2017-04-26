
var configs = require('./../../configs.js');



function broadcastAesKey(aesKey, aesSeq, channelId,lastKeyIdSent){
			aesKey = aesKey.toString('hex');
			const dgram = require('dgram');
			const message = new Buffer('Some bytes');
			const client = dgram.createSocket('udp4');
			const client2 = dgram.createSocket('udp4');
			var database = require('./../../database.js');

			
			const path = require('path');
			__dirname = path.resolve(path.dirname(''));
			var aesKeyPath = path.join(__dirname + "/js/aeskey/key");
			var configs = require('./../../configs.js');
			var BROADCAST_ADDRESSES = configs.BROADCAST_ADDRESSES;
			
			//we're trying to send an older key, skip this.
			if((lastKeyIdSent[0] > aesSeq+1 ) && aesSeq!=0){
				return;
			}
			else{
				lastKeyIdSent[0] = aesSeq;


			}
			


			


			

			//save key as a file.
			var fs = require('fs');

			for(var i=0; i<BROADCAST_ADDRESSES.length;i++){
      			if(configs.BROADCAST_SERVER[i]==1){
			
				var aesKeyPath = path.join(__dirname + "/js/companies/" + configs.SERVER_NAMES[i]+'/aeskey/key');
					fs.writeFileSync(aesKeyPath, aesKey, function(err) {
			        	if(err) {
			        		throw err;
			           	return  log(err);
			        	}
		        	});
					
					//encrypt the file
					
					var pubkey = path.join(__dirname + "/js/companies/"+ configs.SERVER_NAMES[i] + "/pubkey_"+channelId);
					var revoke_path = path.join(__dirname + "/js/companies/"+ configs.SERVER_NAMES[i] + "/revoke_"+channelId)
					if(configs.FULL_ENCRYPTION){
						var revoke_string = fs.readFileSync(revoke_path, (err, data) => {
					  		if (err) throw err;

						});	
					}
					

					var sys = require('sys')
					var exec = require('child_process').execSync;
					function puts(error, stdout, stderr) { sys.puts(stdout) }
					
					var buf; 

					if(configs.FULL_ENCRYPTION){
						exec("cpabe-enc "+ "-p " + pubkey  + " -i " + aesKeyPath +" -a " + revoke_string);
						buf = fs.readFileSync(aesKeyPath+'.cpabe', (err, data) => {
				  		if (err) throw err;
						});	
						
					}
					//      cpabe-enc     -p     public     -m     master        -i     key           -a 1
					else{
						buf = fs.readFileSync(aesKeyPath, (err, data) => {
								if (err) throw err;
								});	
					}
					



					var keyId = aesSeq.toString();		
					var keyIdBuf = new Buffer(keyId);

					client2.send(keyIdBuf,0,keyIdBuf.length ,database.getKeyPortById(channelId,configs.SERVER_ID[i]), BROADCAST_ADDRESSES[i], (err) => {
				  		
					});

					
					client.send(buf,0,buf.length ,database.getKeyPortById(channelId,configs.SERVER_ID[i]), BROADCAST_ADDRESSES[i], (err) => {
			  			
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
				if(configs.BROADCAST)
					client2.setBroadcast(true);

				});

			client.on('listening', function(){
				var address = client.address();
				if(configs.BROADCAST)
					client.setBroadcast(true);

				});


}

