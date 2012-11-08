var BLOCK_SIZE = 20;
var PLAYER_HEIGHT = 15;
var PLAYER_WIDTH = 11;
var RESOURCE_SIZE = 11;
var RESOURCE_RANDOM_OFFSET = 2;
var NUM_COLORS = 4;

var GRID_WIDTH = 40;
var GRID_HEIGHT = 30;

var PLAYGROUND_WIDTH = BLOCK_SIZE * GRID_WIDTH;
var PLAYGROUND_HEIGHT = BLOCK_SIZE * GRID_HEIGHT;

// XPOS_P2 and YPOS get a modifier based on sizes to make the board symmetric
// and to begin with a block for a floor
var START_XCOORD_P1 = 14;
var START_XPOS_P1 = START_XCOORD_P1 * BLOCK_SIZE;
var START_XCOORD_P2 = 25;
var START_XPOS_P2 = START_XCOORD_P2 * BLOCK_SIZE + (BLOCK_SIZE - PLAYER_WIDTH);
var START_YCOORD = 15;
var START_YPOS = BLOCK_SIZE * START_YCOORD + (BLOCK_SIZE - PLAYER_HEIGHT);

var GRAVITY_ACCEL = 1; // pixels/s^2 (down is positive)
var JUMP_VELOCITY = -11;   // pixels/s
var MOVE_VELOCITY = 2;

var WINNING_POINTS = 35;

var OUCH_VELOCITY = 999;
var OUCH_DIVIDER = 3;

var DAMAGE_TO_EXPLODE = 15;
var DAMAGE_JUMP = 5;
var DAMAGE_DIG = 5;
var DAMAGE_COLLIDE = 2;

var POINT_RAMPING = 5;

var ENABLE_CREEPING = false;
var CREEPING_DEATH_MS = 10000;
var FRAME_DELAY = 30;
var CAMERA_DELAY = 5;
var REBOOT_DELAY = 50;

var RESOURCE_PROBABILITY = 0.05; // probably any block has a resource in it
var SPRITE_GRAPHIC_INDEXES = new Array(2, 8, 6, 3);

var BG_MUSIC = 'sounds/bg.ogg';
var PLAYER1_RUN = 'sounds/running.ogg';
var PLAYER2_RUN = 'sounds/running_diff.ogg';
var BLOCK_BREAK = 'sounds/crunch.ogg';
var PLAYER_DEATH = 'sounds/splat.ogg';
var RESOURCE_GET = 'sounds/chime.ogg';

var PLAYER1_RUNNING = false;
var PLAYER2_RUNNING = false;

var PLAYER_INAIR = [false, false]

var MUSIC_PLAYING = false;
var PLAYER1_DEAD = false;
var PLAYER2_DEAD = false;

var levelGrid; // 2D array containing block objects

var timer;
var frameDelay;
var viewportDelay;
var restartNow = false;
var should_creep = false;
var death_y = GRID_HEIGHT; // tracks the creeping death.

var players = new Array(null, null);
var resources = [];

function buildPlayground() {
  var asset_list = ['sprites/800x600.png', 'sprites/Resource.png'];
  asset_list += ['sprites/blocks.png'];
  asset_list += ['sprites/players.png'];
  Crafty.load(asset_list);
  //Crafty.background('sprites/800x600.png');

  Crafty.sprite(RESOURCE_SIZE, 'sprites/Resource.png', {
    resource: [0, 0]
  });

  Crafty.sprite(PLAYER_WIDTH, PLAYER_HEIGHT, 'sprites/players.png', {
    player1: [0, 0],
    player2: [0, 1],
  });

  Crafty.sprite(BLOCK_SIZE, 'sprites/blocks.png', {
    block1: [0, 0],
    block2: [1, 0],
    block3: [2, 0],
    block4: [3, 0],
    block5: [4, 0],
    block6: [5, 0],
    block7: [6, 0],
    block8: [7, 0],
  });
  
  restarter = Crafty.e('Keyboard').bind('KeyDown', function () {
    if (this.isDown('R')) {
      restart();
    }
  });
}

function addActors() {
  var rand = 0;
	var colorIndex;
  levelGrid = new Array(GRID_WIDTH);
	levelMap=simpleStage();
  resources = [];
  for (var x = 0; x < GRID_WIDTH; x++) {
    levelGrid[x] = new Array(GRID_HEIGHT);
    for (var y = 0; y < GRID_HEIGHT; y++) {
      if (y == START_YCOORD &&
          (x == START_XCOORD_P1 || x == START_XCOORD_P2)) {
        levelGrid[x][y] = new block(null, null, null);
        continue;
      }
			if (levelMap[x][y]==10){
        levelGrid[x][y] = new block(null, null, null);
        continue;
			}
      colorIndex = levelMap[x][y];
      blockColor = 'block' + SPRITE_GRAPHIC_INDEXES[colorIndex];

      var b = Crafty.e('2D, DOM, block, ' + blockColor).
          attr({x: x * BLOCK_SIZE, y: y * BLOCK_SIZE, z: 200});

      levelGrid[x][y] = new block(b, colorIndex, 0);
    }
  }

  for (var x = 0; x < GRID_WIDTH; x++) {
    for (var y = 0; y < GRID_HEIGHT; y++) {
      if (y == START_YCOORD &&
          (x == START_XCOORD_P1 || x == START_XCOORD_P2)) {
        continue;
      }
      rand = Math.random();
      if (rand > RESOURCE_PROBABILITY) {
        continue;
      }

      // Ensure resources don't exactly overlap after falling
      var twidx = RESOURCE_RANDOM_OFFSET *
                  Math.round(3 * Math.random() - 1.5);
      var twidy = RESOURCE_RANDOM_OFFSET *
                  Math.round(3 * Math.random() - 1.5);

      resources.push(new resource(Crafty.e('2D, DOM, resource').attr({
          x: x * BLOCK_SIZE + 0.5 * (BLOCK_SIZE - RESOURCE_SIZE) + twidx,
          y: y * BLOCK_SIZE + 0.5 * (BLOCK_SIZE - RESOURCE_SIZE) + twidy,
          z: 200
      })));
    }
  }
  Crafty.c('p1anim', {
    init: function() {
      this.requires('Sprite,SpriteAnimation, Grid')
          .animate('stand', 0, 0, 0)
          .animate('walk', 1, 0, 4)
          .animate('jump', 5, 0, 5);
    }
  });
  
  Crafty.c('p2anim', {
    init: function() {
      this.requires('SpriteAnimation, Grid')
          .animate('stand', 0, 1, 0)
          .animate('walk', 1, 1, 4)
          .animate('jump', 5, 1, 5);
    }
  });

  var p1 = Crafty.e('2D, DOM, player, ' +
                    'player1, p1anim, leftControl')
      .attr({x: START_XPOS_P1, y: START_YPOS, z: 200});
  var p2 = Crafty.e('2D, DOM, player, ' +
                    'player2, p2anim, rightControl')
      .attr({x: START_XPOS_P2, y: START_YPOS, z: 200});

  players[0] = new player(p1, 1,
                          START_XPOS_P1, START_YPOS);
  players[1] = new player(p2, 2,
                          START_XPOS_P2, START_YPOS);
}

function doCreep() {
  if (ENABLE_CREEPING) {
    should_creep = true;
  }
  if (!restartNow) {
    timer.delay(doCreep, CREEPING_DEATH_MS);
  }
}

/* Block initializes sounds in gameworld */
function addSounds() {
  Crafty.audio.add({
    bgMusic: [BG_MUSIC],
    player1Run: [PLAYER1_RUN],
    player2Run: [PLAYER2_RUN],
    blockBreak: [BLOCK_BREAK],
    resourceGet: [RESOURCE_GET],
    playerDeath: [PLAYER_DEATH]
  });
}

function block(node, blockType, damage) {
  this.node = node;
  this.blockType = blockType;
  this.damage = damage;
}

function resource(node) {
  this.node = node;
  this.yVel = 0;
  this.getX = function() {
    return posToGrid(this.node._x);
  };
  this.getY = function() {
    return posToGrid(this.node._y);
  };
}

function player(node, playerNum, xpos, ypos) {
  this.node = node;
  this.node.player = this;
  this.playerNum = playerNum;
  this.node._gy = 0;
  this.points = 0;

  this.runningLeft = false;
  this.runningRight = false;
  this.miningSprite = false;

  this.getX = function() {
    return posToGrid(this.node._x);
  };
  
  this.getRightX = function() {
    return posToGrid(this.node._x - PLAYER_WIDTH + 1);
  };

  this.getY = function() {
    return posToGrid(this.node._y);
  };

  return true;
}

function posToGrid(pos) {
  return Math.round(pos / BLOCK_SIZE);
}

function resourceRefresh() {
  for (var n = 0; n < resources.length; n++) {
    var resource = resources[n];
    var x = resource.getX();
    var y = resource.getY();

    if (lg(x, y) && lg(x, y).node) {
      // Elements inside an unbroken block can neither fall nor be picked up.
      continue;
    }
    if (resource.node.y > PLAYGROUND_HEIGHT) {
      resources.splice(n, 1);
      resource.node.destroy();
      continue;
    }
    var nextpos = parseInt(resource.node.y) + parseInt(resource.yVel);
    var elem = lg(x, y + 1);
    if (!elem || !elem.node ||
        nextpos < elem.node.y - RESOURCE_SIZE) {
      resource.node.y = nextpos;
      resource.yVel += GRAVITY_ACCEL;
    } else {
      resource.node.y = elem.node.y - RESOURCE_SIZE;
      resource.yVel = 0;
    }

    var rx = resource.node.x;
    var ry = resource.node.y;

    var popped = false;
    for (var playerNum = 1; playerNum <= 2; playerNum++) {
      var px = pspr(playerNum).x;
      var py = pspr(playerNum).y;
      if (resourceGet(rx, ry, px, py)) {
        if (!popped) {
          resources.splice(n, 1);
        }
        updatePoints(playerNum, 1);
        popped = true;
        Crafty.audio.play('resourceGet');
        // I thought about having a break statement in here, but if the players
        // are occupying the same space, they both deserve the points for a
        // resource as it falls on them.
      }
    }
    if (popped) {
      resource.node.destroy();
    }
  }
}

function frameFunctionality() {
  if (!restartNow) {
    frameDelay.delay(frameFunctionality, FRAME_DELAY);
  }
  playerMove(1);
  playerMove(2);
  playerStop();
  deathFromBelow();
  removeDestroyed();
  verticalMovement(1);
  verticalMovement(2);
  resourceRefresh();
  gameOver();
  //viewport();
}

function addFunctionality() {
  restartNow = false;
  
  frameDelay = Crafty.e('Delay');
  frameDelay.delay(frameFunctionality, FRAME_DELAY);
  timer = Crafty.e('Delay');
  timer.delay(doCreep, CREEPING_DEATH_MS);

  viewportDelay = Crafty.e('Delay');
  viewportDelay.delay(viewport, CAMERA_DELAY);
}

function viewport() {

  if (!PLAYER1_DEAD && !PLAYER2_DEAD) {
    var x = -1*(pspr(1)._x + pspr(2)._x)/2;
    var y = -1*(pspr(1)._y + pspr(2)._y)/2;

    var x_scale = pspr(1)._x - pspr(2)._x;     
    var y_scale = pspr(1)._y - pspr(2)._y;     
    var zoom = 1.7 - 0.000005 *
        (x_scale * x_scale + y_scale * y_scale);

    if (zoom < 1.1) {
      zoom = 1.1;
    }
  }
  else if (!PLAYER1_DEAD) {
      var x = -1*pspr(1)._x;
      var y = -1*pspr(1)._y;
      var zoom = 1.2;
  }
  else if (!PLAYER2_DEAD) {
      var x = -1*pspr(2)._x;
      var y = -1*pspr(2)._y;
      var zoom = 1.2;
  }
  Crafty.viewport.scale(zoom/Crafty.viewport._zoom);
  Crafty.viewport.x = x + (PLAYGROUND_WIDTH/zoom)/2;
  Crafty.viewport.y = y + (PLAYGROUND_HEIGHT/zoom)/2;
  if (!restartNow) {
    frameDelay.delay(viewport, CAMERA_DELAY);
  }
}

// did a player get the resource we are updating?
function resourceGet(rx, ry, px, py) {
  // screw the engine, I doubt this is any slower than theirs.
  if ((px + PLAYER_WIDTH > rx && px < rx + RESOURCE_SIZE) ||
      (px < rx + RESOURCE_SIZE && px + PLAYER_WIDTH >= rx)) {
    if ((py + PLAYER_HEIGHT >= ry && py <= ry + RESOURCE_SIZE) ||
        (py <= ry + RESOURCE_SIZE && py + PLAYER_HEIGHT >= ry)) {
      return true;
    }
  }
  return false;
}

function playerMove(player) {
  var left = 0;
  var right = 0;
  var up = 0;
  switch (player) {
   case 1:
    left = Crafty.keys['A'];
    right = Crafty.keys['D'];
    up = Crafty.keys['W'];
    dig = Crafty.keys['S'];
    break;
   case 2:
    left = Crafty.keys['LEFT_ARROW'];
    right = Crafty.keys['RIGHT_ARROW'];
    up = Crafty.keys['UP_ARROW'];
    dig = Crafty.keys['DOWN_ARROW'];
    break;
  }

  var x = p(player).getX();
  var rx = p(player).getRightX();
  var y = p(player).getY();

  var isRunning = false;

  if (Crafty.keydown[left]) {
    ENABLE_CREEPING = true;

    var nextpos = parseInt(pspr(player)._x) - MOVE_VELOCITY;
    var elem = lg(x - 1, y);

    if (nextpos > 0) {
      if (!elem || !elem.node ||
          nextpos > elem.node._x + BLOCK_SIZE) {
        pspr(player).x = nextpos;
      } else {
        if (elem && elem.node) {
          elem.damage += DAMAGE_COLLIDE;
        }
        pspr(player).x = elem.node._x + BLOCK_SIZE;
      }
    }
    if (!p(player).runningLeft) {
      pspr(player).unflip('X');
      pspr(player).stop().animate('walk', 4, -1);
      p(player).runningLeft = true;
      p(player).runningRight = false;
    }
    isRunning = true;
  }
  if (Crafty.keydown[right]) {
    ENABLE_CREEPING = true;
    var nextpos = parseInt(pspr(player)._x) + MOVE_VELOCITY;
    var elem = lg(x + 1, y);

    if (nextpos < PLAYGROUND_WIDTH - PLAYER_WIDTH) {
      if (!elem || !elem.node ||
          nextpos < elem.node._x - PLAYER_WIDTH) {
        pspr(player).x = nextpos;
      } else {
        if (elem && elem.node) {
          elem.damage += DAMAGE_COLLIDE;
        }
        pspr(player).x = elem.node._x - PLAYER_WIDTH;
      }
    }
    if (!p(player).runningRight) {
      pspr(player).flip('X');
      pspr(player).stop().animate('walk', 4, -1);
      p(player).runningRight = true;
      p(player).runningLeft = false;
    }
    isRunning = true;
  }
  if (Crafty.keydown[up]) {
    ENABLE_CREEPING = true;
    // Ensure the player is standing on solid ground.
    var elem = lg(x, y + 1);
    var elem2 = lg(rx, y + 1);
    if (elem && elem.node &&
        pspr(player)._y == elem.node._y - PLAYER_HEIGHT ||
        elem2 && elem2.node &&
        pspr(player)._y == elem2.node._y - PLAYER_HEIGHT) {
      pspr(player)._gy = JUMP_VELOCITY;
    }
    isRunning = true;
  }
  if (Crafty.keydown[dig]) {
    ENABLE_CREEPING = true;
    // Dig down.
    var elem = lg(x, y + 1);
    var elem2 = lg(rx, y + 1);
    if (elem && elem.node) {
      elem.damage += DAMAGE_DIG;
    }
    else if (elem2 && elem2.node) {
      elem2.damage += DAMAGE_DIG;
    }
    p(player).runningLeft = false;
    p(player).runningRight = false;
  }

  if (player == 1 && isRunning && !PLAYER1_RUNNING && !PLAYER1_DEAD) {
    // console.log("Player 1 begun walking");
    Crafty.audio.play('player1Run', -1);
    PLAYER1_RUNNING = true;
  }
  if (player == 2 && isRunning && !PLAYER2_RUNNING && !PLAYER2_DEAD) {
    // console.log("Player 2 begun walking");
    Crafty.audio.play('player2Run', -1);
    PLAYER2_RUNNING = true;
  }
}

function verticalMovement(player) {
  var x = p(player).getX();
  var rx = p(player).getRightX();
  var y = p(player).getY();

  var nextpos = parseInt(pspr(player)._y) + pspr(player)._gy;
  if (pspr(player)._gy >= 0) {
    var elem = lg(x, y + 1);
    var elem2 = lg(rx, y + 1);
    if ((!elem || !elem.node ||
        nextpos < elem.node._y - PLAYER_HEIGHT) &&
        (!elem2 || !elem2.node ||
        nextpos < elem2.node._y - PLAYER_HEIGHT)) {
      pspr(player).y = nextpos;
      pspr(player)._gy += GRAVITY_ACCEL;
      pspr(player).stop().animate('jump', 1, -1);
      p(player).miningSprite = false;
      p(player).runningLeft = false;
      p(player).runningRight = false;
      PLAYER_INAIR[player - 1] = true;
    } else {
      if (elem && elem.node) {
        pspr(player).y = elem.node._y - PLAYER_HEIGHT;
      } else {
        pspr(player).y = elem2.node._y - PLAYER_HEIGHT;
      }
      pspr(player)._gy = 0;
      PLAYER_INAIR[player - 1] = false;
    }
  } else {
    var elem = lg(x, y - 1);
    var elem2 = lg(rx, y - 1);
    if ((!elem || !elem.node ||
        nextpos > elem.node._y + BLOCK_SIZE) &&
        (!elem2 || !elem2.node ||
        nextpos > elem2.node._y + BLOCK_SIZE)) {
      if (nextpos < 0) {
        nextpos = 0;
      }
      pspr(player).y = nextpos;
      pspr(player)._gy += GRAVITY_ACCEL;
      pspr(player).stop().animate('jump', 1, -1);
      p(player).miningSprite = false;
      p(player).runningLeft = false;
      p(player).runningRight = false;
      PLAYER_INAIR[player - 1] = true;
    } else {
      if (elem && elem.node) {
        elem.damage += DAMAGE_JUMP;
        pspr(player).y = elem.node._y + BLOCK_SIZE;
      }
      else if (elem2 && elem2.node) {
        elem2.damage += DAMAGE_JUMP;
        pspr(player).y = elem2.node._y + BLOCK_SIZE;
      }
      pspr(player)._gy = 0;
      PLAYER_INAIR[player - 1] = false;
    }
  }
}

/* Function to stop sound upon player no longer moving */
/* Also changes player animation back to standing still */
function playerStop() {
  if (!Crafty.keydown[65] &&
      !Crafty.keydown[68] &&
      !Crafty.keydown[87]) {
    if (PLAYER1_RUNNING) {
      PLAYER1_RUNNING = false;
      Crafty.audio.stop('player1Run');
      pspr(1).stop().animate('stand', 1, -1);
    }
    //pspr(1).stop();
    p(1).miningSprite = false;
    p(1).runningLeft = false;
    p(1).runningRight = false;
  }
  if (!Crafty.keydown[37] &&
      !Crafty.keydown[38] &&
      !Crafty.keydown[39]) {
    if (PLAYER2_RUNNING) {
      PLAYER2_RUNNING = false;
      Crafty.audio.stop('player2Run');
      pspr(2).stop().animate('stand', 1, -1);
    }
    //pspr(2).stop();
    p(2).miningSprite = false;
    p(2).runningLeft = false;
    p(2).runningRight = false;
  }
  if (!PLAYER_INAIR[0] && !PLAYER1_RUNNING) {
    pspr(1).stop().animate('stand', 1, -1);
  }
  if (!PLAYER_INAIR[1] && !PLAYER2_RUNNING) {
    pspr(2).stop().animate('stand', 1, -1);
  }
}

function updatePoints(playerNum, pointsInc) {
  playerNum = parseInt(playerNum);
  points = p(playerNum).points + pointsInc;
  if (points > WINNING_POINTS) {
    points = WINNING_POINTS;
  } else if (points < 0) {
      points = 0;
  }

  var h = Math.atan(points / POINT_RAMPING) / (Math.PI / 2);
  $('#pts' + playerNum).animate({'height':
      100 - h * 100 + '%'}, 300);

  p(playerNum).points = points;
}

// Returns the player object associated with a player number.
function p(n) {
  return players[n - 1];
}

// Returns the sprite object associated with a player number.
function pspr(n) {
  return players[n - 1].node;
}

function lg(x, y) {
  if (levelGrid[x] && levelGrid[x][y]) {
    return levelGrid[x][y];
  }
  return undefined;
}

function maybeChain(x, y, type) {
  var elem = lg(x, y);
  if (elem && elem.blockType == type) {
    elem.damage = DAMAGE_TO_EXPLODE;
  }
}

// Removes fully damaged blocks from the board.
function removeDestroyed() {
  var evaluateChainReaction = true;
  while (evaluateChainReaction) {
    evaluateChainReaction = false;
    for (var x = 0; x < GRID_WIDTH; x++) {
      for (var y = 0; y < GRID_HEIGHT; y++) {
        if (levelGrid[x][y].damage &&
            levelGrid[x][y].damage >= DAMAGE_TO_EXPLODE) {
          evaluateChainReaction = true;
          var type = levelGrid[x][y].blockType;
          levelGrid[x][y].node.destroy();
          levelGrid[x][y] = new block(null, null, null);
          
          Crafty.audio.play('blockBreak');
          maybeChain(x + 1, y, type);
          maybeChain(x - 1, y, type);
          maybeChain(x, y + 1, type);
          maybeChain(x, y - 1, type);
        }
      }
    }
  }
}

function deathFromBelow() {
  if (death_y == 1 || !should_creep || !ENABLE_CREEPING) {
    return;
  }
  death_y--;
  for (var x = 0; x < GRID_WIDTH; x++) {
    if (levelGrid[x][death_y].node) {
      levelGrid[x][death_y].node.destroy();
      levelGrid[x][death_y] = new block(null, null, null);
    }
  }
  should_creep = false;
}

function startMusic() {
  if (!MUSIC_PLAYING) {
    Crafty.audio.play('bgMusic', -1, 1.0);
    MUSIC_PLAYING = true;
  }
}

function stopMusic() {
  if (MUSIC_PLAYING) {
    Crafty.audio.stop('bgMusic');
    MUSIC_PLAYING = false;
  }
}

function restart() {
  restartNow = true;
  var rebootDelay = Crafty.e('Delay');
  rebootDelay.delay(reboot, REBOOT_DELAY);
}

function reboot() {
  updatePoints(1, -1 * p(1).points);
  updatePoints(2, -1 * p(2).points);
  
  PLAYER1_DEAD = false;
  PLAYER2_DEAD = false;
  
  stopMusic();
  death_y = GRID_HEIGHT;
  ENABLE_CREEPING = false;
  
  for (var a = 0; a < levelGrid.length; a++) {
    for(var b = 0; b < levelGrid[a].length; b++) {
      var newBlock = levelGrid[a][b];
      if (newBlock.node != null)
        newBlock.node.destroy();
    }
  }
  for (a = 0; a < resources.length; a++) {
    var resource = resources[a];
    if (resource.node != null)
      resource.node.destroy();
  }
  pspr(1).destroy();
  pspr(2).destroy();
  //$('#text').remove();
  Crafty.init(PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT);
  Crafty.viewport.init();
  
  addActors();
  addFunctionality();
  startMusic();
}

function gameOver() {
  if (!PLAYER1_DEAD && pspr(1)._y > PLAYGROUND_HEIGHT) {
    PLAYER1_DEAD = true;
    Crafty.audio.play('playerDeath');
  }
  if (!PLAYER2_DEAD && pspr(2)._y > PLAYGROUND_HEIGHT) {
    PLAYER2_DEAD = true;
    Crafty.audio.play('playerDeath');
  }

  if (PLAYER1_DEAD && PLAYER2_DEAD && !restartNow) {
    var pl = 0;
    if (p(1).points > p(2).points) {
      pl = 1;
    }
    else if (p(1).points < p(2).points) {
      pl = 2;
    }

    //stopMusic();
    
    /*$.playground().addGroup('text', {
      height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH});
    if (pl != 0) {
      $('#text').append('<div style="position: absolute; top: 290px;' +
        'width: 800px; color: white;"><center><a style="cursor: pointer;"' +
        'id="restartbutton">Player ' + pl + ' Wins!</a></center></div>'); }
    else { $('#text').append('<div style="position: absolute; top: 290px;' +
       'width: 800px; color: white;"><center><a style="cursor: pointer;"' +
       'id="restartbutton">Draw!</a></center></div>'); } */
    restartNow = true;
    setTimeout(restart, 3000);
  }
}

var ar = new Array(33, 34, 35, 36, 37, 38, 39, 40);

$(document).keydown(function(e) {
     var key = e.which;
      //console.log(key);
      //if (key==35 || key == 36 || key == 37 || key == 39)
      if ($.inArray(key, ar) > -1) {
          e.preventDefault();
          return false;
      }
      return true;
});

Crafty.scene('mainLevel', function() {
  buildPlayground();
  addActors();
  addSounds();
  addFunctionality();
  startMusic();
});

$(document).ready(function() {
  Crafty.init(PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT);
  //Crafty.canvas.init();
  Crafty.viewport.init();
  Crafty.scene('mainLevel');
});
