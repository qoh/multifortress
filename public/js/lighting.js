function distance(x1, y1, x2, y2) {
	return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

function blend(a, b, f) {
	return a*f + b*(1.0-f);
}

function doLighting(tile, x, y, time) {
	var shaded = new ut.Tile(tile.getChar());
	var out = {r: tile.r, g: tile.g, b: tile.b, factor: 0};

	for (var i = 0; i < lights.length; ++i) {
		out = applyLightFromSource(lights[i], out, x, y);
	}

	out.factor = Math.min(1, Math.max(0, out.factor));

	shaded.r = Math.min(255, Math.max(0, out.r * out.factor));
	shaded.g = Math.min(255, Math.max(0, out.g * out.factor));
	shaded.b = Math.min(255, Math.max(0, out.b * out.factor));

	return shaded;
}

function initLighting() {
	lights = [
		{
			track: pl,
			radius: 20,
			strength: 0.75
		}
	];

	eng.setShaderFunc(doLighting);
}
