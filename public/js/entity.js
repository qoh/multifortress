var Entity = Class.extend({
	init: function (data) { this.data = data; },
	patch: function (data) { this.data = $.extend(this.data, data); },
	update: function () {},
	render: function () {}
});

var Light = Entity.extend({
	isLight: true,
	init: function (data) {
		this._super(data);

		this.maskBuffer = new Array(game.viewport.h);
		this.maskOrigin = {x: 0, y: 0};

		for (var j = 0; j < game.viewport.h; ++j) {
			this.maskBuffer[j] = new Array(game.viewport.w);
		}
	},
	update: function () {
		for (var j = 0; j < game.viewport.h; ++j) {
			for (var i = 0; i < game.viewport.w; ++i) {
				this.maskBuffer[j][i] = false;
			}
		}

		var pos = this.getPosition();

		var x = pos.x;
		var y = pos.y;

		this.maskOrigin.x = x - game.viewport.cx;
		this.maskOrigin.y = y - game.viewport.cy;

		var step = Math.PI * 2.0 / 1080;

		for (var a = 0; a < Math.PI * 2; a += step) {
			shootRay(x, y, a, this.maskBuffer, this.maskOrigin);
		}
	},
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
	checkLightFOV: function (x, y) {
		x -= this.maskOrigin.x;
		y -= this.maskOrigin.y;

		if (x < 0 || y < 0 || x >= game.viewport.w || y >= game.viewport.h)
			return false;
		return this.maskBuffer[y][x];
	},
	apply: function (out, x, y, time) {
		if (!this.checkLightFOV(x, y)) return out;
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

		var x = this.data.x + viewport.cx - game.camera[0];
		var y = this.data.y + viewport.cy - game.camera[1];

		x -= Math.round(this.data.name.length / 2);
		y -= 1;

		// viewport.putString(this.data.name, x, y);
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
