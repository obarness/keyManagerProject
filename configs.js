var configs = {};



//array of addresses to send video to.
configs.BROADCAST_ADDRESSES = ['192.168.1.255','192.268.1.255','192.268.1.255','192.268.1.255'];

//server which provides public and private keys.
configs.SERVER_ADDRESSES = ['192.168.1.32','10.0.2.15','10.0.2.15','10.0.2.15'];

configs.SERVER_NAMES = 		['HOT','COLD','YES', 'NO'];

configs.BROADCAST_SERVER = 		[1,0,0,0];


//number of keys broadcaster and client keeps.
configs.NUM_OF_AES_KEYS = 10;

//keys server port for https requests (should probably be 443).
configs.SERVER_PORT = 1115;

configs.VLC_PORT=6000;

//how often we change aes key. (in miliseconds. (1000 ms = 1 second).)
configs.CHANGE_KEY_INTERVAL = 4000; 

//how often aes key is being sent, in miliseconds.
configs.SEND_KEY_INTERVAL = 1000;

//port which client uses in order to send decrypted packets.
configs.send_Dec_port = 9498;

//broadcaster sends ffmpeg's output to this port, than encrypts the packets.
configs.ffmpegOutPort = 9996;


//if sed to 0, and NO_ENCRYPTION set to 0, only AES encryption is applied.
configs.FULL_ENCRYPTION = 0;

//video is sent directly to vlc port of  configs.NO_ENCRYPTION_USER_ADDRESS  or configs.NO_ENCRYPTION_BROADCAST_ADDRESS
configs.NO_ENCRYPTION = 1;

//whether to broadcast or sent directly to a specific user
configs.BROADCAST = 1;

//in case we are not broadcasting.
configs.NO_ENCRYPTION_USER_ADDRESS = '127.0.0.1';

configs.NO_ENCRYPTION_BROADCAST_ADDRESS = '127.0.0.255';




module.exports = configs;