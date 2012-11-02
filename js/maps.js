// Level Grid is an int matrix with 0 through 3 representing colored normal blocks and 4 through 7 representing powerups. 10 means empty.
var PWRUP_COUNT=15;
var GRID_WIDTH = 40;
var GRID_HEIGHT = 30;

levelMap=new Array(GRID_WIDTH);

function singleColorStage(){
  for (var x = 0; x < GRID_WIDTH; x++) {
    levelMap[x] = new Array(GRID_HEIGHT);
    for (var y = 0; y < GRID_HEIGHT; y++) {
	  levelMap[x][y] = Math.floor(0);
	  }
  }
}

function simpleStage(){
	stageGenerate();
	tunnelMaker(5,10,15,30,15)
}

function cheesify(r, holeCount){
	var x;
	var y;
	for (var i=0;i<holeCount;i++){
		x=Math.floor(Math.random() * GRID_WIDTH);
		y=Math.floor(Math.random() * GRID_HEIGHT);
		holeMaker(r, x, y)
	}
}

function stageGenerate(){
  for (var x = 0; x < GRID_WIDTH; x++) {
    levelMap[x] = new Array(GRID_HEIGHT);
    for (var y = 0; y < GRID_HEIGHT; y++) {
	  levelMap[x][y] = Math.floor(Math.random() * 4);
	  }
  }
}

function powerUpScatter(){
	for (var i=0;i<PWRUP_COUNT;i++) {
		var x = Math.floor(Math.random() * GRID_WIDTH);
		var y = Math.floor(Math.random() * GRID_HEIGHT);
		levelMap[x][y]=Math.floor(Math.random() * 4)+4;
	}
}

function tunnelMaker(r,x1,y1,x2,y2){
  var mx=Math.floor((x1+x2)/2);
	var my=Math.floor((y1+y2)/2);
	holeMaker(r,mx,my);
	if (distance(x1,y1,mx,my)>r/4){
		tunnelMaker(Math.floor(r*(0.5+Math.random()+5)/6), mx, my, x1, y1);
		tunnelMaker(Math.floor(r*(0.5+Math.random()+5)/6), mx, my, x2, y2);
	}
}

function distance( x1,y1,x2,y2){
	xs=(x1-x2)*(x1-x2);
	ys=(y1-y2)*(y1-y2);
	return Math.sqrt( xs + ys );
}

function holeMaker(r, centerX, centerY){
  for (var x = 0; x < GRID_WIDTH; x++) {
    for (var y = 0; y < GRID_HEIGHT; y++) {
			if (distance(x,y,centerX,centerY)<r){
				levelMap[x][y]=10;
			}
		}
  }
}

simpleStage();
console.log(levelMap);
