// Level Grid is an int matrix with 0 through 3 representing colored normal blocks and 4 through 7 representing powerups. 9 is the invincible block.
var VEIN_COUNT = 45;
var VEIN_CONSTANT = 2;


function singleColorStage() {
  levelMap = new Array(GRID_WIDTH);
  for (var x = 0; x < GRID_WIDTH; x++) {
    levelMap[x] = new Array(GRID_HEIGHT);
    for (var y = 0; y < GRID_HEIGHT; y++) {
      levelMap[x][y] = Math.floor(0);
    }
  }
  return levelMap;
}

function simpleStage() {
  levelMap = stageGenerate();
  return cage(powerUpExpand(powerUpScatter(landforms(tunnelMaker(levelMap, 3, 10, 22, 30, 22), 10))));
}

function cage(levelMap){

  for (var y = 0; y < GRID_HEIGHT; y++) {
    levelMap[0][y] = 8;
    levelMap[39][y] = 8;
  }
  return levelMap;
}

function landforms(levelMap, numCaves){
  var x;
  var y;
  var r;
  var c1;
  var c2;
  var coord = new Array();
  var caveCenters = new Array();
  for (var i = 0; i < numCaves; i++) {
    x = Math.floor(Math.random() * (GRID_WIDTH));
    y = Math.floor(Math.random() * (GRID_HEIGHT-5))+2;
    r = Math.floor(Math.random() * 3)+2
    coord[0] = x;
    coord[1] = y;
    caveCenters[i] = coord;
    holeMaker(levelMap, r, x, y);
  }
  for (var i = 0; i < numCaves/5; i++) {
    c1 = caveCenters[Math.floor(Math.random()*caveCenters.length)]
    c2 = caveCenters[Math.floor(Math.random()*caveCenters.length)]
    tunnelMaker(levelMap,r,c1[0],c1[1],c2[0],c2[1])
  }
  return levelMap;
}

function cheesify(levelMap, r, holeCount) {
  var x;
  var y;
  for (var i = 0; i < holeCount; i++) {
    x = Math.floor(Math.random() * GRID_WIDTH);
    y = Math.floor(Math.random() * GRID_HEIGHT);
    holeMaker(levelMap, r, x, y);
  }
  return levelMap;
}

function stageGenerate() {
  levelMap = new Array(GRID_WIDTH);
  for (var x = 0; x < GRID_WIDTH; x++) {
    levelMap[x] = new Array(GRID_HEIGHT);
    for (var y = 0; y < GRID_HEIGHT; y++) {
    if (y<5){
    levelMap[x][y]=null
    continue;
    }
    levelMap[x][y] = Math.floor(Math.random() * 4);
    }
  }
  return levelMap;
}

function powerUpScatter(levelMap) {
  for (var i = 0; i < VEIN_COUNT; i++) {
    var x = Math.floor(Math.random() * GRID_WIDTH);
    var y = Math.floor(Math.random() * GRID_HEIGHT);
        if (levelMap[x][y] != null) {
            levelMap[x][y] = Math.floor(Math.random() * 2) + 4;
        }
        else {
            i -= 1;
        }
  }
    return levelMap;
}

function powerUpExpand(levelMap) {
  for (var x = 1; x < GRID_WIDTH - 1; x++) {
    for (var y = 1; y < GRID_HEIGHT - 1; y++) {
        var adjacents = [
                //levelMap[x+1][y+1],
                //levelMap[x+1][y-1],
                levelMap[x + 1][y],

                //levelMap[x-1][y+1],
                //levelMap[x-1][y-1],
                levelMap[x - 1][y],

                levelMap[x][y + 1],
                levelMap[x][y - 1]
        ];
        for (var i = 0; i < adjacents.length; i++) {
            if (adjacents[i] != null && adjacents[i] >= 4) {
                if (Math.floor(Math.random() * 100) < VEIN_CONSTANT) {
                    levelMap[x][y] = adjacents[i];
                }
            }
        }
    }
  }
  return levelMap;
}

function tunnelMaker(levelMap,r,x1,y1,x2,y2) {
  var mx = Math.floor((x1 + x2) / 2);
  var my = Math.floor((y1 + y2) / 2);
  levelMap = holeMaker(levelMap, r, mx, my);
  if (distance(x1, y1, mx, my) > r / 4) {
    tunnelMaker(levelMap, Math.floor(r * (0.5 + Math.random() + 5) / 6), mx, my, x1, y1);
    tunnelMaker(levelMap, Math.floor(r * (0.5 + Math.random() + 5) / 6), mx, my, x2, y2);
  }
  return levelMap;
}

function distance(x1,y1,x2,y2) {
  xs = (x1 - x2) * (x1 - x2);
  ys = (y1 - y2) * (y1 - y2);
  return Math.sqrt(xs + ys);
}

function holeMaker(levelMap, r, centerX, centerY) {
  for (var x = 0; x < GRID_WIDTH; x++) {
    for (var y = 0; y < GRID_HEIGHT - 1; y++) {
      if (distance(x, y, centerX, centerY) < r) {
        levelMap[x][y] = null;
      }
    }
  }
  return levelMap;
}
