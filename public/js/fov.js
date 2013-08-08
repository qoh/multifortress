/*global game.viewport, eng */

var maskBuffer;
var maskOrigin = {x: 0, y: 0};

function shootRay(x, y, a, buf, orig) {
	var step = 0.3333;
	var maxdist = game.viewport.cy / step;
	var dx = Math.cos(a) * step;
	var dy = -Math.sin(a) * step;
	var xx = x, yy = y;

	for (var i = 0; i < maxdist; ++i) {
		// Check for walls at the current spot
		var testx = Math.round(xx);
		var testy = Math.round(yy);
		// Mark the tile visible
		if (!buf[testy - orig.y])
			buf[testy - orig.y] = new Array(game.viewport.w);
		buf[testy - orig.y][testx - orig.x] = true;
		// If wall is encountered, terminate ray
		if (game.world.data[testy][testx] !== ".")
			return;
		//if (game.hasEntityAt(testx, testy))
		//	return;
		// Advance the beam according to the step variables
		xx += dx; yy += dy;
	}
}

var updateFOV = function(x, y) {
	for (var j = 0; j < game.viewport.h; ++j) {
		for (var i = 0; i < game.viewport.w; ++i) {
			maskBuffer[j][i] = false;
		}
	}

	maskOrigin.x = x - game.viewport.cx;
	maskOrigin.y = y - game.viewport.cy;

	var step = Math.PI * 2.0 / 1080;

	for (var a = 0; a < Math.PI * 2; a += step) {
		shootRay(x, y, a, maskBuffer, maskOrigin);
	}
};

function initFOV(game) {
	maskBuffer = new Array(game.viewport.h);

	for (var j = 0; j < game.viewport.h; ++j) {
		maskBuffer[j] = new Array(game.viewport.w);
	}
}
