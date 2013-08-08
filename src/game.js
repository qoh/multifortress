var fs = require('fs');

function Game() {
	this.clients = [];

	this.entities = {};
	this.nextEntity = 0;

	this.loadMap("rember-2", true);

	// new entity.Goblin(this, {x: 3, y: 2});
	// new entity.Slime(this, {x: 14, y: 13});

	this.update();
}

Game.prototype.loadMap = function (name, initial) {
	var path = __dirname + '/../maps/' + name + '.txt';
	console.log(path);

	if (!fs.existsSync(path)) {
		if (initial) {
			throw new Error("Initial map does not exist!");
		}
		else {
			return false;
		}
	}

	var map = fs.readFileSync(path).toString().split('\n');
	var light = parseFloat(map.splice(0, 1));

	var w = 0;
	var h = map.length;

	for (var i = 0; i < map.length; ++i) {
		if (map[i].length > w) {
			w = map[i].length;
		}
	}

	this.world = {
		w: w,
		h: h,
		data: map,
		light: light,

		get: function (x, y) {
			return this.data[y][x];
		}
	};

	if (!initial) {
		for (var i = 0; i < this.clients.length; ++i) {
			this.clients[i].player.delete();
			this.clients[i].player = null;

			this.clients[i].socket.emit('world', this.world);
			this.clients[i].spawn();
			this.clients[i].message('Changed map to ' + name);
		}
	}

	return true;
}

Game.prototype.message = function (message) {
	for (var i = 0; i < this.clients.length; ++i) {
		this.clients[i].message(message);
	}
}

Game.prototype.update = function () {
	for (var i = 0; i < this.clients.length; ++i) {
		this.clients[i].update();
	}

	for (var key in this.entities) {
		this.entities[key].update();
	}

	setTimeout(this.update.bind(this), 1000 / 30);
};

module.exports = Game;
