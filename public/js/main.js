(function(window) {
	var time, can, raf, pfx;

	time = 0;
	can = "Cancel";
	raf = "RequestAnimationFrame";
	pfx = ["r", "webkitR", "mozR", "msR", "oR"].reduce(function(p, v) {
		return (window[v + p] && v.slice(0, -1)) || p;
	}, raf.slice(1));

	window.requestAnimationFrame = window[pfx + raf] || function(callback, element) {
		var now, callAt;
		now = +new Date();
		callAt = Math.max(0, 16 - (now - time));
		time = now + callAt;
		return setTimeout(function() {
			callback(time);
		}, callAt);
	};

	window.cancelAnimationFrame = window[pfx + can + raf] ||
		window[pfx + raf.replace(raf.slice(0, 7), can)] || function(id) {
		clearTimeout(id);
	};
}(this));

var viewpoint;
var engine;
var game;

var PLAYER = new ut.Tile('\u2659', 255, 255, 255);
var GOBLIN = new ut.Tile('\u046A', 0, 255, 0);

var SLIME1 = new ut.Tile('࿀', 0, 255, 50);
var SLIME2 = new ut.Tile('࿁', 0, 255, 50);

var WALL = new ut.Tile('█', 100, 100, 100);
var FLOOR = new ut.Tile('░', 50, 50, 50);
var GRASS = new ut.Tile('෴', 0, 200, 0);

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
	render: function () {
		putTile(this.tiles[this.frame], this.data.x, this.data.y);
	}
});

var Player = Actor.extend({tiles: [PLAYER]});
var Goblin = Actor.extend({tiles: [GOBLIN]});

var Slime = Actor.extend({tiles: [SLIME1, SLIME2], speed: 600});

var entityTypes = [
	Light, Player, Goblin, Slime
];

function getWorldTile(x, y) {
	var data = "";

	try { data = game.world.data[y][x]; }
	catch(err) { return ut.NULLTILE; }

	if (data === '#') return WALL;
	if (data === '.') return FLOOR;
	if (data === 'G') return GRASS;

	return ut.NULLTILE;
}

function resetGame() {
	game = {
		active: false,
		world: null,

		entities: {},
		controlling: null,

		camera: [0, 0],
		messages: []
	};

	$('#status').css('opacity', 1);
	$('#game').hide();
}

resetGame();

function putTile(tile, x, y) {
	if (engine.maskFunc && !engine.maskFunc(x, y)) {
		return;
	}

	if (engine.shaderFunc) {
		tile = engine.shaderFunc(tile, x, y, 0);
	}

	x += viewport.cx - game.camera[0];
	y += viewport.cy - game.camera[1];

	viewport.put(tile, x, y);
}

function distance(x1, y1, x2, y2) {
	return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

function blend(a, b, f) {
	return a*f + b*(1.0-f);
}

function doLighting(tile, x, y, time) {
	var shaded = new ut.Tile(tile.getChar());
	var out = {r: tile.r, g: tile.g, b: tile.b, factor: 0.01};

	for (var id in game.entities) {
		var entity = game.entities[id];

		if (entity.isLight) {
			out = entity.apply(out, x, y);
		}
	}

	out.factor = Math.min(1, Math.max(0, out.factor));

	shaded.r = Math.min(255, Math.max(0, out.r * out.factor));
	shaded.g = Math.min(255, Math.max(0, out.g * out.factor));
	shaded.b = Math.min(255, Math.max(0, out.b * out.factor));

	return shaded;
}

function update() {
	for (var id in game.entities) {
		if (game.entities[id].update) {
			game.entities[id].update();
		}
	}

	setTimeout(update, 1000 / 30);
}

function render() {
	var entity = game.entities[game.control];

	if (entity) {
		game.camera[0] = entity.data.x;
		game.camera[1] = entity.data.y;
	}

	engine.update(game.camera[0], game.camera[1]);

	for (var id in game.entities) {
		if (game.entities[id].render) {
			game.entities[id].render();
		}
	}

	var ids = Object.keys(game.entities);
	viewport.putString(ids.length + " entities", 0, 0);

	for (var i = 0; i < ids.length; ++i) {
		// viewport.putString("&" + ids[i] + " : " + JSON.stringify(game.entities[ids[i]].data), 0, i + 1);
	}

	var entity = game.entities[game.control];

	if (entity) {
		viewport.putString("HP: " + entity.data.hp, 0, viewport.h - 1);
	}
	else {
		viewport.putString("☠", viewport.cx, viewport.cy, 255, 0, 0);
	}

	for (var i = 0; i < game.messages.length; ++i) {
		var message = game.messages[i];
		viewport.putString(message, viewport.w - message.length, viewport.h - i - 1);
	}

	viewport.render();
	requestAnimationFrame(render);
}

function init() {
	if (game.active) {
		return;
	}

	game.active = true;

	$('#status').animate({opacity: 0});
	$('#game').fadeIn();

	// 41x25 => 120x40
	viewport = new ut.Viewport(document.getElementById('game'), 120, 40);
	engine = new ut.Engine(viewport, getWorldTile, game.world.w, game.world.h);

	ut.initInput(
		function (key) { socket.emit('keydown', key); },
		function (key) { socket.emit('keyup', key); }
	);

	engine.setShaderFunc(doLighting);

	update();
	requestAnimationFrame(render);
}

var socket;

$(document).ready(function() {
	socket = io.connect();
	$('#status').text('Connecting');

	socket.on('connect', function (data) {
		$('#status').text('Loading');
	});

	socket.on('disconnect', function (data) {
		resetGame();
		$('#status').text('Disconnected');
	});

	socket.on('world', function (world) {
		game.world = world;
		init();
	});

	socket.on('message', function (message) {
		game.messages.unshift(message);

		if (game.messages.length > 6) {
			game.messages.splice(6, game.messages.length);
		}
	})

	socket.on('ent_new', function (entities) {
		for (var id in entities) {
			if (game.entities[id]) {
				continue;
			}

			var value = entities[id];

			if (entityTypes[value.type]) {
				game.entities[id] = new entityTypes[value.type](value.data);
			}
		}
	});

	socket.on('ent_pop', function (ids) {
		for (var i = 0; i < ids.length; ++i) {
			var id = ids[i];
			delete game.entities[id];

			if (game.control == id) {
				game.control = null;
			}
		}
	});

	socket.on('ent_patch', function (entities) {
		for (var id in entities) {
			if (game.entities[id]) {
				game.entities[id].patch(entities[id]);
			}
		}
	});

	socket.on('ent_use', function (id) {
		if (game.entities[id]) {
			game.control = id;
		}
		else {
			game.control = null;
		}
	});
});
