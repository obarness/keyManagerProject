## Encrypted Broadcasting Revocation System

Written by:  Alik Geller and Omer Bar-Ness<br />
Department of Computer Science, Ben Gurion University of the Negev

## Synopsis

The aim of this project was to implement an internet based system prototype for encrypted video broadcasting. This project aims to examine the potential capabilities of such a system.

## Motivation

In the recent decade, technology has developed significantly. Specifically, it has had a major impact on social life. One of the main changes was the availability of internet, which caused an increase in the consumption of online videos. Yet the majority of television broadcasting content continues to be broadcasted via satellite or cables. The implementation of an internet based mass broadcasting system has many advantages. The most prominent one is the ability to turn every home computer into a broadcasting station.

## Introduction
Broadcasting a video using AES encryption is is a known method. However, this method can prove to be problematic. If an individual was, hypothetically, able to obtain the key, said individual would be able to steal our content. Hence, we wish to change the AES key frequently, in order to increase the difficulty of hacking the system. This, however, exposes a new issue - how to safely distribute a new key each time the AES key changes? The distribution via HTTPS is a safe and feasible solution. Although, it is rather unpractical as it requires a great deal of work from the server (which is responsible for distributing the keys). The solution suggested in this project is to distribute the key in the same method in which we distribute the video, via UDP. Uniquely, in this situation, we encrypt our AES key in a non-symmetric encryption protocol. The encryption is applied using a constant key, also known as the public key, and may be decrypted using different private keys. The advantage of this method is that both the public key, and the private keys, only need to be given once to each entity. Utilizing HTTPS can accomplish this in a safe manner. In theory, this combination provides a very efficient and practical broadcasting encryption system. The project will evaluate this system and its efficacy. 

## System Entities
### General
There are three main entities in the system:<br />
* "key manager" - server responsible for distributing keys and revocation<br />
* "broadcaster" - any user that wishes to broadcast its video content<br />
* "client" - any user wishing to watch a certain content broadcast<br />


### Key manager
The key manager is a NODE.JS HTTPS server, responsible for the distribution of keys and revocation.<br />
Upon initialization request received from a broadcaster, which needs to include a channel ID, it runs the setup function as well as creates and stores files for both the public key and the master secret key. Additionally, it creates a text file, which includes revocation data. Finally, it sends both the public key and the revocation data to the broadcaster. The master secret key, is never shared with any other entities.<br />
Upon a keygen request, which requires both a channel ID and user ID, the key manager creates a unique private key for that specific user. The manager then sends the user (individual who requested a keygen) a public key and a private key.<br />
The key manager is also responsible for revocation abilities, when a user needs to be either revoked or unrevoked. The key manager updates the revocation data accordingly. The new data will subsequently be provided to broadcaster upon the their request.

![](http://i.imgur.com/91FNX3p.png)

### Broadcaster

In order to broadcast a video, the broadcaster is required to complete two main actions:<br />
* Initialization Action. Initialization action entails two parameters, channel ID and company name. Using the company name, the broadcaster will retrieve the matching key manager’s address and will send it an initialization request. In return, the key manager sends back the public key and the specific revocation data for that channel ID.<br />
* Broadcast Action. Broadcast action includes the following:	<br />
Key:<br />
  * Randomly creates a 16 byte AES key using the Crypto module<br />
  * Encrypt the key using our encryption algorithm<br />
  * Create an RTP packet with the encrypted key as it’s content<br />
  * Broadcast the packet to the list of broadcast addresses	<br /><br />
* Video:<br />
  * Using FFMpeg, takes the video file and encodes it to mpeg format in RTP packets<br />
  * Retrieve the payload of the packet, and encrypt it using the AES key<br />
  * Inject the encrypted payload back into the packet<br />
  * Add the AES key id to the packet ‘s header, as part of the Synchronization Mechanism <br />
  * Broadcast the packet to the list of broadcast addresses<br /><br />
The AES key, which we are using to encrypt the video, changes when the time passed from the previous change is greater than CHANGE_KEY_INTERVAL. The key will be sent immediately, not once, every time SEND_KEY_INTERVAL time has passed.  The new key will not be used immediately, but only when the next key is created. This is in order to avoid a situation where a user is not able to play a video because it is missing the relevant key.

![](http://i.imgur.com/ZxmnRcJ.png)

### Client

The client is defined as a user wishing to watch any channel. In order to decrypt the video, it needs to obtain keys from the key manager. The client sends a key generation request, which includes both his own ID (user ID) and the channel’s ID. The client then receives a public key and a private key. Once the client has received both keys, they are able to play the encrypted video.<br />
The client begins listening to messages:<br />
* Upon an AES key message, the client decrypts the key and saves it in the list of keys. If the client’s key was revoked, the decryption algorithm will stop and the client will not be able to play the video.<br />
* Upon a video message - <br />
  * if the client has the AES key, they decrypt the payload of the packet, inject it back to the packet, and forwards it to VLC <br />
  * if the client does not have the AES key, they ignore the message

![](http://i.imgur.com/MRZsru3.png)

## Illustration
![](http://i.imgur.com/PTsd8DU.jpg)

## Encryption Mechanism 

Our implementation of Encryption Algorithm is based on John Bethencourt’s Implementation for Cipher-text policy attribute based encryption. Of note, the entire code is written in C.<br />
Our implementation includes four libraries:<br />
* GMP - a library for arbitrary precision arithmetic, operating on signed integers, rational numbers, and floating-point numbers<br />
* PBC - a library which performs the mathematical operations underlying pairing-based cryptosystems<br />
* LIBRS - This library includes the implementation of the four function which are listed in the next paragraph<br />
* BRS (broadcasting revocation system) - an API for LIBRS<br />

![](http://i.imgur.com/LlhZzO4.jpg)

The permanent revocation scheme includes four algorithms:<br />
* Setup(channel_id): creats new Public Key and Master Secret Key<br />
* Keygen(channel_id, user_id): creates a Private Key Per user input id.<br />
* Enc(msg,public_key): encrypts a message acording revoked policy.<br />
* Dec(msg, public_key, private_key): decryps data with Private key.<br /><br />

Different entities have different roles, and therefore use different functions as part of our encrypted broadcasting system:<br />
* Key manager uses both Setup and Keygen.<br />
* Broadcaster uses Enc only.<br />
* Client uses Dec only.





## Technologies
NODEJS - a cross-platform JavaScript run-time environment for executing JavaScript code server-side.<br />
FFMPEG - a software that produces libraries and programs for handling multimedia data.<br />
VLC - is a portable, cross-platform media player and streaming media server written by the VideoLAN project.<br />
NW.JS -  is a new technology, which combines multiple technologies and allows you to create and distribute apps on various operating systems.

## Installation

Installing from scratch<br />
This installation of the system was only tested on Ubuntu (64-bit) version 16.<br />

Installing the Encryption Mechanism: the mechanism is based on four different components. GMP, PBC,LIBRS and PRS. both GMP and PBC were remained untouched. while we have adjusted the code of LIBBSWABE and BRS in order to fit the algorithm we implemented.
<br />
install GMP-6.0.0 (GMP is a free library for arbitrary precision arithmetic, operating on signed integers, rational numbers, and floating point numbers.)<br />
install PBC-0.5.4 (The PBC (Pairing-Based Cryptography) library is a free C library built on the GMP. It is designed to be the backbone of implementations of pairing-based cryptosystems)<br />
install LIBRS.<br />
install  BRS.<br />
install NodeJs 7.4.0 version .<br />
Install NW.Js 0.20.0 version .<br />
Install FFmpeg (latest).<br />
Install VLC (latest).<br />

## Credits
[Encryption Algorithm](https://eprint.iacr.org/2008/309.pdf) (page 8) - Allison Lewko,  Amit Sahai & Brent Waters.<br />
[Algorithm implementation](http://acsc.cs.utexas.edu/cpabe/) - John Bethencourt (implementation),  Amit Sahai & Brent Waters.(advisory roles).<br />
if you feel like any copyrights have been violated, please contact us immediately.

## Disclaimer
April 24th 2017<br />
The current implementation of this application is yet to be tested properly. The use of the software or the code provided may be dangerous. Any person using this code, or parts of it is doing so at its own risk.

## Contact information
Alik Geller<br />[alikgeller@gmail.com](mailto:alikgeller@gmail.com)<br />
Omer Bar-Ness<br />[barnessomer@gmail.com](mailto:barnessomer@gmail.com)





