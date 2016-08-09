var fs = require('fs');
var https = require('https');
var express = require('express');
var app = express();
var options = {
   key  : fs.readFileSync('server.key'),
   cert : fs.readFileSync('server.crt')
};

app.use(express.static(__dirname + '/public'));


https.createServer(options, app).listen(3000, function () {
   console.log('Started!');
});