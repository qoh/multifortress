function Client(game, socket, io) {
	this.game = game;
	this.socket = socket;
	this.io = io;

	this.entities = {};

	this.control = null;
	this.clientControl = null;

	this.bindEvents();
	this.spawn();
}

Client.prototype.spawn = function () {
	var spawn = this.getSpawnPoint();

	this.control = this.game.createEntity(0, {
		x: spawn[0], y: spawn[1]
	});

	this.player = this.game.entities[this.control];
	this.playerRef = this.control;
};

Client.prototype.getSpawnPoint = function () {
	var choices = [];

	for (var y = 0; y < this.game.world.h; ++y) {
		for (var x = 0; x < this.game.world.w; ++x) {
			if (this.game.world.data[y][x] === '.') {
				choices[choices.length] = [x, y];
			}
		}
	}

	return choices[Math.floor(Math.random() * choices.length)];
};

Client.prototype.bindEvents = function () {
	var other = this;

	this.socket.on('disconnect', function () {
		var index = other.game.clients.indexOf(other);

		if (index == -1) {
			throw new Error('cannot find disconnecting client');
		}

		other.game.destroyEntity(other.playerRef);
		other.game.clients.splice(index, 1);
	});
};

Client.prototype.update = function () {
	nx = this.player.data.x + Math.floor(Math.random() * 3) - 1;
	ny = this.player.data.y + Math.floor(Math.random() * 3) - 1;

	if (this.game.world.get(nx, ny) === '.') {
		this.player.data.x = nx;
		this.player.data.y = ny;
	}

	var ent_new = {};
	var send_ent_new = false;

	for (var id in this.game.entities) {
		if (!this.entities[id]) {
			ent_new[id] = this.game.entities[id];
			send_ent_new = true;
			this.entities[id] = JSON.parse(JSON.stringify(this.game.entities[id]));
		}
	}

	var ent_pop = [];
	var send_ent_pop = false;

	for (var id in this.entities) {
		if (!this.game.entities[id]) {
			ent_pop.push(id);
			send_ent_pop = true;
			delete this.entities[id];
		}
	}

	var ent_patch = {};
	var send_ent_patch = false;

	for (var id in this.game.entities) {
		var data1 = this.game.entities[id].data;
		var data2 = this.entities[id].data;

		if (JSON.stringify(data1) !== JSON.stringify(data2)) {
			ent_patch[id] = data1;
			send_ent_patch = true;
			this.entities[id] = JSON.parse(JSON.stringify(this.game.entities[id]));
		}
	}

	if (send_ent_new) {
		this.socket.emit('ent_new', ent_new);
	}

	if (send_ent_pop) {
		this.socket.emit('ent_pop', ent_pop);
	}

	if (send_ent_patch) {
		this.socket.emit('ent_patch', ent_patch);
	}

	if (this.control !== this.clientControl) {
		this.socket.emit('ent_use', this.clientControl = this.control);
	}
};

module.exports = Client;
