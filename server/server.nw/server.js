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


var unrevokeUser = function(){

	const path = require('path');
	__dirname = path.resolve(path.dirname(''));
	var fs = require('fs');
	//read old string

	var channelId = document.forms["unrevoke"]["channelId"].value;
	var userId = document.forms["unrevoke"]["user_id"].value;
	var revokePath = path.join(__dirname + "/keys/revokeStrings/revoke_"+channelId);

	var revoke_string = fs.readFileSync(revokePath, (err, data) => {
			if (err) throw err;
	});	


	var newRevokeString;
	revoke_string = revoke_string.toString();
	//in case user id is in middle of string
	var index = revoke_string.indexOf('_'+userId+'_');
	
	if(index==-1){
		//in case user id is at the end of string.
		var index = revoke_string.indexOf('_'+userId);
		
		if(index==-1)
			return;
		else{
			newRevokeString = revoke_string.substr(0,index);
			
		}

	}

	else{
		var preString = revoke_string.substr(0,index);
		var postString = revoke_string.substr(index+2);
		newRevokeString = preString + postString;
	}

	//write new string
	fs.writeFileSync(revokePath, newRevokeString, function(err) {
			        	if(err) {
			        		throw err;
			           	return  console.log(err);
			        	}
		        	});
}

