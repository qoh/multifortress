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
	apply: function (out, x, y, time) {
		if (this.data.rainbows) {
			var rgb = hsv2rgb((Math.sin(time / 750) + 1) / 2);
			this.data.color = [rgb.red, rgb.green, rgb.blue];
		}
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

var Projectile = Entity.extend({
	tiles: [ut.NULLTILE] * 4,
	render: function (viewport, putTile) {
		if (this.tiles[this.data.direction] !== undefined)
		putTile(this.tiles[this.data.direction], this.data.x, this.data.y);
	}
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

var Player = Actor.extend({
	tiles: [PLAYER],
	render: function (viewport, putTile) {
		putTile(this.tiles[this.frame], this.data.x, this.data.y);
	}
});

var Goblin = Actor.extend({tiles: [GOBLIN]});

var Slime = Actor.extend({tiles: [SLIME1, SLIME2], speed: 600});

var Fire = Projectile.extend({
	tiles: [FIRE_LEFT, FIRE_RIGHT, FIRE_UP, FIRE_DOWN],
	speed: 50
});

var entityTypes = [
	Light, Player, Goblin, Slime, Fire
];
