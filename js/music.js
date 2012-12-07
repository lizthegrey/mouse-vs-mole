var MUSIC = (function() {
    var tracks = {}, start = 0, shouldplay = false;
    var muted = false, toggled = false;
    
    function volume() {
        for(var name in tracks) {
            tracks[name].element.muted = muted || !toggled;
        }
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
        start = +new Date;
        setInterval(tick, 8000);
        tick();
    }

    $.each([ 'atmo', 'drum', 'bass', 'tena', 'tenb', 'alto', 'sopr' ], function(i, e) {
        var track = $('<audio>').attr('src', 'sounds/deepgreen/mi' + e + '.ogg')
                                .attr('loop', true)
                                .bind('canplaythrough', loaded)[0];
        track.load();
        track.volume = 0.75;
        tracks[track.src] = tracks[e] = {
            element: track,
            loaded: false
        };
    });
    volume();
    
    return {
        mute: function() {
            muted = !muted;
            volume();
        },
        
        toggle: function(status) {
            toggled = status;
            volume();
        },
        
        update: function() {
            // Theme gets louder as the players get closer.
            var x = pspr(1)._x - pspr(2)._x,
                y = p(1).groundY - p(2).groundY,
                separation = (16 - Math.log(x * x + y * y)) / 4;
            tracks.sopr.element.volume = Math.max(0, Math.min(1, separation));
            
            // Rhythm gets louder as the players get lower.
            var height = Math.max(p(1).groundY, p(2).groundY),
                mortality = height / (death_y * BLOCK_SIZE) * 2;
            tracks.drum.element.volume = tracks.atmo.element.volume
                                       = Math.max(0, Math.min(1, mortality));
            
            // Accompaniment gets louder as the players get faster.
            var speed = Math.sqrt(p(1).xVel * p(1).xVel + pspr(1)._gy * pspr(1)._gy) +
                        Math.sqrt(p(2).xVel * p(2).xVel + pspr(2)._gy * pspr(2)._gy);
                haste = speed / 50 + 0.5;
            tracks.alto.element.volume = Math.max(0, Math.min(1, haste));
        }
    };
})();
