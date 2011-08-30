var irc = require("./lib/irc");

irc.Channel.prototype._eval = function (code, service, bot, user)
{
	var chansay = irc.Channel.prototype.say;
	var usersay = irc.User.prototype.say;
	irc.Channel.prototype.say = function (msg) { return chansay.call(this, bot, msg); };
	irc.User.prototype.say = function (msg) { return usersay.call(this, bot, msg); };
	
	var res = undefined;
	with (this)
	{
		res = eval(code);
	}
	
	irc.Channel.prototype.say = chansay;
	irc.User.prototype.say = usersay;
	
	return res;
}

var s = new irc.Service(new irc.UnrealProtocol({ password: 'nodejs', numeric: 78, serviceHost: 'service.node.js' }));
with (s)
{
	connect("localhost", 6667, function ()
	{
		var b = createBot("nodebot", "nodejs", "node.js bot", "bot.node.js");
		b.join("#mave");
		
		on('rawPRIVMSG', function (origin, params)
		{			
			var u = origin.user();
			if (!(u instanceof irc.User))
			{
				return;
			}
			
			var chan = params[0];
			if (chan.charAt(0) != "#")
			{
				return;
			}
			var c = findChannel(chan);
			if (!(c instanceof irc.Channel))
			{
				return;
			}
			
			var msg = params[1];
			
			if (msg.substr(0, 1) == "%")
			{
				try
				{
					var e = c._eval(msg.substr(1).trim(), s, b, u);
					
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
