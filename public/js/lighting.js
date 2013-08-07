function distance(x1, y1, x2, y2) {
	return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

function blend(a, b, f) {
	return a*f + b*(1.0-f);
}

function applyLightFromSource(light, out, x, y) {
	if (light.track) {
		var dist = distance(light.track.x, light.track.y, x, y);
	}
	else {
		var dist = distance(light.x, light.y, x, y);
	}

	if (dist >= light.radius) {
		return out;
	}

	var factor = (1.0 - (dist / light.radius)) * light.strength;
	out.factor += factor;

	if (light.color) {
		out.r = Math.round(blend(light.color[0], out.r, factor));
		out.g = Math.round(blend(light.color[1], out.g, factor));
		out.b = Math.round(blend(light.color[2], out.b, factor));
	}

	return out;
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
