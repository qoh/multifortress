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
	move: function (x, y) {
		if (this.game.world.get(x, y) === '.') {
			this.data.x = x;
			this.data.y = y;

			return true;
		}

		return false;
	}
})

all.Player = all.PhysicalEntity.extend();
all.Goblin = all.PhysicalEntity.extend();

all.entityTypes = [
	all.Player,
	all.Goblin
];
