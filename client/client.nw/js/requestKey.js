

function getKeys(){



  var https = require('https');
  var fs = require('fs');
  const path = require('path');
  __dirname = path.resolve(path.dirname(''));
   var configs = require('./../../configs.js');
  var SERVER_PORT = configs.SERVER_PORT;
  var SERVER_ADDRESS = configs.SERVER_ADDRESSES[0];

  var channelId = document.forms["playVideo"]["channelId"].value;  
  var userId = document.forms["playVideo"]["userId"].value; 
  alert("TEST" + channelId + userId)
  //command below ignores our unsigned https certificate.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.log('requesting private key for channel: '+ channelId  + ' from server at:' + SERVER_ADDRESS + ':' + SERVER_PORT);
  https.get('https://'+SERVER_ADDRESS+':'+SERVER_PORT+'/PrivateKey_'+channelId+'_'+userId, (res) => {

      res.on('data', (d) => {
        var privatePath = path.join(__dirname + "/js/privateKey/private_"+channelId);
        

      	fs.writeFile(privatePath, d, function(err) {
        if(err) {
           return  alert(err);
        }
     //   alert("The file was saved!");
        }); 

       // process.stdout.write(d);
      });
  	});
  
  console.log('private key saved');
  getPublicKey(channelId);

  return "false";
}


function getPublicKey(channelId){
  var https = require('https');
  var fs = require('fs');
  const path = require('path');
   __dirname = path.resolve(path.dirname(''));
  var configs = require('./../../configs.js');
  var SERVER_PORT = configs.SERVER_PORT;
  var SERVER_ADDRESS = configs.SERVER_ADDRESSES[0];

  //command below ignores our unsigned https certificate.
  console.log('requesting public key for channel: '+ channelId  + ' from server at:' + SERVER_ADDRESS + ':' + SERVER_PORT);
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  https.get('https://'+SERVER_ADDRESS+':'+SERVER_PORT+'/PublicKey_'+channelId, (res) => {

      res.on('data', (d) => {
        var publicPath = path.join(__dirname + "/js/privateKey/public_"+channelId);
          
        fs.writeFile(publicPath, d, function(err) {
        if(err) {
           return  alert(err);
        }
    //    alert("The file was saved!");
        }); 

      
      });
    });
  //we got our keys.
  // ready to play video.
  console.log('public key saved');
  start(channelId);
}

