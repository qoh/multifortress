var Entity = Class.extend({
	init: function (data) { this.data = data; },
	patch: function (data) { this.data = $.extend(this.data, data); },
	update: function () {},
	render: function () {}
});

var Light = Entity.extend({
	isLight: true,
	getPosition: function () {
		if (this.data.track) {
			var track = game.entities[this.data.track];

			if (track) {
				return {x: track.data.x, y: track.data.y};
			}

			return {x: 0, y: 0};
		}

		return {x: this.data.x, y: this.data.y};
	},
	apply: function (out, x, y) {
		var pos = this.getPosition();
		var dist = distance(pos.x, pos.y, x, y);

		if (dist >= this.data.radius) {
			return out;
		}

		var factor = (1.0 - (dist / this.data.radius)) * this.data.strength;
		out.factor += factor;

		if (this.data.color) {
			out.r = Math.round(blend(this.data.color[0], out.r, factor));
			out.g = Math.round(blend(this.data.color[1], out.g, factor));
			out.b = Math.round(blend(this.data.color[2], out.b, factor));
		}

		return out;
	},
	render: function () {}
});

var Actor = Entity.extend({
	tiles: [ut.NULLTILE],
	speed: null,

	init: function (data) {
		this._super(data);
		this.frame = 0;

		if (this.speed) {
			this.lastFrame = new Date();
		}
	},
	update: function () {
		if (this.speed) {
			var now = new Date();

			if (now - this.lastFrame >= this.speed) {
				this.frame = (this.frame + 1) % this.tiles.length;
				this.lastFrame = now;
			}
		}
	},
	render: function (viewport, putTile) {
		putTile(this.tiles[this.frame], this.data.x, this.data.y);
	}
});

var Player = Actor.extend({tiles: [PLAYER]});
var Goblin = Actor.extend({tiles: [GOBLIN]});

var Slime = Actor.extend({tiles: [SLIME1, SLIME2], speed: 600});

var entityTypes = [
	Light, Player, Goblin, Slime
];
