How this works.


=======================================
=======================================
=========RUNNING THIS APP==============
=======================================
=======================================

this app is designed to work on 64-bit based ubuntu os.

In order to run this app you need the following components installed:
*nwjs (aka node-webkit).
*nodejs.
*vlc media player


=======================================
=======================================
==============App flow=================
=======================================
=======================================

App flow:

*Receive - encrypted packets are being received on port 5000 (see receivePacket.js).
*Forward - the encrypted message is being decrypted, and the output is being sent to localhost:6000.
*Watching - in order to watch the video, you need to open vlc on port 6000 (see vlcCtrl.js)

encrypted packets, are encrypted with AES. 
The key to decrypt the video, is being decrypted using a private key, which can be obtained only by https.



