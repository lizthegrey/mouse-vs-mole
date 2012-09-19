var BLOCK_SIZE = 20;
var PLAYER_SIZE = 15;
var NUM_COLORS = 4;

var GRID_WIDTH = 40;
var GRID_HEIGHT = 30;

var PLAYGROUND_WIDTH = BLOCK_SIZE * GRID_WIDTH;
var PLAYGROUND_HEIGHT = BLOCK_SIZE * GRID_HEIGHT;

// Where is the mystery +5 coming from? -lizf
// I wanted it to be symmetric starting locations (for START_XPOS_P2),
// and for the players to start on a block instead of about to fall onto one.
// Fixed now, you can see where the +5 came from. --fluffy
var START_XCOORD_P1 = 2;
var START_XPOS_P1 = START_XCOORD_P1 * BLOCK_SIZE;
var START_XCOORD_P2 = 37;
var START_XPOS_P2 = START_XCOORD_P2 * BLOCK_SIZE + (BLOCK_SIZE-PLAYER_SIZE);
var START_YCOORD = 14;
var START_YPOS = BLOCK_SIZE * START_YCOORD + (BLOCK_SIZE-PLAYER_SIZE);

var GRAVITY_ACCEL = 0.5; // pixels/s^2 (down is positive)
var JUMP_VELOCITY = -7;   // pixels/s
var MOVE_VELOCITY = 2;

var DEATH_VELOCITY = 9;

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
  for (var x = 0; x < GRID_WIDTH; x++) {
    for (var y = 0; y < GRID_HEIGHT; y++) {
      if (y == START_YCOORD &&
          (x == START_XCOORD_P1 || x == START_XCOORD_P2)) {
        // Player start position
        continue;
      }
      rand = Math.floor(Math.random() * 4);
      thisBlock = block_sprites[rand];
      $('#actors').addSprite('block' + x + ',' + y, {
          animation: thisBlock,
          height: BLOCK_SIZE, width: BLOCK_SIZE,
          posx: x * BLOCK_SIZE, posy: y * BLOCK_SIZE});
    } 
  }
}

function player(node, playerNum, xpos, ypos) {
  this.node = node;
  this.playerNum = playerNum;
  this.yVel = 0;
  this.player = new $.gameQuery.Animation({
      imageURL: 'sprites/Player' + this.playerNum + '.png'});
  return true;
}

function addFunctionality() {
  $.playground().registerCallback(function() {
        playerMove(1);
        playerMove(2);
        verticalMovement(1);
        verticalMovement(2);},
      30);
}

function playerMove(player) {
  if (($.gameQuery.keyTracker[65] && player == 1) ||
      ($.gameQuery.keyTracker[37] && player == 2)) {
    // this is left
    var nextpos = parseInt($('#player' + player).x()) - MOVE_VELOCITY;
    // replace with collision detector
    if (nextpos > 0) {
      $('#player' + player).x(nextpos);
    }
  }
  if (($.gameQuery.keyTracker[68] && player == 1) ||
      ($.gameQuery.keyTracker[39] && player == 2)) {
    //this is right (d)
    var nextpos = parseInt($('#player' + player).x()) + MOVE_VELOCITY;
    //replace with collision detector
    if (nextpos < PLAYGROUND_WIDTH - BLOCK_SIZE) {
      $('#player' + player).x(nextpos);
    }
  }
  if (($.gameQuery.keyTracker[87] && player == 1) ||
  	   ($.gameQuery.keyTracker[38] && player == 2)) {
  	 // the following condition should be replaced with collision detector
  	 // (checking below the player to make sure there's a floor)
  	 if (!validMovement(parseInt($('#player' + player).y()) + 1)) {
  	   $('#player' + player)[0].player.yVel = JUMP_VELOCITY;
  	 }
  }
}

function verticalMovement(player) {
	// replace the condition with collision detection
   while (!validMovement(parseInt($('#player' + player).y()) +
          $('#player' + player)[0].player.yVel)) {
     if ($('#player' + player)[0].player.yVel > 0) {
       if ($('#player' + player)[0].player.yVel > DEATH_VELOCITY) {
         //player crashed into ground, insert player death here
       }
       $('#player' + player)[0].player.yVel -= GRAVITY_ACCEL;
     }
     else {
       $('#player' + player)[0].player.yVel += GRAVITY_ACCEL;
     }
   }
   var nextpos = parseInt($('#player' + player).y()
                 + $('#player' + player)[0].player.yVel);
   $('#player' + player).y(nextpos);
   
   $('#player' + player)[0].player.yVel += GRAVITY_ACCEL;
}

// Replace this entire function with collision detection.
// This is intended ONLY AS AN EXAMPLE (for jumping purposes).
function validMovement(y) { 
   if (y > START_YPOS) return false;
   return true;
}

$(document).ready(function() {
  buildPlayground();
  addBackground();
  addActors();
  addFunctionality();
  $.playground().startGame();
});
