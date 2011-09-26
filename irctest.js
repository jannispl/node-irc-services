var irc = require("./lib/irc");

var exec = require("child_process").exec;
function system(cmd, cb)
{
	if (!cb || typeof cb != 'function')
	{
		return "NOOB";
	}
	exec(cmd, function (error, stdout, stderr)
	{
		cb(stdout + stderr);
	});
}

// GMAIL QUOTA
var CP = [
 [ 1199433600000, 6283 ],
 [ 1224486000000, 7254 ],
 [ 2144908800000, 10996 ],
 [ 2147328000000, 43008 ],
 [ 46893711600000, Number.MAX_VALUE ]
];
function gmailQuota() {
  var now = (new Date()).getTime();
  var i;
  for (i = 0; i < CP.length; i++) {
    if (now < CP[i][0]) {
      break;
    }
  }
  if (i == CP.length) {
    return CP[i - 1][1];
  } else {
    var ts = CP[i - 1][0];
    var bs = CP[i - 1][1];
    return format(((now-ts) / (CP[i][0]-ts) * (CP[i][1]-bs)) + bs);
  }
}
var PAD = '.000000';

function format(num) {
  var str = String(num);
  var dot = str.indexOf('.');
  if (dot < 0) {
     return str + PAD;
  } if (PAD.length > (str.length - dot)) {
  return str + PAD.substring(str.length - dot);
  } else {
  return str.substring(0, dot + PAD.length);
  }
}
// END GMAIL QUOTA

var $ = undefined;

irc.Channel.prototype._eval = function (code, service, bot, user, lastres)
{
	var res = undefined;
	var _ = lastres;
	with (this)
	{
		res = eval(code);
	}
	return res;
}

var lastResult = undefined;

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

		$ = function (x)
		{
			if (x.length < 1)
			{
				return;
			}

			if (x[0] == '#')
			{
				var c = findChannel(x);
				if (!irc.Channel.isChannel(c))
				{
					return null;
				}
				return c;
			}
			else
			{
				var u = findUser(x, true);
				if (!irc.User.isUser(u))
				{
					var c = findChannel('#' + x);
					if (!irc.Channel.isChannel(c))
					{
						return null;
					}
					return c;
				}
				return u;
			}
		}
		
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
					var e = c._eval(msg.substr(trigger.length).trim(), s, b, u, lastResult);
					lastResult = e;
					
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
			else if (msg.trim().toLowerCase() == "!gmail")
			{
				b.say(chan, 'Right now, Google Mail offers ' + String(gmailQuota()) + ' MB of free storage space.');
			}
		});
	});
}
