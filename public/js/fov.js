/*global term, eng */

var maskBuffer;
var maskOrigin = {x: 0, y: 0};

function shootRay(x, y, a) {
	var step = 0.3333;
	var maxdist = term.cy / step;
	var dx = Math.cos(a) * step;
	var dy = -Math.sin(a) * step;
	var xx = x, yy = y;

	for (var i = 0; i < maxdist; ++i) {
		// Check for walls at the current spot
		var testx = Math.round(xx);
		var testy = Math.round(yy);
		// Mark the tile visible
		if (!maskBuffer[testy - maskOrigin.y])
			maskBuffer[testy - maskOrigin.y] = new Array(term.w);
		maskBuffer[testy - maskOrigin.y][testx - maskOrigin.x] = true;
		// If wall is encountered, terminate ray
		if (eng.tileFunc(testx, testy).getChar() !== ".")
			return;
		// Advance the beam according to the step variables
		xx += dx; yy += dy;
	}
}

var updateFOV = function(x, y) {
	for (var j = 0; j < term.h; ++j) {
		for (var i = 0; i < term.w; ++i) {
			maskBuffer[j][i] = false;
		}
	}

	maskOrigin.x = x - term.cx;
	maskOrigin.y = y - term.cy;

	var step = Math.PI * 2.0 / 1080;

	for (var a = 0; a < Math.PI * 2; a += step) {
		shootRay(x, y, a);
	}
};

function initFOV() {
	maskBuffer = new Array(term.h);

	for (var j = 0; j < term.h; ++j) {
		maskBuffer[j] = new Array(term.w);
	}

	eng.setMaskFunc(function (x, y) {
		x -= maskOrigin.x;
		y -= maskOrigin.y;

		if (x < 0 || y < 0 || x >= term.w || y >= term.h) return false;
		return maskBuffer[y][x];
	});
}
