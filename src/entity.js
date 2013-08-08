var Class = require('./class');
var all = module.exports;

all.Entity = Class.extend({
	init: function (game, data) {
		game.entities[game.nextEntity++] = this;
		this.id = game.nextEntity - 1;

		this.game = game;
		this.data = data;

		this._controlledBy = [];
	},
	delete: function () {
		for (var i = 0; i < this._controlledBy.length; ++i) {
			this._controlledBy[i].control = null;
		}

		this._controlledBy = [];
		delete this.game.entities[this.id];
	},
	serialize: function () {
		var index = null;

		for (var i = all.entityTypes.length - 1; i >= 0; --i) {
			if (all.entityTypes[i].prototype.isPrototypeOf(this)) {
				index = i;
				break;
			}
		}

		return {type: index, data: this.data};
	},
	update: function () {}
});

all.PhysicalEntity = all.Entity.extend({
	init: function (game, data) {
		this._super(game, data);

		this.data.x = this.data.x || 0;
		this.data.y = this.data.y || 0;
	},
	move: function (x, y, relative) {
		if (relative) {
			x = this.data.x + x;
			y = this.data.y + y;
		}

		if (x < 0 || y < 0 || x >= this.game.world.w || y >= this.game.world.h) {
			return false;
		}

		for (var id in this.game.entities) {
			var ent = this.game.entities[id];

			if (x === ent.data.x && y === ent.data.y) {
				if (ent.addHP) {
					ent.addHP(Math.floor(Math.random() * 10 + 10) * -1);
				}

				return false;
			}
		}

		var tile = this.game.world.get(x, y);

		if (tile === '.' || tile == 'G') {
			this.data.x = x;
			this.data.y = y;

			return true;
		}

		return false;
	}
});

all.Light = all.PhysicalEntity.extend({});

all.Projectile = all.PhysicalEntity.extend({
	speed: 0,
	init: function (game, data) {
		this._super(game, data);
		this.lastMove = new Date();
	},
	update: function () {
		var now = new Date();

		//if (now - this.lastMove >= this.speed) {
			this.lastMove = now;

			var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
			var dir = dirs[this.data.direction];

			if (!this.move(dir[0], dir[1], true)) {
				this.delete();
			}
		//}
	}
});

all.Player = all.PhysicalEntity.extend({
	init: function (game, data, client) {
		this._super(game, data);
		this.client = client;
		this.data.name = client.name;

		this.data.hp = this.data.hp || 100;

		this.light = new all.Light(game, {
			track: this.id,
			radius: 6,
			strength: 0.75
		});
	},
	setHP: function (hp) {
		this.data.hp = Math.max(0, Math.min(100, hp));

		if (this.data.hp <= 0) {
			if (this.client) {
				this.client.ondeath();
			}

			this.delete();
		}
	},
	addHP: function (hp) {
		this.setHP(this.data.hp + hp);
	},
	delete: function () {
		if (this.client.player == this) {
			this.client.player = null;
		}

		this.light.delete();
		this._super();
	}
});

all.Goblin = all.PhysicalEntity.extend({
	init: function (game, data) {
		this._super(game, data);

		this.lastMove = 0;
		this.moveDelay = 0;
	},
	update: function () {
		var now = new Date();

		if (now - this.lastMove >= this.moveDelay) {
			var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
			var dir = dirs[Math.floor(Math.random() * 4)];

			if (this.move(dir[0], dir[1], true)) {
				this.lastMove = now;
				this.moveDelay = (Math.random() * 0.75 + 0.25) * 1000;
			}
		}
	}
});

all.Slime = all.Goblin.extend({});

all.Fire = all.Projectile.extend({
	speed: 250,
	init: function (game, data) {
		this._super(game, data);

		this.light = new all.Light(game, {
			track: this.id,
			radius: 4,
			strength: 0.35,
			color: [255, 100, 0]
		});
	},
	delete: function () {
		this.light.delete();
		this.light = null;
		this._super();
	}
});

all.entityTypes = [
	all.Light,
	all.Player,
	all.Goblin,
	all.Slime,
	all.Fire
];
