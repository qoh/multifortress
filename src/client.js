function Client(game, socket, io) {
	this.game = game;
	this.socket = socket;
	this.io = io;

	this._entities = {};
	this._control = null;

	this.control = null;

	this.bindEvents();
	this.spawn();
}

Client.prototype.spawn = function () {
	var spawn = this.getSpawnPoint();

	this.player = new entity.Player(this.game, {x: spawn[0], y: spawn[1]});
	this.player.client = this;

	this.controlEntity(this.player);
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

		other.player.delete();
		other.game.clients.splice(index, 1);
	});

	this.socket.on('keydown', function (key) {
		var dir = {x: 0, y: 0};

		if (key == 'left')  dir.x -= 1;
		if (key == 'right') dir.x += 1;
		if (key == 'up')    dir.y -= 1;
		if (key == 'down')  dir.y += 1;

		if (other.control) {
			nx = other.control.data.x + dir.x;
			ny = other.control.data.y + dir.y;

			other.control.move(nx, ny);
		}
	});

	this.socket.on('keyup', function (key) {
	});
};

Client.prototype.controlEntity = function (entity) {
	if (this.control != null) {
		var index = this.control._controlledBy.indexOf(this);
		this.control._controlledBy.splice(index, 1);
	}

	this.control = entity || null;

	if (this.control != null) {
		this.control._controlledBy.push(this);
	}
}

Client.prototype.update = function () {
	var ent_pop = [];

	for (var id in this._entities) {
		if (!this.game.entities[id]) {
			ent_pop.push(id);
			delete this._entities[id];
		}
	}

	var ent_new = {};
	var send_ent_new = false;

	for (var id in this.game.entities) {
		if (!this._entities[id]) {
			ent_new[id] = this.game.entities[id].serialize();
			send_ent_new = true;

			this._entities[id] = JSON.stringify(this.game.entities[id].data);
		}
	}

	var ent_patch = {};
	var send_ent_patch = false;

	for (var id in this.game.entities) {
		var data1 = this.game.entities[id].data;
		var data2 = this._entities[id];

		if (JSON.stringify(data1) !== data2) {
			ent_patch[id] = data1;
			send_ent_patch = true;

			this._entities[id] = JSON.stringify(data1);
		}
	}

	if (ent_pop.length) {
		this.socket.emit('ent_pop', ent_pop);
	}

	if (send_ent_new) {
		this.socket.emit('ent_new', ent_new);
	}

	if (send_ent_patch) {
		this.socket.emit('ent_patch', ent_patch);
	}

	var control = null;

	if (this.control) {
		control = this.control.id;
	}

	if (control !== this._control) {
		this.socket.emit('ent_use', this._control = control);
	}
};

module.exports = Client;
