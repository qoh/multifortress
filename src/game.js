function Game() {
	this.clients = [];

	this.entities = {};
	this.nextEntity = 0;

	var map = [
		" #####             #####      ",
		" #...########      #...####   ",
		" #..........#      #......#   ",
		" #...######.#      #..###.#   ",
		" #####    #.#      ######.####",
		"          #.#          #.....#",
		"          #.#          #.....#",
		"          #.############.....#",
		"          #..................#",
		"          ####.###############",
		"##########   #.#     #....#   ",
		"#........##  #.#     #.#..#   ",
		"#..####...#  #.#     #.#..#   ",
		"#.........#  #.#     #.###### ",
		"#.........#  #.#     #......# ",
		"##.########  #.#     #......# ",
		" #.#         #.#     #####.## ",
		" #.#         #.#         #.#  ",
		" #.#   #######.#         #.#  ",
		" #.#   #GGGGG..#         #.#  ",
		" #.#   #GGGGG#.#         #.#  ",
		" #.#   #GG.GG#.#         #.#  ",
		" #.#   #G...G#.#         #.#  ",
		" #.#   #.GGG.#.#         #.#  ",
		" #.#   #######.#         #.#  ",
		" #.#         #.###########.#  ",
		" #.#         #.............#  ",
		" #.#############.###########  ",
		" #...............#            ",
		" #################            "
	];

	this.world = {
		w: map[0].length,
		h: map.length,
		data: map,

		get: function (x, y) {
			return this.data[y][x];
		}
	};

	new entity.Goblin(this, {x: 3, y: 2});
	this.update();
}

Game.prototype.update = function () {
	for (var i = 0; i < this.clients.length; ++i) {
		this.clients[i].update();
	}

	for (var key in this.entities) {
		this.entities[key].update();
	}

	setTimeout(this.update.bind(this), 1000 / 30);
};

module.exports = Game;
