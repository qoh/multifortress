var express = require('express');
var config = require('./config');

// User modules
var Game = require('./src/game');
var Client = require('./src/client');

entity = require('./src/entity');
keys = require('./src/keys');

// System-wide objects
var app = express();
var game = new Game();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

game.io = io;

// Object configs
server.listen(process.env.PORT || 80);
app.use(express.static(__dirname + '/public'));
io.set('log level', 1);

app.configure(function () {
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views')
});

// Serve /
app.get('/', function (req, res) {
	res.render('index');
});

// Handle socket.io
io.sockets.on('connection', function (socket) {
	var client = new Client(game, socket);
});
