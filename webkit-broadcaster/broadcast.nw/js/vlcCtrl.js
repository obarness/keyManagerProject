function openVlc(){
var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }
exec("vlc rtp://@:6000", puts);
}