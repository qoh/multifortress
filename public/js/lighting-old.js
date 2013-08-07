var LIGHT_COLOR = { r: 255, g: 255, b: 0 };
var LIGHT_INTENSITY = 0.55;
var MAX_DIST = 5;

var maskBuffer;
var maskOrigin = { x: 0, y: 0 };

// Helper function that calculates a distance
function distance(x1, y1, x2, y2) {
	return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

// Helper function that does blending between two values
function blend(a, b, f) {
	return a*f + b*(1.0-f);
}

// Shades the tile according to distance from player,
// giving a kind of torch effect
function doLighting(tile, x, y, time) {
	var d = distance(pl.x, pl.y, x, y);
	if (!checkFOV(x, y)) {
		var shaded = new ut.Tile(tile.getChar());
		var factor = Math.max(0, Math.min(1, d / 25));
		shaded.r = blend(0, tile.r, factor);
		shaded.g = blend(0, tile.g, factor);
		shaded.b = blend(0, tile.b, factor);
		return shaded;
	}
	// Calculate a pulsating animation value from the time
	var anim = time / 1000.0;
	anim = Math.abs(anim - Math.floor(anim) - 0.5) + 0.5;
	// No shading if the tile is too far away from the player's "torch"
	if (d >= MAX_DIST) return tile;
	// We will create a new instance of ut.Tile because the tile
	// passed in might be (and in this case is) a reference to
	// a shared "constant" tile and we don't want the shader to
	// affect all the places where that might be referenced
	var shaded = new ut.Tile(tile.getChar());
	// Calculate a blending factor between light and tile colors
	var f = (1.0 - (d / MAX_DIST)) * LIGHT_INTENSITY * anim;
	// Do the blending
	shaded.r = Math.round(blend(LIGHT_COLOR.r, tile.r, f));
	shaded.g = Math.round(blend(LIGHT_COLOR.g, tile.g, f));
	shaded.b = Math.round(blend(LIGHT_COLOR.b, tile.b, f));
	return shaded;
}

function checkFOV(x, y) {
	x -= maskOrigin.x;
	y -= maskOrigin.y;
	if (x < 0 || y < 0 || x >= term.w || y >= term.h) return false;
	return maskBuffer[y][x];
}

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
		maskBuffer[testy - maskOrigin.y][testx - maskOrigin.x] = true;
		// If wall is encountered, terminate ray
		if (eng.tileFunc(testx, testy).getChar() !== ".")
			return;
		// Advance the beam according to the step variables
		xx += dx; yy += dy;
	}
}

var updateFOV = function(x, y) {
	// Clear the mask buffer
	for (var j = 0; j < term.h; ++j)
		for (var i = 0; i < term.w; ++i)
			maskBuffer[j][i] = false;
	// Update buffer info
	maskOrigin.x = x - term.cx;
	maskOrigin.y = y - term.cy;
	// Populate the mask buffer with fresh data
	var step = Math.PI * 2.0 / 1080;
	for (var a = 0; a < Math.PI * 2; a += step)
		shootRay(x, y, a);
};

function initLighting() {
	maskBuffer = new Array(term.h);
	for (var j = 0; j < term.h; ++j)
		maskBuffer[j] = new Array(term.w);

	eng.setShaderFunc(doLighting);
}
