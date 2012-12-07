var BLOCK_SIZE = 70;
var PLAYER_HEIGHT = 60;
var PLAYER_WIDTH = 60;
var HALF_PLAYER_WIDTH = PLAYER_WIDTH / 2;
var P_X_ADJUSTMENT = PLAYER_WIDTH / 3;
var P_RIGHTX_ADJUSTMENT = PLAYER_WIDTH / 6;
var BAZOOKA_HEIGHT = 35;
var BAZOOKA_WIDTH = 75;
var JETFIRE_WIDTH = 60;
var JETFIRE_HEIGHT = 120;
var BAZOOKA_DIAGONAL = Math.sqrt(Math.pow(BAZOOKA_WIDTH, 2) +
                       Math.pow(BAZOOKA_HEIGHT, 2));
var BAZOOKA_FRAME_ROTATION = 7;
var MISSILE_HEIGHT = 17;
var MISSILE_WIDTH = 44;
var MISSILE_DIAGONAL = Math.sqrt(Math.pow(MISSILE_WIDTH, 2) +
                       Math.pow(MISSILE_HEIGHT, 2));
var MISSILE_STARTX_OFFSET = 70;
var MISSILE_STARTY_OFFSET = MISSILE_STARTX_OFFSET * 1.2;
var MISSILE_FLIP_OFFSET = 10;
var MISSILE_WAIT_FRAME = 1;
var EXPLOSION_RADIUS = 2;
var EXPLOSION_SIZE = 138;
var EXPLOSION_DURATION = 30;

var NUM_COLORS = 4;

var GRID_WIDTH = 40;
var GRID_HEIGHT = 30;

var PLAYGROUND_WIDTH = BLOCK_SIZE * GRID_WIDTH;
var PLAYGROUND_HEIGHT = BLOCK_SIZE * GRID_HEIGHT;

var LAVA_SIZE = 128;

var DISPLAY_WIDTH = 800;
var DISPLAY_HEIGHT = 600;

// XPOS_P2 and YPOS get a modifier based on sizes to make the board symmetric
// and to begin with a block for a floor
var START_XCOORD_P1 = 16;
var START_XPOS_P1 = START_XCOORD_P1 * BLOCK_SIZE;
var START_XCOORD_P2 = 24;
var START_XPOS_P2 = START_XCOORD_P2 * BLOCK_SIZE + (BLOCK_SIZE - PLAYER_WIDTH);
var START_YCOORD = 15;
var START_YPOS = BLOCK_SIZE * START_YCOORD + (BLOCK_SIZE - PLAYER_HEIGHT);

var GRAVITY_ACCEL = 2; // pixels/s^2 (down is positive)
var BAZOOKA_GRAVITY = 2.2;
var JUMP_VELOCITY = -25;   // pixels/s
var JET_VELOCITY = -25;   // pixels/s
var MOVE_VELOCITY = 4.3;
var DRAG_VELOCITY = 4; // Yes, I know drag isn't normally a velocity.
var MISSILE_VELOCITY = 55;
var INITIAL_FIRE_ANGLE = 30;
var EXPLOSION_VELOCITY = 100;
var DIRECT_HIT_MULTIPLIER = 3;

var WINNING_POINTS = 35;

var JET_Y_OFFSET = 0;
var CAM_Y_AVERAGE = 30;
var ZOOM_AVERAGE = 30;
var FIXED_ZOOM = 2.0;

var DAMAGE_TO_EXPLODE = 15;
var INDESTRUCTIBLE_BLOCK_ID = 8;
var DAMAGE_JUMP = 5;
var DAMAGE_DIG = 5;
var DAMAGE_COLLIDE = 2;
var DESTROY_BLOCKS_INTERVAL = 4;

var POINT_RAMPING = 5;

var ENABLE_CREEPING = false;
var CREEPING_DEATH_MS = 2000;
var FRAME_DELAY = 30;
var FRAMES_PER_CREEP = parseInt(Math.ceil(CREEPING_DEATH_MS / FRAME_DELAY));
var LAVA_PIXELS_PER_FRAME = 1.0 * BLOCK_SIZE / FRAMES_PER_CREEP;
var CAMERA_DELAY = 5;
var REBOOT_DELAY = 50;

var MAX_ZOOM = 2.5;
var MIN_ZOOM = 1.0;

var SPRITE_GRAPHIC_INDEXES = new Array(1, 2, 3, 4, 5, 6, 7, 8, 9);

var BAZOOKA_POINTS_TYPE = 5;
var JET_POINTS_TYPE = 4;
var POINT_TYPES = [BAZOOKA_POINTS_TYPE, JET_POINTS_TYPE];

var MAXPOINTS = {};
MAXPOINTS[BAZOOKA_POINTS_TYPE] = 9;
MAXPOINTS[JET_POINTS_TYPE] = 15;

var POINTS_PER_BLOCK = {}
POINTS_PER_BLOCK[BAZOOKA_POINTS_TYPE] = 3;
POINTS_PER_BLOCK[JET_POINTS_TYPE] = 5;

var BG_MUSIC = 'sounds/bg.ogg';
var PLAYER1_RUN = 'sounds/running1.ogg';
var PLAYER2_RUN = 'sounds/running2.ogg';
var BLOCK_BREAK = 'sounds/crunch.ogg';
var PLAYER_DEATH = 'sounds/splat.ogg';
var BAZOOKA_FIRE = 'sounds/shot.ogg';
var BAZOOKA_IMPACT = 'sounds/boom.ogg';
var PLAYER_JUMP = 'sounds/jump.ogg';
var PLAYER_JET = 'sounds/boost.ogg';

var PLAYER1_RUNNING = false;
var PLAYER2_RUNNING = false;

var PLAYER_INAIR = [false, false];

var MUSIC_PLAYING = false;
var PLAYER1_DEAD = false;
var PLAYER2_DEAD = false;

var levelGrid; // 2D array containing block objects

var timer;
var frameDelay;
var viewportDelay;
var restartNow = true;
var should_creep = false;
var creeping_death_timer = CREEPING_DEATH_MS;
var death_y = GRID_HEIGHT; // tracks the creeping death.

var players = new Array(null, null);
var bazookas = new Array(2);
var missiles = [];
var explosions = [];
var lava_list = [];

var player1_wins = 0;
var player2_wins = 0;

function buildPlayground() {
  var asset_list = ['sprites/800x600.png'];
  asset_list += ['sprites/tiles_dmg_placeholder.png'];
  asset_list += ['sprites/player_sprites.png'];
  asset_list += ['sprites/explosion.png'];
  asset_list += ['sprites/lava_tiles.png'];
  Crafty.load(asset_list);

  Crafty.sprite(PLAYER_WIDTH, PLAYER_HEIGHT,
      'sprites/player_sprites.png', {
    player1: [0, 0],
    player2: [0, 1]
  });

  Crafty.sprite(BLOCK_SIZE,
      'sprites/tiles_dmg_placeholder.png', {
    block1: [0, 0],
    block2: [0, 1],
    block3: [0, 2],
    block4: [0, 3],
    block5: [0, 4],
    block6: [0, 5],
    block7: [0, 6],
    block8: [0, 7],
    block9: [0, 8],
  });

  Crafty.sprite(BAZOOKA_WIDTH, BAZOOKA_HEIGHT,
    'sprites/arm_bazooka.png', {
    bazooka1: [0, 0],
    bazooka2: [0, 1]
  });

  Crafty.sprite(JETFIRE_WIDTH, JETFIRE_HEIGHT,
    'sprites/rocket_fire.png', {
    jetfire: [0, 0]
  });

  Crafty.sprite(MISSILE_WIDTH, MISSILE_HEIGHT,
    'sprites/bazooka_missile.png', {
    missile: [0, 0]
  });

  Crafty.sprite(EXPLOSION_SIZE,
    'sprites/explosion.png', {
    explosion: [0, 0]
  });

  Crafty.sprite(LAVA_SIZE,
    'sprites/lava_tiles.png', {
    lava_surface: [0, 0],
    lava_deep: [0, 1]
  });

  Crafty.e('Keyboard').bind('KeyDown', function () {
    if (this.isDown('R')) {
      if (!restartNow) {
        player1_wins = 0;
        player2_wins = 0;
        var p1_counter = document.getElementById('points1');
        p1_counter.innerHTML = player1_wins;
        var p2_counter = document.getElementById('points2');
        p2_counter.innerHTML = player2_wins;
        restart();
      }
    }
    if (this.isDown('M')) {
      MUSIC.mute();
    }
  });
}

function addActors() {
  var rand = 0;
  var colorIndex;
  levelGrid = new Array(GRID_WIDTH);
  bazookas = new Array(2);
  levelMap = simpleStage();
  missiles = [];
  explosions = [];
  lava_list = [];
  for (var x = 0; x < GRID_WIDTH; x++) {
    levelGrid[x] = new Array(GRID_HEIGHT);
    for (var y = 0; y < GRID_HEIGHT; y++) {
        if (y == START_YCOORD &&
              (x == START_XCOORD_P1 || x == START_XCOORD_P2)) {
            levelGrid[x][y] = new block(null, null, null);
            continue;
        }
        if (levelMap[x][y] == null) {
            levelGrid[x][y] = new block(null, null, null);
            continue;
        }
        colorIndex = levelMap[x][y];
        blockColor = 'block' + SPRITE_GRAPHIC_INDEXES[colorIndex];

        var b = Crafty.e('2D, DOM, block, ' + blockColor).
            attr({x: x * BLOCK_SIZE, y: y * BLOCK_SIZE, z: 200});
        if (levelMap[x][y] == INDESTRUCTIBLE_BLOCK_ID) {
            levelGrid[x][y] = new block(b, colorIndex, -0x7fffffff);
            continue;
        }
        levelGrid[x][y] = new block(b, colorIndex, 0);
    }
  }

  Crafty.c('p1anim', {
    init: function() {
      this.requires('Sprite,SpriteAnimation, Grid')
          .animate('stand', 0, 0, 0)
          .animate('walk', 1, 0, 4)
          .animate('jump', 5, 0, 5)

          .animate('standJ', 0, 6, 0)
          .animate('walkJ', 1, 6, 4)
          .animate('jumpJ', 5, 6, 5)

          .animate('standBJ', 0, 4, 0)
          .animate('walkBJ', 1, 4, 4)
          .animate('jumpBJ', 5, 4, 5)

          .animate('standB', 0, 2, 0)
          .animate('walkB', 1, 2, 4)
          .animate('jumpB', 5, 2, 5);
    }
  });

  Crafty.c('p2anim', {
    init: function() {
      this.requires('SpriteAnimation, Grid')
          .animate('stand', 0, 1, 0)
          .animate('walk', 1, 1, 4)
          .animate('jump', 5, 1, 5)

          .animate('standJ', 0, 7, 0)
          .animate('walkJ', 1, 7, 4)
          .animate('jumpJ', 5, 7, 5)

          .animate('standBJ', 0, 5, 0)
          .animate('walkBJ', 1, 5, 4)
          .animate('jumpBJ', 5, 5, 5)

          .animate('standB', 0, 3, 0)
          .animate('walkB', 1, 3, 4)
          .animate('jumpB', 5, 3, 5);
    }
  });

  Crafty.c('lavaanim', {
    init: function() {
      this.requires('SpriteAnimation, Grid')
          .animate('bubble_surface', 0, 0, 3)
          .animate('bubble_deep', 0, 1, 3)
    }
  });

  Crafty.c('explanim', {
    init: function() {
      this.requires('SpriteAnimation, Grid')
          .animate('explode', 0, 0, 0)
    }
  });

  var p1 = Crafty.e('2D, DOM, player, ' +
                    'player1, p1anim')
      .attr({x: START_XPOS_P1, y: START_YPOS, z: 200});
  var p2 = Crafty.e('2D, DOM, player, ' +
                    'player2, p2anim')
      .attr({x: START_XPOS_P2, y: START_YPOS, z: 200});

  players[0] = new player(p1, 1,
                          START_XPOS_P1, START_YPOS);
  updatePoints(1, POINTS_PER_BLOCK[BAZOOKA_POINTS_TYPE], BAZOOKA_POINTS_TYPE);
  updatePoints(1, POINTS_PER_BLOCK[JET_POINTS_TYPE], JET_POINTS_TYPE);
  pspr(1).flip('X');
  players[1] = new player(p2, 2,
                          START_XPOS_P2, START_YPOS);
  updatePoints(2, POINTS_PER_BLOCK[BAZOOKA_POINTS_TYPE], BAZOOKA_POINTS_TYPE);
  updatePoints(2, POINTS_PER_BLOCK[JET_POINTS_TYPE], JET_POINTS_TYPE);
  pspr(2).flip('X');
  
  for (var y = 0; y < GRID_HEIGHT * BLOCK_SIZE; y += LAVA_SIZE) {
    for (var x = 0; x < GRID_WIDTH * BLOCK_SIZE; x += LAVA_SIZE) {
      var lava = Crafty.e('2D, DOM, Tween, lava_surface, ' +
                          'lavaanim')
          .attr({x: x, y: y + (GRID_HEIGHT - 0.5) * BLOCK_SIZE, z: 300})
      if (y == 0) {
        lava.animate('bubble_surface', 30, -1);
      } else {
        lava.animate('bubble_deep', 30, -1);
      }
      lava_list.push(lava);
    }
  }
}

function doCreep() {
  if (ENABLE_CREEPING) {
    creeping_death_timer -= FRAME_DELAY;
  }
  if (creeping_death_timer <= 0) {
    should_creep = true;
    creeping_death_timer = CREEPING_DEATH_MS;
  }
}

function lavaCreep() {
  for (var n = 0; n < lava_list.length; n++) {
    var lava = lava_list[n];
    lava.y = lava.y - LAVA_PIXELS_PER_FRAME;
  }
}

/* Block initializes sounds in gameworld */
function addSounds() {
  Crafty.audio.add({
    player1Run: [PLAYER1_RUN],
    player2Run: [PLAYER2_RUN],
    blockBreak: [BLOCK_BREAK],
    playerDeath: [PLAYER_DEATH],
    playerJump: [PLAYER_JUMP],
    playerJet: [PLAYER_JET],
    bazookaFire: [BAZOOKA_FIRE],
    bazookaImpact: [BAZOOKA_IMPACT],
  });
}

function block(node, blockType, damage) {
  this.node = node;
  this.blockType = blockType;
  this.damagedBy = 0;
  this.damage = damage;
  this.chained = false;
  this.futureDamaged = 0;
}

function missile(node, angle) {
  this.node = node;
  this.yVel = -Math.sin(toRadians(angle)) * MISSILE_VELOCITY;
  this.xVel = -Math.cos(toRadians(angle)) * MISSILE_VELOCITY;
  this.node.rotation = angle;
  this.directHitTimer = MISSILE_WAIT_FRAME;

  this.getX = function() {
    return posToGrid(this.node._x - BLOCK_SIZE / 2);
  };
  this.getY = function() {
    return posToGrid(this.node._y - BLOCK_SIZE / 2);
  };
}

function explodeObj(node) {
  this.node = node;
  this.timeLeft = EXPLOSION_DURATION;
}

function bazooka(node, player) {
  this.node = node;
  this.player = player;
}

function player(node, playerNum, xpos, ypos) {
  this.node = node;
  this.node.player = this;
  this.playerNum = playerNum;
  this.node._gy = 0;
  this.xVel = 0;
  this.enablePowerup = new Array();
  this.firing = false;
  this.firingAngle = 180;
  this.points = new Array();
  this.jumped = false;
  this.showingBazooka = false;
  this.jetfire = null;

  this.runningLeft = false;
  this.runningRight = false;
  this.bazookaLeft = false;
  this.miningSprite = false;

  this.groundY = this.node._y;

  this.getX = function() {
    return posToGrid(this.node._x + HALF_PLAYER_WIDTH - P_X_ADJUSTMENT);
  };

  this.getRightX = function() {
    return posToGrid(this.node._x - HALF_PLAYER_WIDTH + P_RIGHTX_ADJUSTMENT);
  };

  this.getY = function() {
    return posToGrid(this.node._y);
  };

  return true;
}

function posToGrid(pos) {
  return Math.round(pos / BLOCK_SIZE);
}


var frame_count = 0;

function frameFunctionality() {
  if (!restartNow) {
    frameDelay.delay(frameFunctionality, FRAME_DELAY);
  }

  frame_count++;
  missileRefresh();
  explosionRefresh();
  showBazooka(1);
  showBazooka(2);
  playerMove(1);
  bazookaMove(1);
  jetFireMove(1);
  playerMove(2);
  bazookaMove(2);
  jetFireMove(2);
  playerStop();
  doCreep();
  lavaCreep();
  deathFromBelow();
  if (frame_count % DESTROY_BLOCKS_INTERVAL == 0) {
    removeDestroyed();
  }
  verticalMovement(1);
  verticalMovement(2);
  gameOver();
  MUSIC.update();
}

function addFunctionality() {
  restartNow = false;
  should_creep = false;
  creeping_death_timer = CREEPING_DEATH_MS;

  frameDelay = Crafty.e('Delay');
  frameDelay.delay(frameFunctionality, FRAME_DELAY);
  timer = Crafty.e('Delay');
}

var prevY = [];
var prevX = [];
var prevZoom = [];
function viewport() {
  if (restartNow) {
      prevY = [];
      prevX = [];
      prevZoom = [];
      viewportDelay.delay(viewport, CAMERA_DELAY);
      return;
  }
  if (!PLAYER1_DEAD && !PLAYER2_DEAD) {
    var curX = -1 * (pspr(1)._x + pspr(2)._x) / 2;
    var curY = -1 * (p(1).groundY + p(2).groundY) / 2;
    var x_scale = pspr(1)._x - pspr(2)._x;
    var y_scale = p(1).groundY - p(2).groundY;
    //var y_scale = pspr(1)._y - pspr(2)._y;
    var curZoom = MAX_ZOOM - 0.0000025 *
        Math.max(x_scale * x_scale, y_scale * y_scale);

    if (curZoom < MIN_ZOOM) {
      curZoom = MIN_ZOOM;
    }
  }
  else if (!PLAYER1_DEAD) {
      var curX = -1 * pspr(1)._x;
      var curY = -1 * pspr(1)._y;
      var curZoom = FIXED_ZOOM;
  }
  else if (!PLAYER2_DEAD) {
      var curX = -1 * pspr(2)._x;
      var curY = -1 * pspr(2)._y;
      var curZoom = FIXED_ZOOM;
  }


  prevZoom.push(curZoom);
  var zoom = 0;
  for (var i = 0; i < prevZoom.length; i++) {
    zoom += prevZoom[i];
  }
  zoom /= prevZoom.length;
  if (prevZoom.length >= ZOOM_AVERAGE) {
    prevZoom.shift();
  }


  curX += (PLAYGROUND_WIDTH / (zoom * 0.73)) / 2;
  curY += (PLAYGROUND_HEIGHT / (zoom * 0.75)) / 2;

  prevY.push(curY);
  var y = 0;
  for (var i = 0; i < prevY.length; i++) {
    y += prevY[i];
  }
  y /= prevY.length;
  if (prevY.length >= CAM_Y_AVERAGE) {
    prevY.shift();
  }

  prevX.push(curX);
  var x = 0;
  for (var i = 0; i < prevX.length; i++) {
    x += prevX[i];
  }
  x /= prevX.length;
  if (prevX.length >= CAM_Y_AVERAGE) {
    prevX.shift();
  }

  if (x > 0) {
      x = 0;
  }
  if (x < DISPLAY_WIDTH * (1 - zoom)) {
      x = DISPLAY_WIDTH * (1 - zoom);
  }

  if (y > 0) {
      y = 0;
  }
  if (y < DISPLAY_HEIGHT * (1 - zoom)) {
      y = DISPLAY_HEIGHT * (1 - zoom);
  }


  Crafty.viewport.scale((zoom * 0.286) / Crafty.viewport._zoom);
  Crafty.viewport.x = x;
  Crafty.viewport.y = y;
  viewportDelay.delay(viewport, CAMERA_DELAY);
}

function missileRefresh() {
  for (var n = 0; n < missiles.length; n++) {
    var missile = missiles[n];
    var mspr = missile.node;
    var mXGrid = missile.getX();
    var mYGrid = missile.getY();
    
    var exploded = false;
    
    var playerHit = 0;
    
    for (a = 1; a <= 2 && missile.directHitTimer <= 0; a++) {
      var pl = p(a);
      var pXGrid = pl.getX();
      var pYGrid = pl.getY();
      if (pXGrid == mXGrid && pYGrid == mYGrid) {
        exploded = true;
        playerHit += a;
      }
    }
    
    missile.directHitTimer--;
    
    if (lg(mXGrid, mYGrid) && lg(mXGrid, mYGrid).node) {
      exploded = true;
    }
    
    if (exploded) {
      for (var a = -EXPLOSION_RADIUS; a <= EXPLOSION_RADIUS; a++) {
        if ((mXGrid + a < 0) || (mXGrid + a > GRID_WIDTH))
          continue;
        for (var b = -(EXPLOSION_RADIUS - Math.abs(a));
             b <= (EXPLOSION_RADIUS - Math.abs(a)); b++) {
          if ((mYGrid + b < 0) || (mYGrid + b > GRID_HEIGHT))
            continue;
          if (lg(mXGrid + a, mYGrid + b) && lg(mXGrid + a, mYGrid + b).node) {
            lg(mXGrid + a, mYGrid + b).damage += DAMAGE_TO_EXPLODE;
          }
        }
      }
      mspr.destroy();
      delete missiles[n];
      Crafty.audio.play('bazookaImpact');
      missiles.splice(n, 1);
      
      var explosion = new explodeObj(Crafty.e('2D, DOM, explosion,' +
                                             'explanim, Tween').attr({
                                     alpha: 1.0,
                                     x: mXGrid * BLOCK_SIZE,
                                     y: mYGrid * BLOCK_SIZE,
                                     z: 200}).tween({
                                     alpha: 0.0
                      }, 30));
      explosion.node.stop().animate('explode', 1, -1);
      explosions.push(explosion);
      
      for (a = 1; a <= 2; a++) {
        var pl = p(a);
        var ps = pspr(a);
        if ((playerHit & a) == a) {
          pl.xVel += missile.xVel * DIRECT_HIT_MULTIPLIER;
          pl._gy += missile.yVel * DIRECT_HIT_MULTIPLIER;
        }
        else {
          var pXGrid = pl.getX();
          var pYGrid = pl.getY();
          var explosionMagnitude = EXPLOSION_VELOCITY * (1 -
                   (Math.sqrt(Math.pow(mXGrid - pXGrid, 2) +
                   Math.pow(mYGrid - pYGrid,2)) / EXPLOSION_RADIUS));
          if (explosionMagnitude <= 0) {
            continue;
          }
          pl.xVel += 2 * explosionMagnitude * Math.cos(Math.atan2(
                              pYGrid - mYGrid, pXGrid - mXGrid));
          ps._gy += explosionMagnitude * Math.sin(Math.atan2(
                              pYGrid - mYGrid, pXGrid - mXGrid));
        }
      }
      n -= 1;
      continue;
    }
    if (mspr._x > PLAYGROUND_WIDTH || mspr._x < 0 ||
        mspr._y > PLAYGROUND_HEIGHT) {
      mspr.destroy();
      delete missiles[n];
      missiles.splice(n,1);
      n -= 1;
      continue;
    }
    mspr.x = mspr._x + missile.xVel;
    mspr.y = mspr._y + missile.yVel;
    missile.yVel += BAZOOKA_GRAVITY;
    mspr.rotation = Math.atan2(-missile.yVel, -missile.xVel) *
                    360 / 2 / Math.PI;
  }
}

function explosionRefresh() {
  for (var n = 0; n < explosions.length; n++) {
    var explosion = explosions[n];
    explosion.timeLeft--;
    if (explosion.timeLeft <= 0) {
      if (explosion.node != null) {
        explosion.node.destroy();
      }
      delete explosions[n];
      explosions.splice(n, 1);
      n--;
    }
  }
}

function bazookaMove(player) {
  if(!p(player).showingBazooka)
      return
  var clockwise = 0;
  var counterClock = 0;
  switch (player) {
   case 1:
    clockwise = Crafty.keys['D'];
    counterClock = Crafty.keys['A'];
    break;
   case 2:
    clockwise = Crafty.keys['RIGHT_ARROW'];
    counterClock = Crafty.keys['LEFT_ARROW'];
    break;
  }
  if ( Crafty.keydown[clockwise] &&
      p(player).firing ) {
    p(player).firingAngle += BAZOOKA_FRAME_ROTATION;
  }
  if (Crafty.keydown[counterClock] &&
      p(player).firing ) {
    p(player).firingAngle -= BAZOOKA_FRAME_ROTATION;
  }

  p(player).firingAngle += 360;
  p(player).firingAngle %= 360;

  if (p(player).firingAngle > 90 && p(player).firingAngle < 270) {
    if(p(player).firing)
        pspr(player).flip('X');
    p(player).bazookaLeft = false;
    baz(player).node.flip('Y');
  }
  else {
    if(p(player).firing)
        pspr(player).unflip('X');
    p(player).bazookaLeft = true;
    baz(player).node.unflip('Y');
  }

  baz(player).node.rotation = (p(player).firingAngle);
  var bazookaTargetCenterX = pspr(player)._x + HALF_PLAYER_WIDTH;
  var bazookaTargetCenterY = pspr(player)._y + .3 * PLAYER_HEIGHT;
  var bazookaOffsetX =
    Math.cos(toRadians(p(player).firingAngle)) *
    BAZOOKA_DIAGONAL / 2;
  var bazookaOffsetY =
    Math.sin(toRadians(p(player).firingAngle)) *
    BAZOOKA_DIAGONAL / 2;
  baz(player).node.x = bazookaTargetCenterX - bazookaOffsetX;
  baz(player).node.y = bazookaTargetCenterY - bazookaOffsetY;
}

function missileFire(player) {
  var startX = p(player).node._x + HALF_PLAYER_WIDTH -
    MISSILE_STARTX_OFFSET * Math.cos(toRadians(p(player).firingAngle));
  var startY = p(player).node._y + .3 * PLAYER_HEIGHT -
    MISSILE_STARTY_OFFSET * Math.sin(toRadians(p(player).firingAngle));
  if (pspr(player)._flipX) {
    startX += MISSILE_FLIP_OFFSET
    startY += MISSILE_FLIP_OFFSET;
  }
  Crafty.audio.play('bazookaFire');
  var m = new missile(Crafty.e('2D, DOM, missile').attr({
          x: startX,
          y: startY,
          z: 200
      }), p(player).firingAngle);
  m.xVel += p(player).xVel;
  m.yVel += pspr(player)._gy;
  missiles.push(m);
}

function jet(player) {
  if(p(player).enablePowerup[JET_POINTS_TYPE] &&
     PLAYER_INAIR[player - 1] &&
     !p(player).jumped ) {

    updatePoints(player, -1, JET_POINTS_TYPE);
    pspr(player)._gy = JET_VELOCITY;
    p(player).groundY = pspr(player)._y - JET_Y_OFFSET;
    Crafty.audio.play('playerJet');
    if (p(player).jetfire) {
      p(player).jetfire.destroy();
      delete p(player).jetfire;
    }

    p(player).jetfire = Crafty.e('2D, DOM, jetfire, Tween').attr({
        alpha: 1.0,
        x: pspr(player)._x,
        y: pspr(player)._y,
        z: 200
    }).tween({alpha: 0.0}, 15);

    if(pspr(player)._flipX) {
      p(player).jetfire.flip('X');
    }

    p(player).jumped = true;
  }
}

function jetFireMove(player) {
    if(p(player).jetfire) {
      p(player).jetfire.x = pspr(player)._x;
      p(player).jetfire.y = pspr(player)._y;

      if(pspr(player)._flipX) {
        p(player).jetfire.flip('X');
      }
      else {
        p(player).jetfire.unflip('X');
      }
    }
}

function showBazooka(player) {
    if(p(player).enablePowerup[BAZOOKA_POINTS_TYPE] &&
       !p(player).showingBazooka) {
      bazookas[player - 1] = new bazooka(Crafty.e('2D, DOM, bazooka'+player).attr({
          x: pspr(player)._x,
          y: pspr(player)._y,
          z: 200
      }), player);

      p(player).showingBazooka = true;
    }
    else if(!p(player).enablePowerup[BAZOOKA_POINTS_TYPE] &&
            p(player).showingBazooka) {
      if (baz(player) && baz(player).node) {
        baz(player).node.destroy();
        delete baz(player);
      }

      p(player).showingBazooka = false;
    }
}

function playerMove(player) {
  var left = 0;
  var right = 0;
  var up = 0;
  var dig = 0;
  var fire = 0;
  switch (player) {
   case 1:
    left = Crafty.keys['A'];
    right = Crafty.keys['D'];
    up = Crafty.keys['W'];
    dig = Crafty.keys['S'];
    fire = Crafty.keys['C'];
    break;
   case 2:
    left = Crafty.keys['LEFT_ARROW'];
    right = Crafty.keys['RIGHT_ARROW'];
    up = Crafty.keys['UP_ARROW'];
    dig = Crafty.keys['DOWN_ARROW'];
    fire = Crafty.keys['SPACE'];
    break;
  }

  if (!Crafty.keydown[up]) {
    p(player).jumped = false;
  }
  else {
    jet(player);
  }

  if (p(player).firing) {
    if (!Crafty.keydown[fire]) {
      if(Crafty.keydown[dig]) {
        p(player).firing = false;
      }
      else {
        updatePoints(player, -1,
                     BAZOOKA_POINTS_TYPE);
        missileFire(player);
        p(player).firing = false;
      }
    }
  } else if (Crafty.keydown[fire] &&
             p(player).enablePowerup[BAZOOKA_POINTS_TYPE]) {
    ENABLE_CREEPING = true;
    p(player).firing = true;
  }
  var x = p(player).getX();
  var rx = p(player).getRightX();
  var y = p(player).getY();

  var isRunning = false;

  if (!p(player).firing) {
    if (Crafty.keydown[left]) {
      ENABLE_CREEPING = true;

      p(player).xVel -= MOVE_VELOCITY;
    }
    if (Crafty.keydown[right]) {
      ENABLE_CREEPING = true;

      p(player).xVel += MOVE_VELOCITY;
    }
  }
  var nextpos = parseInt(pspr(player)._x) + p(player).xVel;
  if (p(player).xVel < 0) {
    var elem = lg(x - 1, y);

    if (nextpos > 0) {
      if (!elem || !elem.node ||
          nextpos > elem.node._x + BLOCK_SIZE) {
        pspr(player).x = nextpos;
      } else {
        if (elem && elem.node) {
          elem.damage += DAMAGE_COLLIDE;
          processDamage(elem);
          elem.damagedBy = player;
        }
        pspr(player).x = elem.node._x + BLOCK_SIZE;
        p(player).xVel = 0;
      }
    }
    if (!p(player).runningLeft) {
      pspr(player).unflip('X');
      pspr(player).stop().animate('walk'+getAnimTag(player), 12, -1);
      p(player).runningLeft = true;
      p(player).runningRight = false;

      if(!p(player).bazookaLeft) {
        p(player).firingAngle = 180 - p(player).firingAngle;
        p(player).bazookaLeft = true;
      }
    }
    isRunning = true;
    p(player).xVel += Math.min(-1 * p(player).xVel, DRAG_VELOCITY);
  }
  else if (p(player).xVel > 0) {
    var elem = lg(x + 1, y);

    if (nextpos < PLAYGROUND_WIDTH - PLAYER_WIDTH) {
      if (!elem || !elem.node ||
          nextpos < elem.node._x - PLAYER_WIDTH) {
        pspr(player).x = nextpos;
      } else {
        if (elem && elem.node) {
          elem.damage += DAMAGE_COLLIDE;
          processDamage(elem);
          elem.damagedBy |= player;
        }
        pspr(player).x = elem.node._x - PLAYER_WIDTH;
        p(player).xVel = 0;
      }
    }
    if (!p(player).runningRight) {
      pspr(player).flip('X');
      pspr(player).stop().animate('walk'+getAnimTag(player), 12, -1);
      p(player).runningRight = true;
      p(player).runningLeft = false;

      if(p(player).bazookaLeft) {
        p(player).firingAngle = 180 - p(player).firingAngle;
        p(player).bazookaLeft = false;
      }
    }
    isRunning = true;
    p(player).xVel -= Math.min(p(player).xVel, DRAG_VELOCITY);
  }
  if (Crafty.keydown[up] && !p(player).firing) {
    ENABLE_CREEPING = true;
    p(player).jumped = true;
    // Ensure the player is standing on solid ground.
    var elem = lg(x, y + 1);
    var elem2 = lg(rx, y + 1);
    if (elem && elem.node &&
        pspr(player)._y == elem.node._y - PLAYER_HEIGHT ||
        elem2 && elem2.node &&
        pspr(player)._y == elem2.node._y - PLAYER_HEIGHT) {
      pspr(player)._gy = JUMP_VELOCITY;
      Crafty.audio.play('playerJump');
    }
    isRunning = true;
  }
  if (Crafty.keydown[dig] && !p(player).firing) {
    ENABLE_CREEPING = true;
    // Dig down.
    var elem = lg(x, y + 1);
    var elem2 = lg(rx, y + 1);
    if (elem && elem.node) {
      elem.damage += DAMAGE_DIG;
      processDamage(elem);
      elem.damagedBy |= player;
    } else if (elem2 && elem2.node) {
      elem2.damage += DAMAGE_DIG;
      processDamage(elem2);
      elem2.damagedBy |= player;
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
  var origGy = pspr(player)._gy;

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
      pspr(player).stop().animate('jump'+getAnimTag(player), 1, -1);
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
      pspr(player).stop().animate('jump'+getAnimTag(player), 1, -1);
      p(player).miningSprite = false;
      p(player).runningLeft = false;
      p(player).runningRight = false;
      PLAYER_INAIR[player - 1] = true;
    } else {
      if (elem && elem.node) {
        elem.damage += DAMAGE_JUMP;
        processDamage(elem);
        elem.damagedBy |= player;
        pspr(player).y = elem.node._y + BLOCK_SIZE;
      }
      else if (elem2 && elem2.node) {
        elem2.damage += DAMAGE_JUMP;
        processDamage(elem2);
        elem2.damagedBy |= player;
        pspr(player).y = elem2.node._y + BLOCK_SIZE;
      }
      pspr(player)._gy = 0;
      //PLAYER_INAIR[player - 1] = false;
    }
  }
  if (!PLAYER_INAIR[player - 1]) {
    p(player).groundY = pspr(player)._y;
    if(pspr(player).isPlaying('jump')) {
      pspr(player).stop();
    }
  }
}

function getAnimTag(player) {
  var tag = '';
  if(p(player).enablePowerup[BAZOOKA_POINTS_TYPE]) {
    tag += 'B';
  }
  if(p(player).enablePowerup[JET_POINTS_TYPE]) {
    tag += 'J';
  }
  return tag;
}


/* Function to stop sound upon player no longer moving */
/* Also changes player animation back to standing still */
function playerStop() {
  if (!Crafty.keydown[65] &&
      !Crafty.keydown[68]) {
    if (PLAYER1_RUNNING) {
      PLAYER1_RUNNING = false;
      Crafty.audio.stop('player1Run');
      pspr(1).stop().animate('stand'+getAnimTag(1), 1, -1);
    }
    //pspr(1).stop();
    p(1).miningSprite = false;
    p(1).runningLeft = false;
    p(1).runningRight = false;
  }
  if (!Crafty.keydown[38] &&
      !Crafty.keydown[37] &&
      !Crafty.keydown[39]) {
    if (PLAYER2_RUNNING) {
      PLAYER2_RUNNING = false;
      Crafty.audio.stop('player2Run');
      pspr(2).stop().animate('stand'+getAnimTag(2), 1, -1);
    }
    //pspr(2).stop();
    p(2).miningSprite = false;
    p(2).runningLeft = false;
    p(2).runningRight = false;
  }
  if (!PLAYER_INAIR[0] && !PLAYER1_RUNNING) {
    pspr(1).stop().animate('stand'+getAnimTag(1), 1, -1);
  }
  if (!PLAYER_INAIR[1] && !PLAYER2_RUNNING) {
    pspr(2).stop().animate('stand'+getAnimTag(2), 1, -1);
  }
}

function updatePoints(playerNum, pointsInc, pointsType) {
  playerNum = parseInt(playerNum);
  if (playerNum <= 0) {
    return;
  }
  pspr(playerNum).sprite(0, 2);
  if (p(playerNum).points[pointsType] == null) {
    p(playerNum).points[pointsType] = pointsInc;
  }
  else {
    p(playerNum).points[pointsType] += pointsInc;
  }
  if (MAXPOINTS[pointsType] != null &&
      p(playerNum).points[pointsType] >= MAXPOINTS[pointsType]) {
    p(playerNum).points[pointsType] = MAXPOINTS[pointsType];
  }
  else if (p(playerNum).points[pointsType] <= 0) {
    p(playerNum).points[pointsType] = 0;
    p(playerNum).enablePowerup[pointsType] = false;
    $('#_'+pointsType+'Icon'+playerNum).removeClass('Icon'+pointsType+'_'+playerNum);
    $('#_'+pointsType+'Icon'+playerNum).addClass('Icon'+pointsType+'_'+playerNum+'_dis');
  }

  if(p(playerNum).points[pointsType] > 0) {
    $('#_'+pointsType+'Icon'+playerNum).removeClass('Icon'+pointsType+'_'+playerNum+'_dis');
    $('#_'+pointsType+'Icon'+playerNum).addClass('Icon'+pointsType+'_'+playerNum);
    p(playerNum).enablePowerup[pointsType] = true;
  }

  if (MAXPOINTS[pointsType] != null) {
    var widthPerc = ((p(playerNum).points[pointsType] /
                    MAXPOINTS[pointsType])*100)+'%';
    $('#_'+pointsType+'Bar'+playerNum).animate({
        width: widthPerc }, 200);
  }

}

function resetPoints(playerNum) {
  p(playerNum).points = new Array(POINTS_PER_BLOCK[BAZOOKA_POINTS_TYPE], 
                                  POINTS_PER_BLOCK[JET_POINTS_TYPE]);
  p(playerNum).enablePowerup = new Array();
}

// Returns the player object associated with a player number.
function p(n) {
  return players[n - 1];
}

// Returns the sprite object associated with a player number.
function pspr(n) {
  return players[n - 1].node;
}

// Returns the bazooka object associated with a player number.
function baz(n) {
  return bazookas[n - 1];
}

function toRadians(deg) {
  return (deg * Math.PI * 2 / 360);
}

function lg(x, y) {
  if (levelGrid[x] && levelGrid[x][y]) {
    return levelGrid[x][y];
  }
  return undefined;
}

function maybeChain(x, y, type, player) {
  var elem = lg(x, y);
  if (elem && elem.blockType == type) {
    if (elem.damage < DAMAGE_TO_EXPLODE) {
      elem.futureDamaged |= player;
      elem.chained = true;
      elem.damage = DAMAGE_TO_EXPLODE - 1;
      processDamage(elem);
    }
  }
}

function processDamage(elem) {
  var fractionWhole = 1 - (elem.damage / DAMAGE_TO_EXPLODE);
  if (fractionWhole == 1) {
    elem.node.__coord[0] = 0 * BLOCK_SIZE;
  } else if (fractionWhole >= 0.75) {
    elem.node.__coord[0] = 1 * BLOCK_SIZE;
  } else if (fractionWhole >= 0.50) {
    elem.node.__coord[0] = 2 * BLOCK_SIZE;
  } else if (fractionWhole >= 0.25) {
    elem.node.__coord[0] = 3 * BLOCK_SIZE;
  } else {
    elem.node.__coord[0] = 4 * BLOCK_SIZE;
  }
  elem.node.trigger("Change");
}

// Removes fully damaged blocks from the board.
function removeDestroyed() {
  var evaluateMore = false;
  for (var x = 0; x < GRID_WIDTH; x++) {
    for (var y = 0; y < GRID_HEIGHT; y++) {
      if (levelGrid[x][y].damage &&
          levelGrid[x][y].damage >= DAMAGE_TO_EXPLODE) {
        evaluateMore = true;
        var type = levelGrid[x][y].blockType;
        var player = levelGrid[x][y].damagedBy;
        if (player != 0) {
          maybeChain(x + 1, y, type, player);
          maybeChain(x - 1, y, type, player);
          maybeChain(x, y + 1, type, player);
          maybeChain(x, y - 1, type, player);
          if (POINTS_PER_BLOCK[type]) {
            updatePoints(player & 1, POINTS_PER_BLOCK[type], type);
            updatePoints(player & 2, POINTS_PER_BLOCK[type], type);
          }
        }
        levelGrid[x][y].node.destroy();
        delete levelGrid[x][y];
        levelGrid[x][y] = new block(null, null, null);
        Crafty.audio.play('blockBreak');
      }
      else if(levelGrid[x][y].node) {
        levelGrid[x][y].damagedBy = 0;
      }
    }
  }
  if (evaluateMore) {
    for (var x = 0; x < GRID_WIDTH; x++) {
      for (var y = 0; y < GRID_HEIGHT; y++) {
        if (levelGrid[x][y].chained) {
          levelGrid[x][y].damagedBy = levelGrid[x][y].futureDamaged;
          levelGrid[x][y].damage = DAMAGE_TO_EXPLODE;
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
      delete levelGrid[x][death_y];
      levelGrid[x][death_y] = new block(null, null, null);
    }
  }
  should_creep = false;
}

function startMusic() {
  MUSIC.toggle(true);
}

function stopMusic() {
  MUSIC.toggle(false);
}

function restart() {
  restartNow = true;
  var rebootDelay = Crafty.e('Delay');
  rebootDelay.delay(reboot, REBOOT_DELAY);
}

function reboot() {
  if (PLAYER1_DEAD && !PLAYER2_DEAD) {
    player2_wins += 1;
    var p2_counter = document.getElementById('points2');
    p2_counter.innerHTML = player2_wins;
  }
  if (PLAYER2_DEAD && !PLAYER1_DEAD) {
    player1_wins += 1;
    var p1_counter = document.getElementById('points1');
    p1_counter.innerHTML = player1_wins;
  }
  PLAYER1_DEAD = false;
  PLAYER2_DEAD = false;

  death_y = GRID_HEIGHT;
  ENABLE_CREEPING = false;

  for (var a = 0; a < levelGrid.length; a++) {
    for (var b = 0; b < levelGrid[a].length; b++) {
      var newBlock = levelGrid[a][b];
      if (newBlock.node != null) {
        newBlock.node.destroy();
      }
      delete levelGrid[a][b];
    }
  }
  for (a = 0; a < missiles.length; a++) {
    var missile = missiles[a];
    if (missile.node != null) {
      missile.node.destroy();
    }
    delete missiles[a];
  }
  for (a = 0; a < explosions.length; a++) {
    var explosion = explosions[a];
    if (explosion.node != null) {
      explosion.node.destroy();
    }
    delete explosions[a];
  }
  for (a = 0; a < lava_list.length; a++) {
    var lava = lava_list[a];
    lava.destroy();
    delete lava_list[a];
  }
  for (a = 1; a <= 2; a++) {
    if (baz(a) != null && baz(a).node != null) {
      baz(a).node.destroy();
      delete baz(a);
    }
    resetPoints(a);
    if (p(a).jetfire) {
      p(a).jetfire.destroy();
      delete p(a).jetfire;
    }
    pspr(a).destroy();
    delete p(a);
  }
  //$('#text').remove();
  Crafty.init(PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT);
  Crafty.viewport.init();

  addActors();
  addFunctionality();
  startMusic();
}

function gameOver() {
  if (!PLAYER1_DEAD && pspr(1)._y > death_y * BLOCK_SIZE) {
    PLAYER1_DEAD = true;
  }
  if (!PLAYER2_DEAD && pspr(2)._y > death_y * BLOCK_SIZE) {
    PLAYER2_DEAD = true;
  }

  if ((PLAYER1_DEAD || PLAYER2_DEAD) && !restartNow) {
    restartNow = true;
    var pl = 0;

    stopMusic();
    Crafty.audio.stop();
    Crafty.audio.play('playerDeath');
    setTimeout(restart, 3000);
  }
}

var ar = new Array(32, 33, 34, 35, 36, 37, 38, 39, 40);

$(document).keydown(function(e) {
     var key = e.which;
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
  stopMusic();
  viewportDelay = Crafty.e('Delay');
  viewportDelay.delay(viewport, CAMERA_DELAY);
});

$(document).ready(function() {
  Crafty.init(PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT);
  //Crafty.canvas.init();
  Crafty.viewport.init();
  Crafty.scene('mainLevel');
});
