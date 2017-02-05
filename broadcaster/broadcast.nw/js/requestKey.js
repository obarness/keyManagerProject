
function getMasterKey(){
var https = require('https');
var fs = require('fs');
const path = require('path');
 __dirname = path.resolve(path.dirname(''));
      

//command below ignores our unsigned https certificate.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
https.get('https://localhost:1111/createMasterKey', (res) => {

  res.on('data', (d) => {
    var masterPath = path.join(__dirname + "/js/masterkey/master");
  	fs.writeFile(masterPath, d, function(err) {
    if(err) {
       return  alert(err);
    }

    alert("The file was saved!");
}); 

  
  	
   // process.stdout.write(d);
  });


	});
}

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

