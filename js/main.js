var BLOCK_SIZE = 70;
var PLAYER_HEIGHT = 60;
var PLAYER_WIDTH = 60;
var HALF_PLAYER_WIDTH = PLAYER_WIDTH / 2;
var PLAYER_X_ADJUSTMENT = PLAYER_WIDTH / 3;
var PLAYER_RIGHTX_ADJUSTMENT = PLAYER_WIDTH / 6;
var RESOURCE_SIZE = 11;
var BAZOOKA_HEIGHT = 35;
var BAZOOKA_WIDTH = 75;
var BAZOOKA_DIAGONAL = Math.sqrt(Math.pow(BAZOOKA_WIDTH, 2)
                       + Math.pow(BAZOOKA_HEIGHT, 2));
var MISSILE_HEIGHT = 17;
var MISSILE_WIDTH = 44;
var MISSILE_DIAGONAL = Math.sqrt(Math.pow(MISSILE_WIDTH, 2)
                       + Math.pow(MISSILE_HEIGHT, 2));
var MISSILE_STARTX_OFFSET = 70;
var MISSILE_STARTY_OFFSET = MISSILE_STARTX_OFFSET * 1.2;
var MISSILE_FLIP_OFFSET = 10;
var EXPLOSION_RADIUS = 2;

var RESOURCE_RANDOM_OFFSET = 2;
var NUM_COLORS = 4;

var GRID_WIDTH = 40;
var GRID_HEIGHT = 30;

var PLAYGROUND_WIDTH = BLOCK_SIZE * GRID_WIDTH;
var PLAYGROUND_HEIGHT = BLOCK_SIZE * GRID_HEIGHT;

var DISPLAY_WIDTH = 800;
var DISPLAY_HEIGHT = 600;

// XPOS_P2 and YPOS get a modifier based on sizes to make the board symmetric
// and to begin with a block for a floor
var START_XCOORD_P1 = 16;
var START_XPOS_P1 = START_XCOORD_P1 * BLOCK_SIZE;
var START_XCOORD_P2 = 23;
var START_XPOS_P2 = START_XCOORD_P2 * BLOCK_SIZE + (BLOCK_SIZE - PLAYER_WIDTH);
var START_YCOORD = 15;
var START_YPOS = BLOCK_SIZE * START_YCOORD + (BLOCK_SIZE - PLAYER_HEIGHT);

var GRAVITY_ACCEL = 2; // pixels/s^2 (down is positive)
var JUMP_VELOCITY = -25;   // pixels/s
var MOVE_VELOCITY = 4;
var DRAG_VELOCITY = 6; // Yes, I know drag isn't normally a velocity.
var MISSILE_VELOCITY = 35;
var INITIAL_FIRE_ANGLE = 30;
var EXPLOSION_VELOCITY = 35;

var WINNING_POINTS = 35;

var OUCH_VELOCITY = 999;
var OUCH_DIVIDER = 3;

var CAM_Y_AVERAGE = 10;
var ZOOM_AVERAGE = 10;
var FIXED_ZOOM = 2.0;

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

var MAX_ZOOM = 2.8;
var MIN_ZOOM = 1.0;

var RESOURCE_PROBABILITY = 0.05; // probably any block has a resource in it
var SPRITE_GRAPHIC_INDEXES = new Array(1, 2, 3, 4);

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
var bazookas = new Array(2);
var resources = [];
var missiles = [];

function buildPlayground() {
  var asset_list = ['sprites/800x600.png', 'sprites/Resource.png'];
  asset_list += ['sprites/vert_tiles_70.png'];
  asset_list += ['sprites/player_tiles_60.png'];
  Crafty.load(asset_list);
  //Crafty.background('sprites/800x600.png');

  Crafty.sprite(RESOURCE_SIZE, 'sprites/Resource.png', {
    resource: [0, 0]
  });

  Crafty.sprite(PLAYER_WIDTH, PLAYER_HEIGHT,
      'sprites/player_tiles_60.png', {
    player1: [0, 0],
    player2: [0, 1],
  });

  Crafty.sprite(BLOCK_SIZE,
      'sprites/vert_tiles_70.png', {
    block1: [0, 0],
    block2: [0, 1],
    block3: [0, 2],
    block4: [0, 3],
    block5: [0, 4],
    block6: [0, 5],
    block7: [0, 6],
    block8: [0, 7],
    block8: [0, 9],
  });
  
  Crafty.sprite(BAZOOKA_WIDTH, BAZOOKA_HEIGHT,
    'sprites/arm_bazooka.png', {
    bazooka: [0, 0]
  });
  
  Crafty.sprite(MISSILE_WIDTH, MISSILE_HEIGHT,
    'sprites/bazooka_missile.png', {
    missile: [0, 0]
  });
  
  restarter = Crafty.e('Keyboard').bind('KeyDown', function () {
    if (this.isDown('R')) {
      if (!restartNow) {
        restart();
      }
    }
  });
}

function addActors() {
  var rand = 0;
  levelGrid = new Array(GRID_WIDTH);
  bazookas = new Array(2);
  resources = [];
  missiles = [];
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

      var b = Crafty.e('2D, DOM, block, ' + blockColor).
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

      /*resources.push(new resource(Crafty.e('2D, DOM, resource').attr({
          x: x * BLOCK_SIZE + 0.5 * (BLOCK_SIZE - RESOURCE_SIZE) + twidx,
          y: y * BLOCK_SIZE + 0.5 * (BLOCK_SIZE - RESOURCE_SIZE) + twidy,
          z: 200
      })));*/
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
                    'player1, p1anim')
      .attr({x: START_XPOS_P1, y: START_YPOS, z: 200});
  var p2 = Crafty.e('2D, DOM, player, ' +
                    'player2, p2anim')
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

function missile(node, angle) {
  this.node = node;
  this.yVel = -Math.sin(toRadians(angle)) * MISSILE_VELOCITY;
  this.xVel = -Math.cos(toRadians(angle)) * MISSILE_VELOCITY;
  this.node.rotation = angle;
  
  this.getX = function() {
    return posToGrid(this.node._x - Math.cos(toRadians(this.node.rotation))
                            * MISSILE_DIAGONAL / 2);
  };
  this.getY = function() {
    return posToGrid(this.node._y - Math.sin(toRadians(this.node.rotation))
                            * MISSILE_DIAGONAL / 2);
  };
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
  this.points = 0;
  this.xVel = 0;
  this.firing = false;
  this.firingAngle = 0;

  this.runningLeft = false;
  this.runningRight = false;
  this.miningSprite = false;

  this.groundY = this.node._y;

  this.getX = function() {
    return posToGrid(this.node._x + HALF_PLAYER_WIDTH - PLAYER_X_ADJUSTMENT);
  };
  
  this.getRightX = function() {
    return posToGrid(this.node._x - HALF_PLAYER_WIDTH + PLAYER_RIGHTX_ADJUSTMENT);
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
  missileRefresh();
  playerMove(1);
  bazookaMove(1);
  playerMove(2);
  bazookaMove(2);
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

var prevY = [];
var prevX = [];
var prevZoom = [];
function viewport() {

  if (!PLAYER1_DEAD && !PLAYER2_DEAD) {
    var curX = -1*(pspr(1)._x + pspr(2)._x)/2;
    var curY = -1*(pspr(1)._y + pspr(2)._y)/2;
    var x_scale = pspr(1)._x - pspr(2)._x;
    var y_scale = pspr(1)._y - pspr(2)._y;
    var curZoom = MAX_ZOOM - 0.0000019 *
        Math.max(x_scale * x_scale, y_scale * y_scale);

    if (curZoom < MIN_ZOOM) {
      curZoom = MIN_ZOOM;
    }
  }
  else if (!PLAYER1_DEAD) {
      var curX = -1*pspr(1)._x;
      var curY = -1*pspr(1)._y;
      var curZoom = FIXED_ZOOM;
  }
  else if (!PLAYER2_DEAD) {
      var curX = -1*pspr(2)._x;
      var curY = -1*pspr(2)._y;
      var curZoom = FIXED_ZOOM;
  }


  prevZoom.push(curZoom);
  var zoom = 0;
  for(var i = 0; i < prevZoom.length; i++) {
    zoom += prevZoom[i];
  }
  zoom /= prevZoom.length;
  if (prevZoom.length >= ZOOM_AVERAGE) {
    prevZoom.shift();
  }


  curX += (PLAYGROUND_WIDTH/(zoom*0.73))/2;
  curY += (PLAYGROUND_HEIGHT/(zoom*0.75))/2;

  if (curX > 0)
      curX = 0;
  if (curX < DISPLAY_WIDTH*(1-zoom) )
      curX = DISPLAY_WIDTH*(1-zoom);

  if (curY > 0)
      curY = 0;
  if (curY < DISPLAY_HEIGHT*(1-zoom) )
      curY = DISPLAY_HEIGHT*(1-zoom);

  prevY.push(curY);
  var y = 0;
  for(var i = 0; i < prevY.length; i++) {
    y += prevY[i];
  }
  y /= prevY.length;
  if (prevY.length >= CAM_Y_AVERAGE) {
    prevY.shift();
  }

  prevX.push(curX);
  var x = 0;
  for(var i = 0; i < prevX.length; i++) {
    x += prevX[i];
  }
  x /= prevX.length;
  if (prevX.length >= CAM_Y_AVERAGE) {
    prevX.shift();
  }

  Crafty.viewport.scale((zoom*0.286)/Crafty.viewport._zoom);
  Crafty.viewport.x = x;
  Crafty.viewport.y = y;
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

function missileRefresh() {
  for (var n = 0; n < missiles.length; n++) {
    var missile = missiles[n];
    var mspr = missile.node;
    
    mXGrid = missile.getX();
    mYGrid = missile.getY();
    
    if (lg(mXGrid, mYGrid) && lg(mXGrid, mYGrid).node) {
      for (var a = -EXPLOSION_RADIUS; a <= EXPLOSION_RADIUS; a++) {
        if ((mXGrid + a < 0) || (mXGrid + a > GRID_WIDTH))
          continue;
        for (var b = -EXPLOSION_RADIUS; b <= EXPLOSION_RADIUS; b++) {
          if ((mYGrid + b < 0) || (mYGrid + b > GRID_HEIGHT))
            continue;
          if (lg(mXGrid + a, mYGrid + b) && lg(mXGrid + a, mYGrid + b).node) {
            lg(mXGrid + a, mYGrid + b).node.destroy();
            levelGrid[mXGrid + a][mYGrid + b] = new block(null, null, null);
          }
        }
      }
      mspr.destroy();
      missiles.pop(n);
      continue;
    }
    if (mspr._x > PLAYGROUND_WIDTH || mspr._x < 0 ||
        mspr._y > PLAYGROUND_HEIGHT) {
      mspr.destroy();
      missiles.pop(n);
      continue;
    }
    mspr.x = mspr._x + missile.xVel;
    mspr.y = mspr._y + missile.yVel;
    
    missile.yVel += GRAVITY_ACCEL;
    mspr.rotation = Math.atan2(-missile.yVel, -missile.xVel)
                    * 360 / 2 / Math.PI;
  }
}

function bazookaMove(player) {
  if (!p(player).firing)
    return;

  var clockwise = 0;
  var counterClock = 0;
  switch (player) {
   case 1:
    clockwise = Crafty.keys['D'];
    counterClock = Crafty.keys['A'];
    break;
   case 2:
    clockwise = Crafty.keys['L'];
    counterClock = Crafty.keys['J'];
    break;
  }
  if (Crafty.keydown[clockwise]) {
    p(player).firingAngle += 5;
  }
  if (Crafty.keydown[counterClock]) {
    p(player).firingAngle -= 5;
  }
  p(player).firingAngle += 360;
  p(player).firingAngle %= 360;

  if (p(player).firingAngle > 90 && p(player).firingAngle < 270) {
    pspr(player).flip('X');
    baz(player).node.flip('Y');
  }
  else {
    pspr(player).unflip('X');
    baz(player).node.unflip('Y');
  }
  baz(player).node.rotation = (p(player).firingAngle);
  var bazookaTargetCenterX = pspr(player)._x + HALF_PLAYER_WIDTH;
  var bazookaTargetCenterY = pspr(player)._y + .3 * PLAYER_HEIGHT;
  var bazookaOffsetX =
    Math.cos(toRadians(p(player).firingAngle))
    * BAZOOKA_DIAGONAL / 2;
  var bazookaOffsetY =
    Math.sin(toRadians(p(player).firingAngle))
    * BAZOOKA_DIAGONAL / 2;
  baz(player).node.x = bazookaTargetCenterX - bazookaOffsetX;
  baz(player).node.y = bazookaTargetCenterY - bazookaOffsetY;
}

function missileFire(player) {
  var startX = p(player).node._x + HALF_PLAYER_WIDTH
    - MISSILE_STARTX_OFFSET
    * Math.cos(toRadians(p(player).firingAngle));
  var startY = p(player).node._y + .3 * PLAYER_HEIGHT
    - Math.sin(toRadians(p(player).firingAngle))
    * MISSILE_STARTY_OFFSET;
  if (pspr(player)._flipX) {
    startX += MISSILE_FLIP_OFFSET
    startY += MISSILE_FLIP_OFFSET;
  }
  var m = new missile(Crafty.e('2D, DOM, missile').attr({
          x: startX,
          y: startY,
          z: 200
      }), p(player).firingAngle);
  missiles.push(m);
  p(player).firingAngle = 0;
  if (baz(player) && baz(player).node)
    baz(player).node.destroy();
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
    left = Crafty.keys['J'];
    right = Crafty.keys['L'];
    up = Crafty.keys['I'];
    dig = Crafty.keys['K'];
    fire = Crafty.keys['N'];
    break;
  }
  if (p(player).firing) {
    if (!Crafty.keydown[fire]) {
      missileFire(player);
      p(player).firing = false;
    }
  }
  else if (Crafty.keydown[fire]) {
    ENABLE_CREEPING = true;
    p(player).firing = true;
    if (!pspr(player)._flipX) {
      p(player).firingAngle = INITIAL_FIRE_ANGLE;
    }
    else {
      p(player).firingAngle = 180 - INITIAL_FIRE_ANGLE;
    }
    bazookas[player - 1] = new bazooka(Crafty.e('2D, DOM, bazooka').attr({
          x: pspr(player)._x,
          y: pspr(player)._y,
          z: 200
      }), player);
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
        }
        pspr(player).x = elem.node._x + BLOCK_SIZE;
      }
    }
    if (!p(player).runningLeft) {
      pspr(player).unflip('X');
      pspr(player).stop().animate('walk', 12, -1);
      p(player).runningLeft = true;
      p(player).runningRight = false;
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
        }
        pspr(player).x = elem.node._x - PLAYER_WIDTH;
      }
    }
    if (!p(player).runningRight) {
      pspr(player).flip('X');
      pspr(player).stop().animate('walk', 12, -1);
      p(player).runningRight = true;
      p(player).runningLeft = false;
    }
    isRunning = true;
    p(player).xVel -= Math.min(p(player).xVel, DRAG_VELOCITY);
  }
  if (Crafty.keydown[up] && !p(player).firing) {
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
  if (Crafty.keydown[dig] && !p(player).firing) {
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

  if (!PLAYER_INAIR[player - 1])
      p(player).groundY = pspr(player)._y;
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
  if (!Crafty.keydown[73] &&
      !Crafty.keydown[74] &&
      !Crafty.keydown[76]) {
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
  for (a = 0; a < missiles.length; a++) {
    var missile = missiles[a];
    if (missile.node != null)
      missile.node.destroy();
  }
  
  if (baz(1) != null && baz(1).node != null)
    baz(1).node.destroy();
  if (baz(2) != null && baz(2).node != null)
    baz(2).node.destroy();
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
    restartNow = true;
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
