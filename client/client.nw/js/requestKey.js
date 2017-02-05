function getPrivateKey(){
  var https = require('https');
  var fs = require('fs');
  const path = require('path');
  __dirname = path.resolve(path.dirname(''));
     
  //command below ignores our unsigned https certificate.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  https.get('https://localhost:1111/createPrivateKey', (res) => {

      res.on('data', (d) => {
        var privatePath = path.join(__dirname + "/js/privateKey/private");
      	fs.writeFile(privatePath, d, function(err) {
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
        var publicPath = path.join(__dirname + "/js/privateKey/public");
        fs.writeFile(publicPath, d, function(err) {
        if(err) {
           return  alert(err);
        }
        alert("The file was saved!");
        }); 

       // process.stdout.write(d);
      });
    });
}

