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
var START_YCOORD = 24;
var START_YPOS = BLOCK_SIZE * START_YCOORD + (BLOCK_SIZE - PLAYER_HEIGHT);

var GRAVITY_ACCEL = 1.0; // pixels/s^2 (down is positive)
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

var MUSIC_PLAYING = false;
var PLAYER1_DEAD = false;
var PLAYER2_DEAD = false;

var levelGrid; // 2D array containing block objects

var timer;
var should_creep = false;
var death_y = GRID_HEIGHT; // tracks the creeping death.

var players = new Array(null, null);

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

  timer = Crafty.e('Delay');
  timer.delay(doCreep, CREEPING_DEATH_MS);
  restarter = Crafty.e('Keyboard').bind('KeyDown', function () {
    if (this.isDown('R')) {
      restart();
    }
  });

}

function addActors() {
  var rand = 0;
  levelGrid = new Array(GRID_WIDTH);
  for (var x = 0; x < GRID_WIDTH; x++) {
    levelGrid[x] = new Array(GRID_HEIGHT);
    for (var y = 0; y < GRID_HEIGHT; y++) {
      if (y == START_YCOORD &&
          (x == START_XCOORD_P1 || x == START_XCOORD_P2)) {
        levelGrid[x][y] = new block(null, null, null);
        continue;
      }
      rand = Math.floor(Math.random() * NUM_COLORS);
      blockColor = 'block' + SPRITE_GRAPHIC_INDEXES[rand];

      var b = Crafty.e('2D, Canvas, block, Collision, ' + blockColor).
          attr({x: x * BLOCK_SIZE, y: y * BLOCK_SIZE, z: 200});

      levelGrid[x][y] = new block(b, rand, 0);
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

      var r = Crafty.e('2D, Canvas, resource, Collision, Gravity').attr({
          x: x * BLOCK_SIZE + 0.5 * (BLOCK_SIZE - RESOURCE_SIZE) + twidx,
          y: y * BLOCK_SIZE + 0.5 * (BLOCK_SIZE - RESOURCE_SIZE) + twidy,
          z: 200
      }).gravityConst(GRAVITY_ACCEL).gravity('block')
      .onHit('player', function(rsrc, hit) {
        for (object in hit) {
          for (player in players) {
            if (object.obj == player.node) {
              updatePoints(player.playerNum, 1);
              Crafty.audio.play('resourceGet');
            }
          }
        }
        //rsrc.destroy();
      });
    }
  }

  Crafty.c('p1anim', {
    p1anim: function() {
      this.requires('SpriteAnimation, Collision, Grid')
          .animate('walk', 1, 0, 4)
          .animate('jump', 5, 0, 1);
    }
  });

  Crafty.c('p2anim', {
    p2anim: function() {
      this.requires('SpriteAnimation, Collision, Grid')
          .animate('walk', 1, 1, 4)
          .animate('jump', 5, 1, 1);
    }
  });

  var p1 = Crafty.e('2D, Canvas, player, Gravity, Collision, ' +
                    'p1anim, player1, leftControl')
      .attr({x: START_XPOS_P1, y: START_YPOS, z: 200})
      .gravityConst(GRAVITY_ACCEL).gravity('block');
  var p2 = Crafty.e('2D, Canvas, player, Gravity, Collision, ' +
                    'p2anim, player2, rightControl')
      .attr({x: START_XPOS_P2, y: START_YPOS, z: 200})
      .gravityConst(GRAVITY_ACCEL).gravity('block');

  players[0] = new player(p1, 1,
                          START_XPOS_P1, START_YPOS);
  players[1] = new player(p2, 2,
                          START_XPOS_P2, START_YPOS);
}

function doCreep() {
  if (ENABLE_CREEPING) {
    should_creep = true;
  }
  timer.delay(doCreep, CREEPING_DEATH_MS);
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
  this.node._gy = 0;
  this.getX = function() {
    return posToGrid(this.node._x);
  };
  this.getY = function() {
    return posToGrid(this.node._y);
  };
}

function player(node, playerNum, xpos, ypos) {
  this.node = node;
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

function addFunctionality() {
  Crafty.bind('EnterFrame', function() {
    playerMove(1);
    playerMove(2);
    playerStop();
    deathFromBelow();
    removeDestroyed();
    verticalMovement(1);
    verticalMovement(2);
    gameOver();
  });
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
      //pspr(player).setAnimation(p(player).playerWalkLeft);
      //pspr(player).fliph(false);
      p(player).runningLeft = true;
      p(player).runningRight = false;
    }
    isRunning = true;
  }
  if (Crafty.keydown[right]) {
    ENABLE_CREEPING = true;
    var nextpos = parseInt(pspr(player)._x) + MOVE_VELOCITY;
    var elem = lg(x + 1, y);

    if (nextpos < PLAYGROUND_WIDTH - BLOCK_SIZE) {
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
    if (!pspr(player).runningRight) {
      //pspr(player).setAnimation(p(player).playerWalkRight);
      //pspr(player).fliph(true);
      pspr(player).runningRight = true;
      pspr(player).runningLeft = false;
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
    pspr(player).runningLeft = false;
    pspr(player).runningRight = false;
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
      p(player).y = nextpos;
      pspr(player)._gy += GRAVITY_ACCEL;
      ////pspr(player).animate('jump');
      p(player).miningSprite = false;
      p(player).runningLeft = false;
      p(player).runningRight = false;
    } else {
      if (elem && elem.node) {
        p(player).y = elem.node._y - PLAYER_HEIGHT;
      } else {
        p(player).y = elem2.node._y - PLAYER_HEIGHT;
      }

      pspr(player)._gy = 0;
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
      //pspr(player).setAnimation(p(player).playerJump);
      p(player).miningSprite = false;
      p(player).runningLeft = false;
      p(player).runningRight = false;
    } else {
      if (elem && elem.node) {
        elem.damage += DAMAGE_JUMP;
        p(player).y = elem.node._y + BLOCK_SIZE;
      }
      else if (elem2 && elem2.node) {
        elem2.damage += DAMAGE_JUMP;
        p(player).y = elem2.node._y + BLOCK_SIZE;
      }
      pspr(player)._gy = 0;
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
    }
    //pspr(2).stop();
    p(2).miningSprite = false;
    p(2).runningLeft = false;
    p(2).runningRight = false;
  }

}

function updatePoints(playerNum, pointsInc) {
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
          //levelGrid[x][y].node.remove();
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
      //levelGrid[x][death_y].node.remove();
      levelGrid[x][death_y] = new block(null, null, null);
    }
  }
  should_creep = false;
}

function startMusic() {
  if (!MUSIC_PLAYING) {
    console.log("Playing music");
    Crafty.audio.play('bgMusic', -1, 1.0);
    console.log("Playing music");
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
  updatePoints(1, -1 * p(1).points);
  updatePoints(2, -1 * p(2).points);

  stopMusic();
  death_y = GRID_HEIGHT;
  $('#text').remove();

  Crafty.stop(true);

  Crafty.init(PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT);
  //Crafty.canvas.init();

  buildPlayground();
  addActors();
  addSounds();
  addFunctionality();
  Crafty.scene('mainLevel');
  startMusic();
}

function gameOver() {
  if (!PLAYER1_DEAD && p(1)._y > PLAYGROUND_HEIGHT){
    PLAYER1_DEAD = true;
    Crafty.audio.play('playerDeath');
  }
  if(!PLAYER2_DEAD && p(2)._y > PLAYGROUND_HEIGHT){
    PLAYER2_DEAD = true;
    Crafty.audio.play('playerDeath');
  }

  if (PLAYER1_DEAD && PLAYER2_DEAD) {
    PLAYER1_DEAD = false;
    PLAYER2_DEAD = false;
    var pl = 0;
    if (p(1).points > p(2).points) pl = 1;
    else if (p(1).points < p(2).points) pl = 2;

    updatePoints(1, -1 * p(1).points);
    updatePoints(2, -1 * p(2).points);

    stopMusic();
    death_y = GRID_HEIGHT;
    ENABLE_CREEPING = false;

    $.playground().clearAll(true);
    $.playground().addGroup('text', {
      height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH});
    if (pl != 0) {
      $('#text').append('<div style="position: absolute; top: 290px;' +
        'width: 800px; color: white;"><center><a style="cursor: pointer;"' +
        'id="restartbutton">Player ' + pl + ' Wins!</a></center></div>'); }
    else { $('#text').append('<div style="position: absolute; top: 290px;' +
       'width: 800px; color: white;"><center><a style="cursor: pointer;"' +
       'id="restartbutton">Draw!</a></center></div>'); }
    setTimeout(function() {
        restart(); }, 3000);
  }
}

var ar = new Array(33, 34, 35, 36, 37, 38, 39, 40);

$(document).keydown(function(e) {
     var key = e.which;
      //console.log(key);
      //if(key==35 || key == 36 || key == 37 || key == 39)
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
  Crafty.canvas.init();
  Crafty.scene('mainLevel');
});
