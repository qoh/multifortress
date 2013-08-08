function Client(game, socket, io) {
	this.game = game;
	this.socket = socket;
	this.io = io;

	this._entities = {};
	this._control = null;

	this.control = null;

	this.keyDown = {};
	this.boundKeys = {};

	this.bindSocketEvents();
	this.onConnect();
}

Client.prototype.onConnect = function () {
	this.bind(keys.KEY_K, function (down) {
		if (down && this.isKeyDown(keys.KEY_CTRL)) {
			if (this.player) {
				this.player.setHP(0);
			}
		}
	});

	this.message('Welcome!');
	this.spawn();
}

Client.prototype.onDeath = function () {
	setTimeout(this.spawn.bind(this), 2000);
}

Client.prototype.onDisconnect = function () {
	if (this.player) {
		this.player.delete();
	}
};

Client.prototype.spawn = function () {
	if (!this.player) {
		var spawn = this.getSpawnPoint();

		this.player = new entity.Player(this.game, {x: spawn[0], y: spawn[1]}, this);
		this.controlEntity(this.player);
	}
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

Client.prototype.message = function (message) {
	if (typeof message == 'string' || message instanceof String) {
		this.socket.emit('message', message);
	}
};

Client.prototype.onKeyDown = function (key) {
	this.keyDown[key] = true;

	if (this.boundKeys[key]) {
		this.boundKeys[key](true);
	}

	var dir = {x: 0, y: 0};

	if (this.isKeyDown(keys.KEY_SHIFT)) var speed = 2;
	else var speed = 1;

	if (key == keys.KEY_LEFT)  dir.x -= speed;
	if (key == keys.KEY_RIGHT) dir.x += speed;
	if (key == keys.KEY_UP)    dir.y -= speed;
	if (key == keys.KEY_DOWN)  dir.y += speed;

	if ((dir.x !== 0 || dir.y !== 0) && this.control) {
		nx = this.control.data.x + dir.x;
		ny = this.control.data.y + dir.y;

		this.control.move(nx, ny);
	}
};

Client.prototype.onKeyUp = function (key) {
	if (this.boundKeys[key]) {
		this.boundKeys[key](false);
	}

	this.keyDown[key] = false;
};

Client.prototype.isKeyDown = function (key) {
	if (this.keyDown[key]) {
		return true;
	}

	return false;
};

Client.prototype.bind = function (key, callback) {
	if (keys.keyName[key]) {
		this.boundKeys[key] = callback.bind(this);
	}
};

Client.prototype.unbind = function (key) {
	delete this.boundKeys[key];
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
};

Client.prototype.update = function () {
	var now = new Date();

	if (this.last == null || now - this.last > 1000) {
		this.last = now;
		//this.message("spam! " + Date.now());
	}

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

Client.prototype.bindSocketEvents = function () {
	var other = this;

	this.socket.on('disconnect', function () {
		other.onDisconnect();
		var index = other.game.clients.indexOf(other);

		if (index == -1) {
			throw new Error('cannot find disconnecting client');
		}

		other.game.clients.splice(index, 1);
	});

	this.socket.on('keydown', this.onKeyDown.bind(this));
	this.socket.on('keyup', this.onKeyUp.bind(this));
};

module.exports = Client;
