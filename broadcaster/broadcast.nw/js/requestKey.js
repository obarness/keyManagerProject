
function getMasterKey(){
var https = require('https');
var fs = require('fs');

//command below ignores our unsigned https certificate.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
https.get('https://localhost:1111/createMasterKey', (res) => {

  res.on('data', (d) => {
  	var path = "/home/omer/workspace/keyManagerProject/broadcaster/broadcast.nw/js/masterkey/master"
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
        var path = "/home/omer/workspace/keyManagerProject/broadcaster/broadcast.nw/js/masterkey/public"
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

