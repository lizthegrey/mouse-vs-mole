var PLAYGROUND_HEIGHT = 600;
var PLAYGROUND_WIDTH = 800;

function buildPlayground() {
    $('#game').playground({height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH, keyTracker: true});

    $.playground().addGroup("background", {height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH});
    $.playground().addGroup("actors", {height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH});
}

function addBackground() {
    var background1 = new $.gameQuery.Animation({imageURL: "sprites/800x600.png"});
    $('#background').addSprite("background1", {animation: background1, height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH});
}

function addActors() {
	$('#actors').addGroup("player1",{posx: 40,posy:285,width:15,height:15});
	$('#actors').addGroup("player2",{posx: 745,posy:285,width:15,height:15});
	var player1 = new player($("#player1"),1,40,285);
	var player2 = new player($("#player2"),2,745,285);
	$('#player1')
		.addSprite("player1spr", {animation: player1.player, height: 15, width: 15, posx: 0, posy: 0});
	$('#player2')
		.addSprite("player2spr", {animation: player2.player, height: 15, width: 15, posx: 0, posy: 0});
	$('#player1')[0].player = player1;
	$('#player2')[0].player = player2;
	
	var block1 = new $.gameQuery.Animation({imageURL: "sprites/Block1.png"});
	var block2 = new $.gameQuery.Animation({imageURL: "sprites/Block2.png"});
	var block3 = new $.gameQuery.Animation({imageURL: "sprites/Block3.png"});
	var block4 = new $.gameQuery.Animation({imageURL: "sprites/Block4.png"});
	
	var rand = 0;
	var thisBlock = block1;
	for(var i = 0; i < 40; i++) {
		for(var j = 0; j < 30; j++) {
			if (j == 14 && (i == 2 || i ==  37)) continue;
			rand = Math.floor(Math.random()*4);
			switch(rand) {
				case 0:
					thisBlock = block1;
					break;
				case 1:
					thisBlock = block2;
					break;
				case 2:
					thisBlock = block3;
					break;
				default:
					thisBlock = block4;
					break;
			}
			$('#actors').addSprite("block"+i+','+j, {animation: thisBlock, height: 20, width: 20, posx: i*20, posy: j*20});
		}
	}
}

function player(node,playerNum,xpos,ypos){
	this.node = node;
	this.playerNum = playerNum;
	this.yVel = 0;
	switch(this.playerNum) {
		case 1:
			this.player = new $.gameQuery.Animation({imageURL: "sprites/Player1.png"});
			break;
		case 2:
			this.player = new $.gameQuery.Animation({imageURL: "sprites/Player2.png"});
			break;
	}
	return true;
}

function addFunctionality() {
	$.playground().registerCallback(function(){
		playerMove(1);
		playerMove(2); },30)
}

function playerMove(player) {
	if(jQuery.gameQuery.keyTracker[65] && player == 1 || jQuery.gameQuery.keyTracker[37] && player == 2){ //this is left!
		var nextpos = parseInt($("#player"+player).x())-2;
		if(nextpos > 0){
			$("#player"+player).x(nextpos);
		}
	}
	if(jQuery.gameQuery.keyTracker[68] && player == 1 || jQuery.gameQuery.keyTracker[39] && player == 2){ //this is right! (d)
		var nextpos = parseInt($("#player"+player).x())+2;
		if(nextpos < PLAYGROUND_WIDTH - 20){
			$("#player"+player).x(nextpos);
		}
	}
}

$(document).ready(function() {
    buildPlayground();
    addBackground();
    addActors();
    addFunctionality();
    
    $.playground().startGame();
});
