$(document).ready(function() {
		var nickname;
		//open socket io
		var socket = io();
		var server = socket.connect('http://localhost:8080');

		//handle chatter exit
		server.on('remove chatter', function(name){
				removeChatter(name);
		});
		var removeChatter = function (name) {
				console.log(name + " is leaving the chat room");
				$('#chatters li[data-name=' + name + ']').remove();
		};

		//handle chatter entry
		server.on('add chatter', function (name) {
				console.log('called insertChatter');
				var chatter = $('<li class="list-group-item" data-name="'+name+'" >' + name + '</li>');//.data('name', name);
				$('#chatters').append(chatter);
		});
		

		//handle msg submit
		$('#chat_form').submit(function (e) {
				e.stopPropagation();
				e.preventDefault();
				var message = $('#chat_input').val();
				//console.log(message);
				//send event to server
				var data = {name:nickname,message:message};
				server.emit('messages',data );
				$('#chat_input').val('');
				//$('.panel-content').animate({scrollTop: $('.panel-content').height()}, 'slow');
		
		});
		server.on('scrollDown', function (data) {
				console.log('scrolling down');
				$('.panel-content').animate({scrollTop: $('.panel-content').height()}, 'slow');			
		});

		//listen for msg list event from server
		server.on('messages', function (data) {
				//append messages to dom				
				insertMessage(data);
		});

		//append msgs to screen
		var insertMessage = function (data) {
				console.log("ff "+data);
				var message = $('<li class="list-group-item" ><span class="badge">' + data.name+"</span> "+data.message+ '</li>');//.data('name', data.name);
				console.log(message);
				$('#messages').append(message);
				$('.panel-content').animate({scrollTop: $('.panel-content').height()}, 'slow');	
		};

		//listen for connect events
		server.on('start', function (data) {
				console.log('responded to start');

				var options = {backdrop:'static'}	;
				$('#nickNameModal').modal(options);
			
		});
		
		//handle msg submit
		$('#nickName_form').submit(function (e) {
				e.stopPropagation();
				e.preventDefault();
				nickname = $('#nickName_input').val();
				if(nickname!== undefined && nickname.trim() !== ''){
						$('#status').html('Connected to chattr-bug');
						$('#status').removeClass("hide");
						server.emit('join', nickname);
						$('#nickNameModal').modal('hide');
				}
				
		
		});


});
