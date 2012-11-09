var MUSIC = (function() {
    var tracks = {}, start = 0, shouldplay = false;
    
    function play() {
        for(var name in tracks) {
            tracks[name].element.muted = false;
            tracks[name].element.play();
        }
        start = +new Date;
        setInterval(tick, 16000);
        tick();
    }

    function tick() {
        var time = (new Date - start) / 1000;
        for(var name in tracks) {
            var elt = tracks[name].element;
            elt.currentTime = time % elt.duration;
            elt.play();
        }
    }

    function loaded(event) {
        tracks[this.src].loaded = true;
        for(var name in tracks) {
            if(!tracks[name].loaded) {
                return;
            }
        }
        play();
    }

    $.each([ 'theme', 'harmony', 'bass' ], function(i, e) {
        var track = $('<audio>').attr('src', 'sounds/deepgreen/' + e + '.ogg')
                                .attr('loop', true)
                                .bind('canplaythrough', loaded)[0];
        track.load();
        tracks[track.src] = tracks[e] = {
            element: track,
            loaded: false
        };
    });
    
    return {
        reset: function() {
            for(var name in tracks) {
                tracks[name].element.muted = true;
            }
        },
        
        play: play,
        
        update: function() {
            // "Theme" gets louder as the players get closer.
            var x = pspr(1)._x - pspr(2)._x,
                y = p(1).groundY - p(2).groundY,
                separation = (16 - Math.log(x * x + y * y)) / 4;
            tracks.theme.element.volume = Math.max(0, Math.min(1, separation));
            
            // "Bass" gets louder as the players get lower.
            var height = Math.max(p(1).groundY, p(2).groundY),
                mortality = height / (death_y * BLOCK_SIZE);
            tracks.bass.element.volume = Math.max(0, Math.min(1, mortality));
        }
    };
})();
