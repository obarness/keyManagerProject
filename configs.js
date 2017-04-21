var configs = {};


//this is the string used in encryption. string can't be empty, therefore initialized.
configs.revoke_string = " 0";

//array of addresses to send video to.
configs.BROADCAST_ADDRESSES = ['192.168.1.255','192.268.1.255','192.268.1.255','192.268.1.255'];

//server which provides public and private keys.
configs.SERVER_ADDRESSES = ['10.0.2.15','192.168.1.17','192.168.1.17','192.168.1.17'];

configs.SERVER_NAMES = 		['HOT','COLD','YES', 'NO'];

configs.BROADCAST_SERVER = 		[1,0,0,0];


//number of keys broadcaster and client keeps.
configs.NUM_OF_AES_KEYS = 10;

//keys server port for https requests (should probably be 343).
configs.SERVER_PORT = 1115;

configs.VLC_PORT=6000;

//how often we change aes key. (in miliseconds. (1000 ms = 1 second).)
configs.CHANGE_KEY_INTERVAL = 4000; 

//how often aes key is being sent, in miliseconds.
configs.SEND_KEY_INTERVAL = 1000;

//port which client uses in order to send decrypted packets.
configs.send_Dec_port = 9998;
//broadcaster sends ffmpeg's output to this port, than encrypts the packets.
configs.ffmpegOutPort = 9996;

configs.lastKeySent = -1;


module.exports = configs;