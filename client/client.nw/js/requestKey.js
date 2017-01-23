function getPrivateKey(){
  var https = require('https');
  var fs = require('fs');
  //command below ignores our unsigned https certificate.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  https.get('https://localhost:1111/createPrivateKey', (res) => {

      res.on('data', (d) => {
      	var path = "/home/omer/workspace/keyManagerProject/client/client.nw/js/privateKey/private"
      	fs.writeFile(path, d, function(err) {
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
  //command below ignores our unsigned https certificate.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  https.get('https://localhost:1111/getPublicKey', (res) => {

      res.on('data', (d) => {
        var path = "/home/omer/workspace/keyManagerProject/client/client.nw/js/privateKey/public"
        fs.writeFile(path, d, function(err) {
        if(err) {
           return  alert(err);
        }
        alert("The file was saved!");
        }); 

       // process.stdout.write(d);
      });
    });
}

