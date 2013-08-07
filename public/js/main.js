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

var PLAYER = new ut.Tile('@', 255, 255, 255);
var WALL = new ut.Tile('#', 100, 100, 100);
var FLOOR = new ut.Tile('.', 50, 50, 50);

var Entity = Class.extend({
	init: function (data) {},
	patch: function (data) {},
	update: function () {},
	render: function () {}
});

var PhysicalEntity = Entity.extend({
	tile: ut.NULLTILE,

	init: function (data) {
		this.x = data.x;
		this.y = data.y;
	},
	patch: function (data) {
		this.x = data.x || this.x;
		this.y = data.y || this.y;
	},
	render: function (data) {
		putTile(this.tile, this.x, this.y);
	}
})

var Player = PhysicalEntity.extend({tile: PLAYER});

var entityTypes = [
	Player
];

function getWorldTile(x, y) {
	var data = "";

	try { data = game.world.data[y][x]; }
	catch(err) { return ut.NULLTILE; }

	if (data === '#') return WALL;
	if (data === '.') return FLOOR;

	return ut.NULLTILE;
}

function resetGame() {
	game = {
		active: false,
		world: null,

		entities: {},
		controlling: null,

		camera: [0, 0]
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

function update() {
	for (var id in game.entities) {
		if (game.entities[id].update) {
			game.entities[id].update();
		}
	}

	var entity = game.entities[game.control];

	if (entity) {
		game.camera[0] = entity.x;
		game.camera[1] = entity.y;
	}

	setTimeout(update, 1000 / 30);
}

function render() {
	engine.update(game.camera[0], game.camera[1]);

	for (var id in game.entities) {
		if (game.entities[id].render) {
			game.entities[id].render();
		}
	}

	var ids = Object.keys(game.entities);
	viewport.putString(ids.length + " entities", 0, 0);

	for (var i = 0; i < ids.length; ++i) {
		viewport.putString("&" + ids[i] + " : " + game.entities[ids[i]], 0, i + 1);
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

	update();
	requestAnimationFrame(render);
}

$(document).ready(function() {
	var socket = io.connect();
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
