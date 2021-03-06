

var Buffer = require('buffer').Buffer;

Number.prototype.toUnsigned = function () {
    return ((this >>> 1) * 2 + (this & 1));
};

var RtpPacket = function (options) {

    this._bufpkt = null;

    this._init(options);
};

RtpPacket.prototype._init=function(options){
    if(options instanceof Buffer){
        this._bufpkt=options;
        return;
    }

    var opts = options ? options : {};

    var V = opts.V ? opts.V : 2, // version. always 2 for this RFC (2 bits)
        P = opts.P ? opts.P : 0, // padding. not supported yet, so always 0 (1 bit)
        X = opts.X ? opts.X : 0, // header extension (1 bit)
        CC = opts.CC ? opts.CC : 0, // CSRC count (4 bits)
        M = opts.M ? opts.M : 0, // marker (1 bit)
        PT = opts.PT ? opts.PT : 0, // payload type. see section 6 in RFC3551 for valid types: http://www.ietf.org/rfc/rfc3551.txt (7 bits)
        sequenceNumber = opts.sequenceNumber ? opts.sequenceNumber : Math.floor(Math.random() * 1000), // sequence number. SHOULD be random (16 bits)
        timestamp = opts.timestamp ? opts.timestamp : Math.floor(Math.random() * 1000), // timestamp in the format of NTP (# sec. since 0h UTC 1 January 1900)? (32 bits)
        SSRC = opts.SSRC ? opts.SSRC : Math.floor(Math.random()*4294967296), // synchronization source (32 bits)
        CSRC = opts.CSRC ? opts.CSRC : [], // contributing sources list. not supported yet (32 bits)
        defByProfile = opts.defByProfile ? opts.defByProfile : 0, // header extension, 'Defined By Profile'. not supported yet (16 bits)
        extensionLength = opts.extensionLength ? opts.extensionLength : -1, // header extension length. default -1 make (extension+1)*4 equal 0 (16 bits)
        payload=opts.payload?opts.payload:null;


/*          ORIGINAL CODE
    var lengthOfHeader =
            12 +
            (extensionLength + 1) * 4 +
            (CC) * 4, //totalLength of header
        lengthOfPayload=0;
        buffersList = [];
*/
    //new code, added in order to support seq key number.
    var lengthOfHeader =
            13 +
            (extensionLength + 1) * 4 +
            (CC) * 4, //totalLength of header
        lengthOfPayload=0;
        buffersList = [];


    //fixed header
    var header = new Buffer(13);
    header[0] = (V << 6 | P << 5 | X << 4 | CC);
    header[1] = (M << 7 | PT);
    header[2] = (sequenceNumber >>> 8);
    header[3] = (sequenceNumber & 0xFF);
    header[4] = (timestamp >>> 24);
    header[5] = (timestamp >>> 16 & 0xFF);
    header[6] = (timestamp >>> 8 & 0xFF);
    header[7] = (timestamp & 0xFF);
    header[8] = (SSRC >>> 24);
    header[9] = (SSRC >>> 16 & 0xFF);
    header[10] = (SSRC >>> 8 & 0xFF);
    header[11] = (SSRC & 0xFF);
    header[12] = -1;         //added by Omer

    buffersList.push(header);

    //extensional header
    if (X === 1) {
        var extension = new Buffer((extensionLength + 1) * 4);
        extension[0] = (defByProfile >>> 8 & 0xFF);
        extension[1] = (defByProfile & 0xFF);
        extension[2] = (extensionLength >>> 8 & 0xFF);
        extension[3] = (extensionLength & 0xFF);

        for (var i = 0; i < extensionLength; i++) {
            //do something
        }

        buffersList.push(extension);
    }

    //CSRC
    if (CC > 0) {
        var CSRClength = CC * 4;
        var CSRClist = new Buffer(CSRClength);

        for (var i = 0; i < CC; i++) {
            //do something
            var CSRCitem = CSRC[i] ? CSRC[i] : 0;
            CSRClist[i] = (CSRCitem >>> 24);
            CSRClist[i + 1] = (CSRCitem >>> 16 & 0xFF);
            CSRClist[i + 2] = (CSRCitem >>> 8 & 0xFF);
            CSRClist[i + 3] = (CSRCitem & 0xFF);
        }

        buffersList.push(CSRClist);
    }

    if(payload){

        lengthOfPayload=payload.length;

        buffersList.push(payload);
    }

    this._bufpkt = Buffer.concat(buffersList, lengthOfHeader+lengthOfPayload);
};

RtpPacket.prototype.getHeaderLength = function () {

    //fixed length
    var len = 13; //originally 12! changed by Omer.

    //extensional length
    var extensionLength = this.getExtensionLength();
    if (extensionLength !== null) {
        len += (extensionLength + 1);
    }

    //CSRC counts
    len += (this.getCC());

    //return
    return len;
};

RtpPacket.prototype.getX = function () {
    return (this._bufpkt[0] >>> 4 & 0x01);
};
RtpPacket.prototype.setX = function (val) {
    val = val.toUnsigned();
    if (val <= 1) {
        this._bufpkt[0] &= 0xEF;
        this._bufpkt[0] |= (val << 4);
    }
};

RtpPacket.prototype.getExtensionLength = function () {
    if (this.getX()) {
        return (this._bufpkt[15] << 8 & this._bufpkt[16]);
    } else {
        return null;
    }
};

RtpPacket.prototype.getCC = function () {
    return (this._bufpkt[0] & 0x0F);
};
RtpPacket.prototype.setCC = function (val) {
    val = val.toUnsigned();
    if (val <= 15) {
        this._bufpkt[0] &= 0xF0;
        this._bufpkt[0] |= val;
    }
};

RtpPacket.prototype.getPayloadType = function () {
    return (this._bufpkt[1] & 0x7F);
};
RtpPacket.prototype.setPayloadType = function (val) {
    val = val.toUnsigned();
    if (val <= 127) {
        this._bufpkt[1] &= 0x80;
        this._bufpkt[1] |= val;
    }
};

RtpPacket.prototype.getSeqNumber = function () {
    return (this._bufpkt[2] << 8 | this._bufpkt[3]);
};
RtpPacket.prototype.setSeqNumber = function (val) {
    val = val.toUnsigned();
    if (val <= 65535) {
        this._bufpkt[2] = (val >>> 8);
        this._bufpkt[3] = (val & 0xFF);
    }
};

RtpPacket.prototype.getTimestamp = function () {
    return (this._bufpkt[4] << 24 | this._bufpkt[5] << 16 | this._bufpkt[6] << 8 | this._bufpkt[7]);
};
RtpPacket.prototype.setTimestamp = function (val) {
    val = val.toUnsigned();
    if (val <= 4294967295) {
        this._bufpkt[4] = (val >>> 24);
        this._bufpkt[5] = (val >>> 16 & 0xFF);
        this._bufpkt[6] = (val >>> 8 & 0xFF);
        this._bufpkt[7] = (val & 0xFF);
    }
};

RtpPacket.prototype.getSSRC = function () {
    return (this._bufpkt[8] << 24 | this._bufpkt[9] << 16 | this._bufpkt[10] << 8 | this._bufpkt[11]);
};
RtpPacket.prototype.setSSRC = function (val) {
    val = val.toUnsigned();
    if (val <= 4294967295) {
        this._bufpkt[8] = (val >>> 24);
        this._bufpkt[9] = (val >>> 16 & 0xFF);
        this._bufpkt[10] = (val >>> 8 & 0xFF);
        this._bufpkt[11] = (val & 0xFF);
    }
};

//added by omer.
RtpPacket.prototype.getAesSeq = function () {
    return this._bufpkt[12];
};
RtpPacket.prototype.setAesSeq = function (val) {
    val = val.toUnsigned();
    if (val <= 255) {  //max number to be represented by 8 bits.
        this._bufpkt[12] = val;
    }
};

RtpPacket.prototype.getPayload = function () {
    return new Buffer(this._bufpkt.slice(this.getHeaderLength(), this._bufpkt.length));
};
RtpPacket.prototype.setPayload = function (val) {
    if (Buffer.isBuffer(val) && val.length <= 3000) {
        var lengthOfHeader=this.getHeaderLength();
        var newLength = this.getHeaderLength() + val.length;
        if (this._bufpkt.length == newLength)
            val.copy(this._bufpkt, lengthOfHeader, 0);
        else {
            var newbuf = new Buffer(newLength);
            this._bufpkt.copy(newbuf, 0, 0, lengthOfHeader);
            val.copy(newbuf, lengthOfHeader, 0);
            this._bufpkt = newbuf;
        }
    }
};

//return a reference to this._bufpkt
RtpPacket.prototype.getBuffer = function () {
    return this._bufpkt;
};

//return a copy of this._bufpkt
RtpPacket.prototype.createBufferCopy=function(){
    return new Buffer(this._bufpkt);
};

module.exports = RtpPacket;