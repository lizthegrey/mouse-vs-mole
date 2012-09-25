var BLOCK_SIZE = 20;
var PLAYER_SIZE = 15;
var RESOURCE_SIZE = 20;
var NUM_COLORS = 3;

var GRID_WIDTH = 40;
var GRID_HEIGHT = 30;

var PLAYGROUND_WIDTH = BLOCK_SIZE * GRID_WIDTH;
var PLAYGROUND_HEIGHT = BLOCK_SIZE * GRID_HEIGHT;

// XPOS_P2 and YPOS get a modifier based on sizes to make the board symmetric
// and to begin with a block for a floor
var START_XCOORD_P1 = 2;
var START_XPOS_P1 = START_XCOORD_P1 * BLOCK_SIZE;
var START_XCOORD_P2 = 37;
var START_XPOS_P2 = START_XCOORD_P2 * BLOCK_SIZE + (BLOCK_SIZE - PLAYER_SIZE);
var START_YCOORD = 14;
var START_YPOS = BLOCK_SIZE * START_YCOORD + (BLOCK_SIZE - PLAYER_SIZE);

var GRAVITY_ACCEL = 1.0; // pixels/s^2 (down is positive)
var JUMP_VELOCITY = -9;   // pixels/s
var MOVE_VELOCITY = 2;

var WINNING_POINTS = 35;

var OUCH_VELOCITY = 12;
var OUCH_DIVIDER = 3;

var DAMAGE_TO_EXPLODE = 4;

var RESOURCE_PROBABILITY = 0.1; // probably any block has a resource in it

var BG_MUSIC = 'sounds/casual_bg.ogg';
var PLAYER1_RUN = 'sounds/running.ogg';
var PLAYER2_RUN = 'sounds/running_diff.ogg';
var BLOCK_BREAK = 'sounds/crunches.ogg';

var PLAYER1_RUNNING = false;
var PLAYER2_RUNNING = false;

var levelGrid; // 2D array containing block objects

var resourceGrid; //2D array containing resource objects

var nonEmptyResources; //1D Array containing resourceGrid locations

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
      width: PLAYER_SIZE, height: PLAYER_SIZE});
  $('#actors').addGroup('player2', {
      posx: START_XPOS_P2, posy: START_YPOS,
      width: PLAYER_SIZE, height: PLAYER_SIZE});
  $('#actors').addGroup('blocks');
  $('#actors').addGroup('resources');
  var player1 = new player($('#player1'), 1,
                           START_XPOS_P1, START_YPOS);
  var player2 = new player($('#player2'), 2,
                           START_XPOS_P2, START_YPOS);
  $('#player1').addSprite('player1spr', {
      animation: player1.player,
      height: PLAYER_SIZE, width: PLAYER_SIZE,
      posx: 0, posy: 0});
  $('#player2').addSprite('player2spr', {
      animation: player2.player,
      height: PLAYER_SIZE, width: PLAYER_SIZE,
      posx: 0, posy: 0});
  $('#player1')[0].player = player1;
  $('#player2')[0].player = player2;

  var block_sprites = [];
  for (var i = 0; i < NUM_COLORS; i++) {
    block_sprites[i] = new $.gameQuery.Animation({
        imageURL: 'sprites/Block' + (i + 1) + '.png'});
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

  resourceGrid = new Array(GRID_WIDTH);
  nonEmptyResources = [];
  for (var x = 0; x < GRID_WIDTH; x++) {
    resourceGrid[x] = new Array(GRID_HEIGHT);
    for (var y = 0; y < GRID_HEIGHT; y++) {
      if (y == START_YCOORD &&
          (x == START_XCOORD_P1 || x == START_XCOORD_P2)) {
        resourceGrid[x][y] = new resource(null);
        continue;
      }
      rand = Math.random();
      if (rand > RESOURCE_PROBABILITY) {
        resourceGrid[x][y] = new resource(null);
        continue;
      }

      $('#resources').addSprite('resource' + x + '-' + y, {
          animation: resource_sprite,
          height: RESOURCE_SIZE, width: RESOURCE_SIZE,
          posx: x * BLOCK_SIZE + 0.5 * (BLOCK_SIZE - RESOURCE_SIZE),
          posy: y * BLOCK_SIZE + 0.5 * (BLOCK_SIZE - RESOURCE_SIZE)});

      resourceGrid[x][y] = new resource($('#resource' + x + '-' + y));

      nonEmptyResources.push([x, y]);
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

  this.getX = function() {
    return posToGrid(this.node.x());
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
    playerStop(1);
    playerStop(2);
    removeDestroyed();
    verticalMovement(1);
    verticalMovement(2);
    resourceRefresh();
  }, 30);
}

function checkCollision(player, x, y) {
  var collided = false;
  if (levelGrid[x][y].node != null) {
    var collisions = p(player).collision(
        '#' + levelGrid[x][y].node.attr('id') +
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
  if ((px + PLAYER_SIZE > rx && px < rx + RESOURCE_SIZE) ||
      (px < rx + RESOURCE_SIZE && px + PLAYER_SIZE >= rx)) {
    if ((py + PLAYER_SIZE >= ry && py <= ry + RESOURCE_SIZE) ||
        (py <= ry + RESOURCE_SIZE && py + PLAYER_SIZE >= ry)) {
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
    var nextpos = parseInt(p(player).x()) - MOVE_VELOCITY;
    if (nextpos > 0) {
      if (!levelGrid[x - 1][y].node ||
          nextpos > levelGrid[x - 1][y].node.x() + BLOCK_SIZE) {
        p(player).x(nextpos);
      } else {
        if (levelGrid[x - 1][y] && levelGrid[x - 1][y].node) {
          levelGrid[x - 1][y].damage++;
        }
        p(player).x(levelGrid[x - 1][y].node.x() + BLOCK_SIZE);
      }
    }
    isRunning = true;
  }
  if ($.gameQuery.keyTracker[right]) {
    var nextpos = parseInt(p(player).x()) + MOVE_VELOCITY;
    if (nextpos < PLAYGROUND_WIDTH - BLOCK_SIZE) {
      if (!levelGrid[x + 1][y].node ||
          nextpos < levelGrid[x + 1][y].node.x() - PLAYER_SIZE) {
        p(player).x(nextpos);
      } else {
        if (levelGrid[x + 1][y] && levelGrid[x + 1][y].node) {
          levelGrid[x + 1][y].damage++;
        }
        p(player).x(levelGrid[x + 1][y].node.x() - PLAYER_SIZE);
      }
    }
    isRunning = true;
  }
  if ($.gameQuery.keyTracker[up]) {
    if (levelGrid[x][y + 1] && levelGrid[x][y + 1].node &&
        p(player).y() == levelGrid[x][y + 1].node.y() - PLAYER_SIZE) {
      p(player)[0].player.yVel = JUMP_VELOCITY;
    }
    isRunning = true;
  }
  if ($.gameQuery.keyTracker[dig]) {
    // Dig down.
    if (levelGrid[x][y + 1] && levelGrid[x][y + 1].node) {
      levelGrid[x][y + 1].damage++;
    }
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
    if (!levelGrid[x][y + 1] || !levelGrid[x][y + 1].node ||
        nextpos < levelGrid[x][y + 1].node.y() - PLAYER_SIZE) {
      p(player).y(nextpos);
      p(player)[0].player.yVel += GRAVITY_ACCEL;
    } else {
      p(player).y(levelGrid[x][y + 1].node.y() - PLAYER_SIZE);

      if (Math.abs(p(player)[0].player.yVel) > OUCH_VELOCITY) {
          updatePoints(player, -1*Math.abs(p(player)[0].player.yVel)/(OUCH_DIVIDER));
      }

      p(player)[0].player.yVel = 0;
    }
  } else {
    if (!levelGrid[x][y - 1] || !levelGrid[x][y - 1].node ||
        nextpos > levelGrid[x][y - 1].node.y() + BLOCK_SIZE) {
      p(player).y(nextpos);
      p(player)[0].player.yVel += GRAVITY_ACCEL;
    } else {
      if (levelGrid[x][y - 1] && levelGrid[x][y - 1].node) {
        levelGrid[x][y - 1].damage++;
      }
      p(player).y(levelGrid[x][y - 1].node.y() + BLOCK_SIZE);
      p(player)[0].player.yVel = 0;
    }
  }
}

/* Function to stop sound upon player no longer moving */
function playerStop(player) {
  if (player == 1 && PLAYER1_RUNNING) {
    if (!$.gameQuery.keyTracker[65] &&
        !$.gameQuery.keyTracker[68] &&
        !$.gameQuery.keyTracker[87]) {
      PLAYER1_RUNNING = false;
      $('#player1').pauseSound();
    }
  } else if (player == 2 && PLAYER2_RUNNING) {
    if (!$.gameQuery.keyTracker[37] &&
        !$.gameQuery.keyTracker[38] &&
        !$.gameQuery.keyTracker[39]) {
      PLAYER2_RUNNING = false;
      $('#player2').pauseSound();
    }
  }
}

function resourceRefresh() {
  for (var n = 0; n < nonEmptyResources.length; n++) {
    var resourceLoc = nonEmptyResources[n];
    var resource = resourceGrid[resourceLoc[0]][resourceLoc[1]];
    var x = resource.getX();
    var y = resource.getY();

    if (levelGrid[x][y] && levelGrid[x][y].node) {
      // Elements inside an unbroken block can neither fall nor be picked up.
      continue;
    }

    var nextpos = parseInt(resource.node.y() + resource.yVel);
    if (resource.yVel >= 0) {
      if (!levelGrid[x][y + 1] || !levelGrid[x][y + 1].node ||
          nextpos < levelGrid[x][y + 1].node.y() - RESOURCE_SIZE) {
        resource.node.y(nextpos);
        resource.yVel += GRAVITY_ACCEL;
      } else {
        resource.node.y(levelGrid[x][y + 1].node.y() - RESOURCE_SIZE);
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
          nonEmptyResources.splice(n, 1);
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
  if (points > WINNING_POINTS)
      points = WINNING_POINTS;
  else if (points < 0)
      points = 0;

  $('#pts'+playerNum).animate({'height':
      (100 - (points/WINNING_POINTS)*100)+'%'}, 300);

  p(playerNum)[0].player.points = points;
}

// Returns the player object associated with a player number.
function p(n) {
  return $('#player' + n);
}

function maybeChain(x, y, type) {
  if (levelGrid[x] && levelGrid[x][y] &&
      levelGrid[x][y].blockType == type) {
    levelGrid[x][y].damage = DAMAGE_TO_EXPLODE;
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
