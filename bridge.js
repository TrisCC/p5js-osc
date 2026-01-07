const osc = require('node-osc');
const io = require('socket.io')(8081, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});


let oscServer, oscClient;

let isConnected = false;

io.on('connection', function (socket) {
	console.log('connection');
	socket.on("config", function (obj) {
		isConnected = true;
		oscServer = new osc.Server(obj.server.port, obj.server.host);
		oscClient = new osc.Client(obj.client.host, obj.client.port);
		oscClient.send('/status', socket.id + ' connected');
		oscServer.on('message', function (msg, rinfo) {
			socket.emit("message", msg);
		});
		socket.emit("connected", 1);
	});
	socket.on("message", function (obj) {
		oscClient.send.apply(oscClient, obj);
	});
	socket.on('disconnect', function () {
		if (isConnected) {
			oscServer.close();
			oscClient.close();
		}
	});
});