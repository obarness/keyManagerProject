var revokeUser = function(){

	const path = require('path');
	__dirname = path.resolve(path.dirname(''));
	var fs = require('fs');
	//read old string

	var channelId = document.forms["revoke"]["channelId"].value;
	var userId = document.forms["revoke"]["user_id"].value;
	var revokePath = path.join(__dirname + "/keys/revokeStrings/revoke_"+channelId);

	var revoke_string = fs.readFileSync(revokePath, (err, data) => {
			if (err) throw err;
	});	

	//write new string
	var newRevokeString = revoke_string.toString()+'_'+ userId;
	fs.writeFileSync(revokePath, newRevokeString, function(err) {
			        	if(err) {
			        		throw err;
			           	return  console.log(err);
			        	}
		        	});
}

