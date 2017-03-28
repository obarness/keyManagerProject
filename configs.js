var configs = {};


//this is the string used in encryption. string can't be empty, therefore initialized.
configs.revoke_string = " 0";

//array of addresses to send video to.
configs.BROADCAST_ADDRESS = ['192.168.1.255'];

//server which provides public and private keys.
configs.SERVER_ADDRESS = '192.168.1.17';
configs.SERVER_ADDRESS = '192.168.1.17';
//number of keys broadcaster and client keeps.
configs.NUM_OF_AES_KEYS = 10;

//keys server port for https requests (should probably be 343).
configs.SERVER_PORT = 1111;

configs.VLC_PORT=6000;

//how often we change aes key. (in miliseconds. (1000 ms = 1 second).)
configs.CHANGE_KEY_INTERVAL = 2500; 

//how often aes key is being sent, in miliseconds.
configs.SEND_KEY_INTERVAL = 1000;

//port which client uses in order to send decrypted packets.
configs.send_Dec_port = 9998;
//broadcaster sends ffmpeg's output to this port, than encrypts the packets.
configs.ffmpegOutPort = 9996;


module.exports = configs;