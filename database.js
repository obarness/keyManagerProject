var database = {};

//each channel will send it's video to port xxxxx
//and it's aesKey to port xxxxx+1
//no two channels can send video to same ports (by implementation of function).

database.getVideoPortById = function(ChannelId){
	
	var IdNum = parseInt(ChannelId);
	IdNum *= 2;
	var port =  10000 + IdNum;
	return port.toString();
}

database.getKeyPortById = function(ChannelId){

	var IdNum = parseInt(ChannelId);
	IdNum *= 2;
	var port =  10000 + IdNum + 1;
	return port.toString();

}


module.exports = database;