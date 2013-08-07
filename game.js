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
		" #.#   #.......#         #.#  ",
		" #.#   #.....#.#         #.#  ",
		" #.#   #.....#.#         #.#  ",
		" #.#   #.....#.#         #.#  ",
		" #.#   #.....#.#         #.#  ",
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

	this.update();
}

Game.prototype.update = function () {
	for (var i = 0; i < this.clients.length; ++i) {
		this.clients[i].update();
	}

	setTimeout(this.update.bind(this), 1000 / 30);
}

Game.prototype.createEntity = function (type, data) {
	this.entities[this.nextEntity++] = {type: type, data: data};
	return this.nextEntity - 1;
};

Game.prototype.destroyEntity = function (entity) {
	delete this.entities[entity];
}

module.exports = Game;