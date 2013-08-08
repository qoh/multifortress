function hsv2rgb(h) {
var s = 1;
var v = 1;
var r, g, b;
var RGB = new Array();
if(s==0){
  RGB['red']=RGB['green']=RGB['blue']=Math.round(v*255);
}else{
  // h must be < 1
  var var_h = h * 6;
  if (var_h==6) var_h = 0;
  //Or ... var_i = floor( var_h )
  var var_i = Math.floor( var_h );
  var var_1 = v*(1-s);
  var var_2 = v*(1-s*(var_h-var_i));
  var var_3 = v*(1-s*(1-(var_h-var_i)));
  if(var_i==0){
    var_r = v;
    var_g = var_3;
    var_b = var_1;
  }else if(var_i==1){
    var_r = var_2;
    var_g = v;
    var_b = var_1;
  }else if(var_i==2){
    var_r = var_1;
    var_g = v;
    var_b = var_3
  }else if(var_i==3){
    var_r = var_1;
    var_g = var_2;
    var_b = v;
  }else if (var_i==4){
    var_r = var_3;
    var_g = var_1;
    var_b = v;
  }else{
    var_r = v;
    var_g = var_1;
    var_b = var_2
  }
  //rgb results = 0 ÷ 255
  RGB['red']=Math.round(var_r * 255);
  RGB['green']=Math.round(var_g * 255);
  RGB['blue']=Math.round(var_b * 255);
  }
return RGB;
};

// var PLAYER = new ut.Tile('\u2659', 255, 255, 255);
var PLAYER = new ut.Tile('@', 255, 255, 255);
var GOBLIN = new ut.Tile('\u046A', 0, 255, 0);

var SLIME1 = new ut.Tile('࿀', 0, 255, 50);
var SLIME2 = new ut.Tile('࿁', 0, 255, 50);

var WALL = new ut.Tile('█', 100, 100, 100);
var FLOOR = new ut.Tile('░', 50, 50, 50);
var GRASS = new ut.Tile('෴', 0, 200, 0);

var FIRE_LEFT  = new ut.Tile('ᗧ', 255, 100, 0);
var FIRE_RIGHT = new ut.Tile('ᗤ', 255, 100, 0);
var FIRE_UP    = new ut.Tile('ᗣ', 255, 100, 0);
var FIRE_DOWN  = new ut.Tile('ᗢ', 255, 100, 0);
