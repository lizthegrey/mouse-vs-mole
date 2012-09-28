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

var POINT_RAMPING = 13;

var ENABLE_CREEPING = false;
var CREEPING_DEATH_MS = 10000;

var RESOURCE_PROBABILITY = 0.05; // probably any block has a resource in it
var NUM_RESOURCES = 0;
var SPRITE_GRAPHIC_INDEXES = Array(2, 8, 6, 3);

var BG_MUSIC = 'sounds/casual_bg.ogg';
var PLAYER1_RUN = 'sounds/running.ogg';
var PLAYER2_RUN = 'sounds/running_diff.ogg';
var BLOCK_BREAK = 'sounds/crunches.ogg';

var PLAYER1_RUNNING = false;
var PLAYER2_RUNNING = false;

var levelGrid; // 2D array containing block objects

var resources; // resource objects

var should_creep = false;
var death_y = GRID_HEIGHT; // tracks the creeping death.


function buildPlayground() {
  $('#game').playground({
      height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH,
      keyTracker: true});

  $.playground().addGroup('background', {
      height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH});
  $.playground().addGroup('actors', {
      height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH});
}

function addBackground() {
  var background1 = new $.gameQuery.Animation({
      imageURL: 'sprites/800x600.png'});
  $('#background').addSprite('background1', {
      animation: background1,
      height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH});
}

function addActors() {
  $('#actors').addGroup('player1', {
      posx: START_XPOS_P1, posy: START_YPOS,
      width: PLAYER_WIDTH, height: PLAYER_HEIGHT});
  $('#actors').addGroup('player2', {
      posx: START_XPOS_P2, posy: START_YPOS,
      width: PLAYER_WIDTH, height: PLAYER_HEIGHT});
  $('#actors').addGroup('blocks');
  $('#actors').addGroup('resources');
  var player1 = new player($('#player1'), 1,
                           START_XPOS_P1, START_YPOS);
  var player2 = new player($('#player2'), 2,
                           START_XPOS_P2, START_YPOS);
  $('#player1').addSprite('player1spr', {
      animation: player1.player,
      height: PLAYER_HEIGHT, width: PLAYER_WIDTH,
      posx: 0, posy: 0});
  $('#player2').addSprite('player2spr', {
      animation: player2.player,
      height: PLAYER_HEIGHT, width: PLAYER_WIDTH,
      posx: 0, posy: 0});
  $('#player1')[0].player = player1;
  $('#player2')[0].player = player2;

  var block_sprites = [];
  for (var i = 0; i < NUM_COLORS; i++) {
    block_sprites[i] = new $.gameQuery.Animation({
        imageURL: 'sprites/Block' + SPRITE_GRAPHIC_INDEXES[i] + '.png'});
  }

  var rand = 0;
  var thisBlock = block_sprites[0];

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
      thisBlock = block_sprites[rand];

      $('#blocks').addSprite('block' + x + '-' + y, {
          animation: thisBlock,
          height: BLOCK_SIZE, width: BLOCK_SIZE,
          posx: x * BLOCK_SIZE, posy: y * BLOCK_SIZE});

      levelGrid[x][y] = new block($('#block' + x + '-' + y), rand, 0);
    }
  }

  var resource_sprite = new $.gameQuery.Animation({
      imageURL: 'sprites/Resource.png'});

  resources = [];
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

      $('#resources').addSprite('resource' + x + '-' + y, {
          animation: resource_sprite,
          height: RESOURCE_SIZE, width: RESOURCE_SIZE,
          posx: x * BLOCK_SIZE + 0.5 * (BLOCK_SIZE - RESOURCE_SIZE) + twidx,
          posy: y * BLOCK_SIZE + 0.5 * (BLOCK_SIZE - RESOURCE_SIZE) + twidy
      });

      resources.push(new resource($('#resource' + x + '-' + y)));
      NUM_RESOURCES += 1;
    }
  }
}

/* Block initializes sounds in gameworld */
function addSounds() {
  var bgMusic = new $.gameQuery.SoundWrapper(BG_MUSIC, true);
  var player1Run = new $.gameQuery.SoundWrapper(PLAYER1_RUN, true);
  var player2Run = new $.gameQuery.SoundWrapper(PLAYER2_RUN, true);
  var blockBreak = new $.gameQuery.SoundWrapper(BLOCK_BREAK, true);
  $('#background').addSound(bgMusic, false);
  $('#player1').addSound(player1Run, false);
  $('#player2').addSound(player2Run, false);
  // We will want another object to play block breaking sounds
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
    return posToGrid(this.node.x());
  }
  this.getY = function() {
    return posToGrid(this.node.y());
  };
}

function player(node, playerNum, xpos, ypos) {
  this.node = node;
  this.playerNum = playerNum;
  this.yVel = 0;
  this.points = 0;
  this.player = new $.gameQuery.Animation({
      imageURL: 'sprites/Player' + this.playerNum + '.png'});

  this.playerWalkLeft = new $.gameQuery.Animation({
      imageURL: 'sprites/Player' + this.playerNum + '-Walk.png',
      numberOfFrame: 4, delta: 11, rate: 60,
      type: $.gQ.ANIMATION_HORIZONTAL});

  this.playerWalkRight = new $.gameQuery.Animation({
      imageURL: 'sprites/Player' + this.playerNum + '-Walk.png',
      numberOfFrame: 4, delta: 11, rate: 60,
      type: $.gQ.ANIMATION_HORIZONTAL});

  this.playerJump = new $.gameQuery.Animation({
      imageURL: 'sprites/Player' + this.playerNum + '-Jump.png'});

  this.runningLeft = false;
  this.runningRight = false;
  this.miningSprite = false;

  this.getX = function() {
    return posToGrid(this.node.x() - 4);
  };

  this.getY = function() {
    return posToGrid(this.node.y());
  };

  return true;
}

function posToGrid(pos) {
  return Math.round(pos / BLOCK_SIZE);
}

function addFunctionality() {
  $.playground().registerCallback(function() {
    playerMove(1);
    playerMove(2);
    playerStop();
    deathFromBelow();
    removeDestroyed();
    verticalMovement(1);
    verticalMovement(2);
    resourceRefresh();
    restart(false);
    gameOver();
  }, 30);
  $.playground().registerCallback(function() {
    if (ENABLE_CREEPING)
        should_creep = true;
  }, CREEPING_DEATH_MS);
}

function checkCollision(player, x, y) {
  var collided = false;
  var elem = lg(x, y);
  if (!elem || elem.node != null) {
    var collisions = p(player).collision(
        '#' + elem.node.attr('id') +
        ',#blocks,#actors');
    if (collisions.size() > 0) {
      collided = true;
    }
  }

  return collided;
}

//did a player get the resource we are updating?
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
    left = 65;
    right = 68;
    up = 87;
    dig = 83;
    break;
   case 2:
    left = 37;
    right = 39;
    up = 38;
    dig = 40;
    break;
  }

  var x = p(player)[0].player.getX();
  var y = p(player)[0].player.getY();

  var isRunning = false;

  if ($.gameQuery.keyTracker[left]) {
    ENABLE_CREEPING = true;

    var nextpos = parseInt(p(player).x()) - MOVE_VELOCITY;
    var elem = lg(x - 1, y);

    if (nextpos > 0) {
      if (!elem || !elem.node ||
          nextpos > elem.node.x() + BLOCK_SIZE) {
        p(player).x(nextpos);
      } else {
        if (elem && elem.node) {
          elem.damage += DAMAGE_COLLIDE;
        }
        p(player).x(elem.node.x() + BLOCK_SIZE);
      }
    }
    if (!p(player)[0].player.runningLeft) {
      pspr(player).setAnimation(p(player)[0].player.playerWalkLeft);
      pspr(player).fliph(false);
      p(player)[0].player.runningLeft = true;
      p(player)[0].player.runningRight = false;
    }
    isRunning = true;
  }
  if ($.gameQuery.keyTracker[right]) {
    ENABLE_CREEPING = true;
    var nextpos = parseInt(p(player).x()) + MOVE_VELOCITY;
    var elem = lg(x + 1, y);

    if (nextpos < PLAYGROUND_WIDTH - BLOCK_SIZE) {
      if (!elem || !elem.node ||
          nextpos < elem.node.x() - PLAYER_WIDTH) {
        p(player).x(nextpos);
      } else {
        if (elem && elem.node) {
          elem.damage += DAMAGE_COLLIDE;
        }
        p(player).x(elem.node.x() - PLAYER_WIDTH);
      }
    }
    if (!p(player)[0].player.runningRight) {
      pspr(player).setAnimation(p(player)[0].player.playerWalkRight);
      pspr(player).fliph(true);
      p(player)[0].player.runningRight = true;
      p(player)[0].player.runningLeft = false;
    }
    isRunning = true;
  }
  if ($.gameQuery.keyTracker[up]) {
    ENABLE_CREEPING = true;
    // Ensure the player is standing on solid ground.
    var elem = lg(x, y + 1);
    if (elem && elem.node &&
        p(player).y() == elem.node.y() - PLAYER_HEIGHT) {
      p(player)[0].player.yVel = JUMP_VELOCITY;
    }
    isRunning = true;
  }
  if ($.gameQuery.keyTracker[dig]) {
    ENABLE_CREEPING = true;
    // Dig down.
    var elem = lg(x, y + 1);
    if (elem && elem.node) {
      elem.damage += DAMAGE_DIG;
    }
    p(player)[0].player.runningLeft = false;
    p(player)[0].player.runningRight = false;
  }
  if (player == 1 && isRunning && !PLAYER1_RUNNING) {
    // console.log("Player 1 begun walking");
    $('#player1').playSound();
    PLAYER1_RUNNING = true;
  }
  if (player == 2 && isRunning && !PLAYER2_RUNNING) {
    // console.log("Player 2 begun walking");
    $('#player2').playSound();
    PLAYER2_RUNNING = true;
  }
}

function verticalMovement(player) {
  var x = p(player)[0].player.getX();
  var y = p(player)[0].player.getY();

  var nextpos = parseInt(p(player).y() + p(player)[0].player.yVel);
  if (p(player)[0].player.yVel >= 0) {
    var elem = lg(x, y + 1);
    if (!elem || !elem.node ||
        nextpos < elem.node.y() - PLAYER_HEIGHT) {
      p(player).y(nextpos);
      p(player)[0].player.yVel += GRAVITY_ACCEL;
      pspr(player).setAnimation(p(player)[0].player.playerJump);
      p(player)[0].player.miningSprite = false;
      p(player)[0].player.runningLeft = false;
      p(player)[0].player.runningRight = false;
    } else {
      p(player).y(elem.node.y() - PLAYER_HEIGHT);

      if (Math.abs(p(player)[0].player.yVel) > OUCH_VELOCITY) {
          updatePoints(player, -1 * Math.abs(p(player)[0].player.yVel) /
             (OUCH_DIVIDER));
      }

      p(player)[0].player.yVel = 0;
    }
  } else {
    var elem = lg(x, y - 1);
    if (!elem || !elem.node ||
        nextpos > elem.node.y() + BLOCK_SIZE) {
      if (nextpos < 0) {
        nextpos = 0;
      }
      p(player).y(nextpos);
      p(player)[0].player.yVel += GRAVITY_ACCEL;
      pspr(player).setAnimation(p(player)[0].player.playerJump);
      p(player)[0].player.miningSprite = false;
      p(player)[0].player.runningLeft = false;
      p(player)[0].player.runningRight = false;
    } else {
      if (elem && elem.node) {
        elem.damage += DAMAGE_JUMP;
      }
      p(player).y(elem.node.y() + BLOCK_SIZE);
      p(player)[0].player.yVel = 0;
    }
  }
}

/* Function to stop sound upon player no longer moving */
/* Also changes player animation back to standing still */
function playerStop() {
  if (!$.gameQuery.keyTracker[65] &&
      !$.gameQuery.keyTracker[68] &&
      !$.gameQuery.keyTracker[87]) {
    if (PLAYER1_RUNNING) {
      PLAYER1_RUNNING = false;
      $('#player1').pauseSound();
    }
    pspr(1).setAnimation(p(1)[0].player.player);
    p(1)[0].player.miningSprite = false;
    p(1)[0].player.runningLeft = false;
    p(1)[0].player.runningRight = false;
  }
  if (!$.gameQuery.keyTracker[37] &&
      !$.gameQuery.keyTracker[38] &&
      !$.gameQuery.keyTracker[39]) {
    if (PLAYER2_RUNNING) {
      PLAYER2_RUNNING = false;
      $('#player2').pauseSound();
    }
    pspr(2).setAnimation(p(2)[0].player.player);
    p(2)[0].player.miningSprite = false;
    p(2)[0].player.runningLeft = false;
    p(2)[0].player.runningRight = false;
  }
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

    var nextpos = parseInt(resource.node.y() + resource.yVel);
    if (resource.yVel >= 0) {
      var elem = lg(x, y + 1);
      if (!elem || !elem.node ||
          nextpos < elem.node.y() - RESOURCE_SIZE) {
        resource.node.y(nextpos);
        resource.yVel += GRAVITY_ACCEL;
      } else {
        resource.node.y(elem.node.y() - RESOURCE_SIZE);
        resource.yVel = 0;
      }
    }

    var rx = resource.node.x();
    var ry = resource.node.y();

    var popped = false;
    for (var playerNum = 1; playerNum <= 2; playerNum++) {
      var px = p(playerNum).x();
      var py = p(playerNum).y();
      if (resourceGet(rx, ry, px, py)) {
        if (!popped) {
          resources.splice(n, 1);
        }
        updatePoints(playerNum, 1);
        popped = true;
        // I thought about having a break statement in here, but if the players
        // are occupying the same space, they both deserve the points for a
        // resource as it falls on them.
      }
    }
    if (popped) {
      resource.node.remove();
    }
  }
}

function updatePoints(playerNum, pointsInc) {
  points = p(playerNum)[0].player.points + pointsInc;
  if (points > WINNING_POINTS) {
    points = WINNING_POINTS;
  } else if (points < 0) {
      points = 0;
  }

  var h = Math.atan(points / POINT_RAMPING) / (Math.PI / 2);
  $('#pts' + playerNum).animate({'height':
      100 - h * 100 + '%'}, 300);

  p(playerNum)[0].player.points = points;
}

// Returns the player object associated with a player number.
function p(n) {
  return $('#player' + n);
}

// Returns the sprite object associated with a player number.
function pspr(n) {
  return $('#player' + n + 'spr');
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
          levelGrid[x][y].node.remove();
          levelGrid[x][y] = new block(null, null, null);

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
      levelGrid[x][death_y].node.remove();
      levelGrid[x][death_y] = new block(null, null, null);
    }
  }
  should_creep = false;
}

function restart(bool) {
  if (bool || $.gameQuery.keyTracker[82]) {
    $('#text').remove();
    $.playground().clearAll(true);
    buildPlayground();
    addBackground();
    addActors();
    addSounds();
    addFunctionality();
    $.playground().startGame();
  }
}

function gameOver() {
  if (p(1).y() > PLAYGROUND_HEIGHT &&
      p(2).y() > PLAYGROUND_HEIGHT) {
    var pl = 0;
    if (p(1)[0].player.points > p(2)[0].player.points) pl = 1;
    else if (p(1)[0].player.points < p(2)[0].player.points) pl = 2;

    updatePoints(1, -1 * p(1)[0].player.points);
    updatePoints(2, -1 * p(2)[0].player.points);

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
        restart(true); }, 3000);
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

$(document).ready(function() {
  buildPlayground();
  addBackground();
  addActors();
  addSounds();
  addFunctionality();
  $.playground().startGame();
  //$('#background').playSound();
  //console.log("testing sound");
});
