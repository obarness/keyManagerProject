
//upon this request, server creates master key.
function initializeChannel(){
  var configs = require('./../../configs.js');
  if(configs.FULL_ENCRYPTION){
      var https = require('https');
      var fs = require('fs');
      const path = require('path');
       __dirname = path.resolve(path.dirname(''));
       var configs = require('./../../configs.js');

      var SERVER_PORT = configs.SERVER_PORT;

      var channelId = document.forms["initializeYourChannel"]["channelId"].value;
      var company =   document.forms["initializeYourChannel"]["company"].value;
      var SERVER_ADDRESS = getServerAddressByName(company);
      if(SERVER_ADDRESS == "error"){
        alert("illegal company name, channel won't be initialized");
          return;
      }

      //command below ignores our unsigned https certificate.
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      log('Requesting server at ' + SERVER_ADDRESS +':'+SERVER_PORT +' to setup encryption for channel #' +channelId );
      log('Requesting public key from server at: ' + SERVER_ADDRESS +':'+SERVER_PORT);
      https.get('https://'+SERVER_ADDRESS+':'+SERVER_PORT+'/Masterkey_'+channelId, (res) => {

        res.on('data', (d) => {
              var pubkeyPath = path.join(__dirname + "/js/companies/"+company+"/pubkey_" + channelId);
              log('public key saved');
            	fs.writeFile(pubkeyPath, d, function(err) {
                if(err) {
                  return log(err);
                }

              
              }); 
        });
      });

      https.get('https://'+SERVER_ADDRESS+':'+SERVER_PORT+'/revoke_'+channelId, (res) => {

        res.on('data', (d) => {
              var revokePath = path.join(__dirname + "/js/companies/"+company+"/revoke_" + channelId);
              log('Revocation data saved');
              fs.writeFile(revokePath, d, function(err) {
                if(err) {
                  return log(err);
                }

              
              }); 
        });
      });
    }
}

function getServerAddressByName(name){
    var configs = require('./../../configs.js');
    var SERVER_ADDRESSES = configs.SERVER_ADDRESSES;
    var SERVER_NAMES = configs.SERVER_NAMES;

    for(var i =0; i<SERVER_NAMES.length;i++){
      if(SERVER_NAMES[i]== name){
        log("Provider's name is " + name + ", matching server address is "+ SERVER_ADDRESSES[i]);
          return SERVER_ADDRESSES[i];

        }
    }
    return "error";
}
