var CoreClient = require('./_coreClient');

module.exports = CoreClient.extend({
	onconnect: function () {
		this.bind(keys.KEY_K, function (down) {
			if (down && this.isKeyDown(keys.KEY_CTRL)) {
				if (this.player) {
					this.player.setHP(0);
				}
			}
		});

		this.message('Welcome!');
		this.spawn();
	},
	ondisconnect: function () {
		if (this.player)
			this.player.delete();
	},
	ondeath: function () {
		setTimeout(this.spawn.bind(this), 2000);
	},
	onkeydown: function (key) {
		if (this.control) {
			var x = 0,
				y = 0;

			if (key == keys.KEY_LEFT)  x -= 1;
			if (key == keys.KEY_RIGHT) x += 1;
			if (key == keys.KEY_UP)    y -= 1;
			if (key == keys.KEY_DOWN)  y += 1;

			if (x !== 0 || y !== 0) {
				this.control.move(x, y, true);
			}
		}
	},
	spawn: function () {
		if (!this.player) {
			var choices = [];

			for (var y = 0; y < this.game.world.h; ++y) {
				for (var x = 0; x < this.game.world.w; ++x) {
					if (this.game.world.data[y][x] === '.') {
						choices[choices.length] = [x, y];
					}
				}
			}

			var spawn = choices[Math.floor(Math.random() * choices.length)];

			this.player = new entity.Player(this.game, {x: spawn[0], y: spawn[1]}, this);
			this.controlEntity(this.player);
		}
	}
});
