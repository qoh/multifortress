var express = require('express');
var config = require('./config');

var Game = require('./game');
var Client = require('./client');

var app = express();
var game = new Game();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(process.env.PORT || 80);
app.use(express.static(__dirname + '/public'));
io.set('log level', 1);

app.configure(function () {
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views')
});

app.get('/', function (req, res) {
	res.render('index');
});

io.sockets.on('connection', function (socket) {
	socket.emit('world', game.world);
	game.clients.push(new Client(game, socket, io));
});
