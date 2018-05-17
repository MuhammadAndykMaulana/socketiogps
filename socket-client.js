var node_modules = '/home/pi/node_modules/';
var io = require(node_modules + 'socket.io/node_modules/socket.io-client');
// var socket = io.connect('https://atsanode.herokuapp.com/atsa');
var socket = io.connect('http://202.182.58.202:3001/atsa');
var child_process = require('child_process');
var spawn = require('child_process').spawn;
var base_path = '/home/pi/scripts';
var Promise = require(node_modules +'bluebird');
//var fs = require('fs'),
  //  path = require('path'),
    //filePath = path.join(base_path, '/gps-tracking/gpslatlong.txt');

var psTree = require(node_modules + 'ps-tree');

var kill = function (pid, signal, callback) {
    signal   = signal || 'SIGKILL';
    callback = callback || function () {};
    var killTree = true;
    if(killTree) {
        psTree(pid, function (err, children) {
            [pid].concat(
                children.map(function (p) {
                    return p.PID;
                })
            ).forEach(function (tpid) {
                try { process.kill(tpid, signal) }
                catch (ex) { };
            });
            callback();
        });
    } else {
        try { process.kill(pid, signal) }
        catch (ex) { };
        callback();
    }
};

// Process
var procAlarm;
var procVib;
var procIgnition;

var promiseWhile = function(condition, action) {
    var resolver = Promise.defer();

    var loop = function() {
        if (!condition()) return resolver.resolve();
        return Promise.cast(action())
            .then(loop)
            .catch(resolver.reject);
    };

    process.nextTick(loop);

    return resolver.promise;
};

// Enabled means active monitoring

var deviceID = '';
var roomID = '00000000439a2140';
var isGPSEnabled = 0;
var isVibrationEnabled = 0;
var isIgnitionEnabled = 0;


socket.on('connect',function(data){
    console.log('Connected to server');
    socket.emit('msg:register-raspi',{id:deviceID,room:roomID});
});

socket.on('disconnect',function(data){
    console.log('Disconnected from server');
});

socket.on('em:id-broadcast', function(data){
	var status = data.status;
	var id = data.id;
	var message = data.message;
    deviceID = id;
    console.log('Obtained ID : '+deviceID);
});

socket.on('em:gps-connect',function(msg){
	isGPSEnabled = 1;
	console.log('GPS enabled');
	child_process.exec(base_path+'/gps-tracking/./active-GPS.sh');

promiseWhile(function() {
    return isGPSEnabled == 1;
}, function() {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
        	// child_process.exec(base_path+'/gps-tracking/./init-GPS.sh');
        	// // child_process.exec(base_path+'/gps-tracking/./readGPS.sh');
           readGPS();
            //console.log(syncProcess(base_path+'/./hi.sh'));
            resolve();
        }, 100);
    });
}).then(function() {
    // Notice we can chain it because it's a Promise, this will run after completion of the promiseWhile Promise!
    console.log('Done');
});

});

socket.on('em:gps-disconnect',function(msg){
	isGPSEnabled = 0;
	console.log('GPS disabled');
});

socket.on('em:read-gps',function(msg){
    readGPS();
});


var uint8arrayToString = function(data){
    return String.fromCharCode.apply(null, data);
};

function readGPS(){
    // console.log("Reading GPS.....");
     child_process.exec('timeout 10s gpspipe -w -n 10 |  grep -m 1 speed',
                function(error,stderr,stdout){
                    //console.log('stdout : '+stdout);
                    console.log('stderr : '+stderr);
                    socket.emit('msg:gps-data',{message:stderr,room:roomID});
    });
}
