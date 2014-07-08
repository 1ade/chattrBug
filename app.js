/**
 * Module dependencies.
 */
//install redis
var redis ;
var redisClient ;

if (process.env.REDISTOGO_URL) {
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
		var redisClient = require("redis").createClient(rtg.port, rtg.hostname);
		redisClient.auth(rtg.auth.split(":")[1]);
} else {
    redis = require("redis")
		redisClient = redis.createClient();
}


var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');

var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

var about = require('./routes/about');
app.get('/about', about.about);


var server = http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

/*
=================
socket.io ish
=================
*/
var socket = require('socket.io');
var io = socket.listen(server);
var callCounter = 0;
var storeMessage = function (name, data) {
    var message = JSON.stringify({
        name: name,
        message: data
    });
    redisClient.lpush("messages", message, function () {
        redisClient.ltrim("messages", 0, 9);
    });
};

io.on('connection', function (client) {
    console.log('Client connected...');

    client.emit('start', {});

    client.on('join', function (name) {
        /*============== broadcast members================== **/
        console.log(name + " just joined the chat");
				client.username = name;


        io.emit('add chatter', name);

        redisClient.smembers('chatters', function (err, names) {

            if (!err) {

                names.forEach(function (name) {
                    client.emit('add chatter', name);
                });
            } else {
                console.log('the error here is ' + err);
            }

        });

        redisClient.sadd("chatters", name);


        /*================================================== **/


        /*============== broadcast prev messages ================== **/
        redisClient.lrange("messages", 0, -1, function (err, messages) {
            messages = messages.reverse();
            messages.forEach(function (message) {
                var msg = JSON.parse(message);
								console.log(msg);
                client.emit("messages", msg);
            });
        });
        /*================================================== **/





    });

    /*=============== handle disconnect ================== **/
    client.on('disconnect', function () {
        console.log("disconnecting "+client.username );
        io.sockets.emit("remove chatter", client.username);
        redisClient.srem("chatters", client.username);

    });
    /*================================================== **/

    client.on("messages", function (data) {
	io.emit("messages", data);
	storeMessage(data.name,data.message);        
    });

});
