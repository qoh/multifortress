function distance(x1, y1, x2, y2) {
	return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

function blend(a, b, f) {
	return a*f + b*(1.0-f);
}

var Game = Class.extend({
	init: function (element, socket) {
		this._boundPutTile = this.putTile.bind(this);
		this._boundUpdate = this.update.bind(this);
		this._boundRender = this.render.bind(this);

		this.element = element;
		this.socket = socket;

		this.connectState = 0;

		this.viewport = new ut.Viewport(element, 120, 40);
		this.engine = new ut.Engine(this.viewport,
			this.translateWorldTile.bind(this),
			0, 0
		);

		this.entities = {};
		this.control = null;

		this.camera = [0, 0];
		this.messages = [];

		this.engine.setShaderFunc(this.shadeTile.bind(this));
		ut.initInput(this.keydown.bind(this), this.keyup.bind(this));

		this.update();
		requestAnimationFrame(this._boundRender);
	},
	load: function (world) {
		this.world = world;
		this.engine.setWorldSize(world.w, world.h);
	},
	update: function () {
		for (var id in this.entities) {
			if (this.entities[id].update) {
				this.entities[id].update();
			}
		}

		setTimeout(this._boundUpdate, 1000 / 30);
	},
	render: function () {
		var errorString = null;

		if (this.connectState !== 2) {
			if (this.connectState === 0)
				errorString = "CONNECTING";
			else if (this.connectState === 1)
				errorString = "DISCONNECTED";
		}
		else if (!this.world)
			errorString = "LOADING...";

		if (errorString) {
			this.viewport.putString(errorString,
				this.viewport.cx - Math.round(errorString.length / 2),
				this.viewport.cy
			);

			this.viewport.render();
			requestAnimationFrame(this._boundRender);

			return;
		}

		var entity = this.entities[this.control];

		if (entity) {
			this.camera[0] = entity.data.x;
			this.camera[1] = entity.data.y;
		}

		this.engine.update(this.camera[0], this.camera[1]);

		for (var id in this.entities) {
			if (this.entities[id].render) {
				this.entities[id].render(this.viewport, this._boundPutTile);
			}
		}

		var entity = this.entities[this.control];

		if (entity) {
			this.viewport.putString("HP: " + entity.data.hp, 0, this.viewport.h - 1);
		}

		for (var i = 0; i < this.messages.length; ++i) {
			var message = this.messages[i];

			this.viewport.putString(message,
				this.viewport.w - message.length,
				this.viewport.h - i - 1
			);
		}

		this.viewport.render();
		requestAnimationFrame(this._boundRender);
	},
	translateWorldTile: function (x, y) {
		var data = "";

		try { data = this.world.data[y][x]; }
		catch(err) { return ut.NULLTILE; }

		if (data === '#') return WALL;
		if (data === '.') return FLOOR;
		if (data === 'G') return GRASS;

		return ut.NULLTILE;
	},
	putTile: function (tile, x, y) {
		if (this.engine.maskFunc && !this.engine.maskFunc(x, y)) {
			return;
		}

		if (this.engine.shaderFunc) {
			tile = this.engine.shaderFunc(tile, x, y, 0);
		}

		x += this.viewport.cx - this.camera[0];
		y += this.viewport.cy - this.camera[1];

		this.viewport.put(tile, x, y);
	},
	shadeTile: function (tile, x, y, time) {
		var shaded = new ut.Tile(tile.getChar());
		var out = {r: tile.r, g: tile.g, b: tile.b, factor: 0.01};

		for (var id in this.entities) {
			var entity = this.entities[id];

			if (entity.isLight) {
				out = entity.apply(out, x, y);
			}
		}

		out.factor = Math.min(1, Math.max(0, out.factor));

		shaded.r = Math.min(255, Math.max(0, out.r * out.factor));
		shaded.g = Math.min(255, Math.max(0, out.g * out.factor));
		shaded.b = Math.min(255, Math.max(0, out.b * out.factor));

		return shaded;
	},
	keydown: function (key) {
		this.socket.emit('keydown', key);
	},
	keyup: function (key) {
	},
});
