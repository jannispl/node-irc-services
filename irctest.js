var irc = require("./lib/irc");

irc.Channel.prototype._eval = function (code, service, bot, user)
{
	// doesn't quite work.
	/*var chansay = irc.Channel.prototype.say;
	var usersay = irc.User.prototype.say;
	irc.Channel.prototype.say = function (msg) { return chansay.call(this, bot, msg); };
	irc.User.prototype.say = function (msg) { return usersay.call(this, bot, msg); };*/
	
	var res = undefined;
	with (this)
	{
		res = eval(code);
	}
	
	/*irc.Channel.prototype.say = chansay;
	irc.User.prototype.say = usersay;*/
	
	return res;
}

var s = new irc.Service(new irc.UnrealProtocol({ password: 'nodejs', numeric: 78, serviceHost: 'service.node.js' }));

var done = false;
function cleanup()
{
	if (done) { return; }
	done = true;
	
	s.disconnect("User request");
}

with (s)
{
	connect("localhost", 6667, function ()
	{
		process.once('SIGINT', cleanup);
		process.once('SIGTERM', cleanup);
		process.once('exit', cleanup);
		
		var b = createBot("nodebot", "nodejs", "node.js bot", "bot.node.js");
		b.join("#mave");
		
		b.on('test', function ()
		{
			b.say("#mave", "hi there, I got it!");
		});
		
		b.on('userChannelJoin', function (user, channel)
		{
			channel.say(b, "Welcome, " + user.nickname[0] + "-" + user.nickname.substr(1) + "!");
		});
		
		on('rawPRIVMSG', function (origin, params)
		{			
			var u = origin.user();
			if (!irc.User.isUser(u))
			{
				return;
			}
			
			var chan = params[0];
			if (chan[0] != "#")
			{
				return;
			}
			var c = findChannel(chan);
			if (!irc.Channel.isChannel(c))
			{
				return;
			}
			
			var msg = params[1];
			
			var trigger = "%";
			
			if (msg.substr(0, trigger.length) == trigger)
			{
				try
				{
					var e = c._eval(msg.substr(trigger.length).trim(), s, b, u);
					
					if (e != undefined)
					{
						b.say(chan, e);
					}
				}
				catch (e)
				{
					b.say(chan, "Error: " + e.message);
				}
			}
		});
	});
}
