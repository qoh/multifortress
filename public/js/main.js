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

var socket = io.connect();
var game = new Game(document.getElementById('game'), socket);

socket.on('connect', function (data) {
	socket.emit('name', prompt('whats your name'));
	game.connectState = 2;
});

socket.on('disconnect', function (data) {
	game.connectState = 1;
});

socket.on('world', function (world) {
	game.load(world);
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
