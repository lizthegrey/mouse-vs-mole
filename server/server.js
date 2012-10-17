var util = require('util');
var express = require('express');

var app = express();
app.use(express.logger({ format: 'dev' }));
app.use(app.router);
app.use(express.static(__dirname + '/..'));
app.use(function(request, response) {
    response.status(404)
            .type('text/plain')
            .send('404\n' + request.path + '\n');
});
var io = require('socket.io').listen(app.listen(9001));
io.set('log level', 1);

io.sockets.on('connection', function(socket) {
    socket.on('login', function(data) {
        var client = data.uid;
        io.sockets.emit('update', util.format('[%s] login:', client, data));
        
        socket.on('key', function(data) {
            io.sockets.emit('update', util.format('[%s] key:', client, data));
        });
    });
});
