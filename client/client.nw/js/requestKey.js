

function getKeys(){

var configs = require('./../../configs.js');
if(configs.FULL_ENCRYPTION){
        var https = require('https');
        var fs = require('fs');
        const path = require('path');
        __dirname = path.resolve(path.dirname(''));
         var configs = require('./../../configs.js');
        var SERVER_PORT = configs.SERVER_PORT;
        var SERVER_ADDRESS = configs.USER_SERVER_ADDRESSES

        var channelId = document.forms["playVideo"]["channelId"].value;  
        var userId = document.forms["playVideo"]["userId"].value; 
        
        //command below ignores our unsigned https certificate.
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        log('requesting private key for channel: '+ channelId  + ' from server at:' + SERVER_ADDRESS + ':' + SERVER_PORT);
        https.get('https://'+SERVER_ADDRESS+':'+SERVER_PORT+'/PrivateKey_'+channelId+'_'+userId, (res) => {

            res.on('data', (d) => {
              var privatePath = path.join(__dirname + "/js/privateKey/private_"+channelId);
              

              fs.writeFile(privatePath, d, function(err) {
              if(err) {
                 return  alert(err);
              }
              else log('private key saved');
           //   alert("The file was saved!");
              }); 

             // process.stdout.write(d);
            });
          });
        
        
        getPublicKey(channelId);

        return "false";
      }
      else
        start(document.forms["playVideo"]["channelId"].value);
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
  log('requesting public key for channel: '+ channelId  + ' from server at:' + SERVER_ADDRESS + ':' + SERVER_PORT);
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  https.get('https://'+SERVER_ADDRESS+':'+SERVER_PORT+'/PublicKey_'+channelId, (res) => {

      res.on('data', (d) => {
        var publicPath = path.join(__dirname + "/js/privateKey/public_"+channelId);
          
        fs.writeFile(publicPath, d, function(err) {
        if(err) {
           return  alert(err);
        }
        else
          log('public key saved');
    //    alert("The file was saved!");
        }); 

      
      });
    });
  //we got our keys.
  // ready to play video.
  start(channelId);
}

