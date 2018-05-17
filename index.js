var app = require('/home/andyk/node_modules/express')();
var http = require('http').Server(app);
var io = require('/home/andyk/node_modules/socket.io')(http);

var clients = [];
var rooms = [];
var roomIndex = {};

const server_port = 3001;
//var server_port = process.env.OPENSHIFT_NODEJS_PORT || 3000
//var server_port = 3001;
// var server_port = process.env.PORT || 8000
//var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
//
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});
/*
app.get('/raspi', function(req, res){
	res.sendFile(__dirname + '/raspi-client.html');
});
*/

io.on('connection',function(socket){
	console.log('a user connected : '+socket.id);
	clients.push(socket);
})

var nsp2 = io.of('/test');

nsp2.on('connection', function(socket){
	console.log('a user connected : '+socket.id);
});

var nsp = io.of('/atsa');

nsp.on('connection', function(socket){
	console.log('a user connected at atsa namespace : '+socket.id);
	nsp.to(socket.id).emit('em:id-broadcast',{status:200,id:socket.id,message:"connected"});
	//nsp.to(socket.id).emit('em:gps-connect',"test");
	socket.on('disconnect',function(){
		console.log('a user disconnected : ' + socket.id);
		var i = clients.indexOf(socket);
		clients.splice(i,1);
		for(var key in roomIndex){
			console.log(key);
			if(typeof roomIndex[key] != 'undefined' && key == socket.id){
				rooms.splice(roomIndex[key],1);
				delete roomIndex[key];
			}
		}
	});
	
	socket.on('msg:register-raspi',function(data){
		var room = data.room;
		var userID = data.id;
		console.log('Raspberry registered at atsa namespace : '+room);
		rooms.push(room);
		roomIndex[userID] = rooms.length;
		// rooms[userID] = room;
		socket.join(room);
	});

	socket.on('msg:gps-broadcast',function(msg){
		console.log('broadcast gps message : '+msg);
		socket.broadcast.emit('em:gps-data',msg);
	});

	socket.on('msg:join-room',function(data){
		var userID = data.id;
		var destRoom = data.room;
		var isJoined = false;
		for(var i=0;i<rooms.length;i++){
		// for(var key in rooms){
			if(rooms[i]==destRoom){
				socket.join(rooms[i]);
				console.log("joined room : "+rooms[i]);
				console.log("user id : "+userID);
				nsp.to(userID).emit('em:room-broadcast',{roomID:rooms[i],status:200,message:"Joined in room :"+rooms[i]});
				isJoined = true;
				break;
			}
		}
		if(!isJoined){
			console.log("cannot join room : "+destRoom);
			nsp.to(userID).emit('em:room-broadcast',{roomID:"0",status:0,message:"Cannot join room"+destRoom});
			
		}
		
	});

	socket.on('msg:check-rooms',function(){
		socket.emit('em:devices-online',{status:200, message:rooms.length});
	});

	socket.on('msg:check-clients',function(){
		socket.emit('em:clients-online',{status:200, message:clients.length});
	});


	// Engine section
	socket.on('msg:engine-off',function(data){
		var userID = data.id;
		var destRoom = data.room;
		console.log(userID+" is attempting to turn off " +destRoom +" engine");
		nsp.to(destRoom).emit('em:engine-off',{id:userID});
	});


	// Ignition section
	socket.on('msg:ignition-data',function(data){
		var msg = data.message;
		var destRoom = data.room;
		console.log("Room "+destRoom + " message : "+msg);
		nsp.to(destRoom).emit('em:ignition-data',{status:200,message:msg});
	});

	socket.on('msg:ignition-enable',function(data){
		var userID = data.id;
		var destRoom = data.room;
		console.log(userID+" is attempting to enable " +destRoom +" current sensor");
		nsp.to(destRoom).emit('em:ignition-enable',{id:userID});
	});

	socket.on('msg:ignition-disable',function(data){
		var userID = data.id;
		var destRoom = data.room;
		console.log(userID +" is attempting to disable " + destRoom + " current sensor");
		nsp.to(destRoom).emit('em:ignition-disable',{id:userID});
	});


	// Vibration section
	socket.on('msg:vibration-data',function(data){
		var msg = data.message;
		var destRoom = data.room;
		console.log("Room "+destRoom + " message : "+msg);
		nsp.to(destRoom).emit('em:vibration-data', {status:200,message:msg});
	});

	socket.on('msg:vibration-enable',function(data){
		var userID = data.id;
		var destRoom = data.room;
		console.log(userID+" is attempting to enable " +destRoom +" vibration sensor");
		nsp.to(destRoom).emit('em:vibration-enable',{id:userID});
	});

	socket.on('msg:vibration-disable',function(data){
		var userID = data.id;
		var destRoom = data.room;
		console.log(userID +" is attempting to disable " + destRoom + " vibration sensor");
		nsp.to(destRoom).emit('em:vibration-disable',{id:userID});
	});

	//GPS section

	socket.on('msg:gps-data', function(data){
		var msg = data.message;
		var destRoom = data.room;
		console.log("Room "+destRoom + " message : "+msg);
		nsp.to(destRoom).emit('em:gps-data', {status:200,message:msg});
	});

	socket.on('msg:gps-connect', function(data){
		var userID = data.id;
		var destRoom = data.room;
		console.log(userID+" is attempting to connect to " +destRoom +" GPS");
		nsp.to(destRoom).emit('em:gps-connect',{id:userID});
	});

	socket.on('msg:gps-disconnect',function(data){
		var userID = data.id;
		var destRoom = data.room;
		console.log(userID+" is attempting to disconnect from " +destRoom +" GPS");
		nsp.to(destRoom).emit('em:gps-disconnect',{id:userID});
	});

	//test

	//Alarm section

	socket.on('msg:alarm-on',function(data){
		var msg = data.message;
		var userID = data.id;
		var destRoom = data.room;
		console.log(userID+" is attempting to turn on "+destRoom + " alarm");
		nsp.to(destRoom).emit('em:alarm-on',{id:userID,message:msg});
	});

	socket.on('msg:alarm-off',function(data){
		var msg = data.message;
		var userID = data.id;
		var destRoom = data.room;
		console.log(userID+" is attempting to turn off "+destRoom + " alarm");
		nsp.to(destRoom).emit('em:alarm-off',{id:userID,message:msg});
	});

	socket.on('msg:free-alarm-on',function(data){
		var msg = data.message;
		var userID = data.id;
		var destRoom = data.room;
		console.log(userID+" is attempting to turn off "+destRoom + " alarm");
		nsp.to(destRoom).emit('em:free-alarm-on',{id:userID,message:msg});
	});

	socket.on('msg:read-gps',function(data){
		var msg = data.message;
		var userID = data.id;
		var destRoom = data.room;
		console.log(userID+" is attempting read "+destRoom + " GPS");
		nsp.to(destRoom).emit('em:read-gps',{id:userID,message:msg});
	});

});




http.listen(server_port, function(){
	 console.log( "Listening on " + server_port );
});
