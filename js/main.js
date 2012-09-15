var PLAYGROUND_HEIGHT = 500;
var PLAYGROUND_WIDTH = 500;

function buildPlayground() {
    $('#game').playground({height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH, keyTracker: true});

    $.playground().addGroup("background", {height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH});
    $.playground().addGroup("actors", {height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH});
}

function addBackground() {
    var background1 = new $.gameQuery.Animation({imageURL: "sprites/bg.png"});
    $('#background').addSprite("background1", {animation: background1, height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH});
}

function addActors() {

}

$(document).ready(function() {
    buildPlayground();
    addBackground();
    addActors();

    $.playground().startGame();
});
