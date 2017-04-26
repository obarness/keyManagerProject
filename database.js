var database = {};

//each channel will send it's video to port xxxxx
//and it's aesKey to port xxxxx+1
//no two channels can send video to same ports (by implementation of function).

database.getVideoPortById = function(channelId,serverId){
	
	var IdNum = parseInt(channelId);
	IdNum *= 6;
	var port =  10000 + IdNum + parseInt(serverId)*2;
	
	return port.toString();
}

database.getKeyPortById = function(channelId,serverId){

	var IdNum = parseInt(channelId);
	IdNum *= 6;
	var port =  10000 + IdNum + (parseInt(serverId)*2) +1 ;
	
	return port.toString();

}


module.exports = database;