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
	
	//check if user is already revoked
	if(revoke_string.toString().indexOf('_'+userId+'_') != -1){
		alert("already revoked!");
		return;
	}
	var node = document.getElementById("revokedList");
	node.innerHTML += '\n' + userId;
	



	//write new string
	var newRevokeString = revoke_string.toString() + userId+ '_';
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
		return;

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
}

