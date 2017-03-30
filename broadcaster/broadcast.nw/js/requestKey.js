
//upon this request, server creates master key.
function initializeChannel(){
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
  alert("illegal company name");
    return;
}

//command below ignores our unsigned https certificate.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

//change 1111 this with SERVER_PORT (using config file)
//change 4 with a variable.
https.get('https://'+SERVER_ADDRESS+':'+SERVER_PORT+'/Masterkey_'+channelId, (res) => {

  res.on('data', (d) => {
      var masterPath = path.join(__dirname + "/js/companies/"+company+"/pubkey_" + channelId);
    	fs.writeFile(masterPath, d, function(err) {
        if(err) {
           return  alert(err);
        }

      
      }); 
  });


	});

}

function getServerAddressByName(name){
    var configs = require('./../../configs.js');
    var SERVER_ADDRESSES = configs.SERVER_ADDRESSES;
    var SERVER_NAMES = configs.SERVER_NAMES;

    for(var i =0; i<SERVER_NAMES.length;i++){
      if(SERVER_NAMES[i]== name)
          return SERVER_ADDRESSES[i];
    }
    return "error";




}




/* function is not necassary anymore. should probably be deleted.

function getPublicKey(channelId){
  var https = require('https');
  var fs = require('fs');
  const path = require('path');
 __dirname = path.resolve(path.dirname(''));
  var SERVER_PORT = 1111;
  //command below ignores our unsigned https certificate.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  //var channelId = document.forms["getPublicKey"]["channelId"].value;
  //change 1111 this with SERVER_PORT
  //change 4 with a variable.
  https.get('https://localhost:1111/PublicKey_'+channelId, (res) => {

      res.on('data', (d) => {
        var pubkeyPath = path.join(__dirname + "/js/masterkey/public");
        fs.writeFile(pubkeyPath, d, function(err) {
        if(err) {
           return  alert(err);
        }
        alert("The file was saved!");
        }); 

       // process.stdout.write(d);
      });
    });
}






//ORIGINAL GET PUBLIC KEY FUNC.
/*
function getPublicKey(){
  var https = require('https');
  var fs = require('fs');
  const path = require('path');
 __dirname = path.resolve(path.dirname(''));
  //command below ignores our unsigned https certificate.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  https.get('https://localhost:1111/getPublicKey', (res) => {

      res.on('data', (d) => {
        var pubkeyPath = path.join(__dirname + "/js/masterkey/public");
        fs.writeFile(pubkeyPath, d, function(err) {
        if(err) {
           return  alert(err);
        }
        alert("The file was saved!");
        }); 

       // process.stdout.write(d);
      });
    });
}

*/