var Class = require('./classy');
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

		for (var i = 0; i < all.entityTypes.length; ++i) {
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
	move: function (x, y, relative) {
		if (relative) {
			x = this.data.x + x;
			y = this.data.y + y;
		}

		if (x < 0 || y < 0 || x >= this.game.world.w || y >= this.game.world.h) {
			return false;
		}

		if (this.game.world.get(x, y) === '.') {
			this.data.x = x;
			this.data.y = y;

			return true;
		}

		return false;
	}
})

all.Player = all.PhysicalEntity.extend();
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

all.entityTypes = [
	all.Player,
	all.Goblin
];
