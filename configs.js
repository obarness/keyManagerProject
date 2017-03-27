var configs = {};

configs.revoke_string = " 0";
configs.BROADCAST_ADDRESS = '192.168.1.255';
configs.SERVER_ADDRESS = '192.168.1.17';
configs.NUM_OF_AES_KEYS = 10;
configs.SERVER_PORT = 1111;
configs.VLC_PORT=6000;
configs.CHANGE_KEY_INTERVAL = 2500 // in miliseconds.

//port which client uses in order to send decrypted packets.
configs.send_Dec_port = 9998;
//broadcaster sends ffmpeg's output to this port, than encrypts the packets.
configs.ffmpegOutPort = 9996;


module.exports = configs;