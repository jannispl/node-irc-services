exports = module.exports = ClientProtocol;

var util = require("util");
var events = require("events");

var Protocol = require("./protocol");
var Bot = require("../bot");
var User = require("../user");
var Channel = require("../channel");

function ClientProtocol(set)
{
	if (!(this instanceof ClientProtocol)) { return new ClientProtocol(set); }
	
	this._service = null;
	this._set = set;
	this._support = { };
}
util.inherits(ClientProtocol, Protocol);

ClientProtocol.prototype.serviceInit = function (service)
{
	var self = this;
	self._service = service;
	
	with (service)
	{
		on('rawPING', function (origin, params, paramsString)
		{
			sendRaw(("PONG " + paramsString.trimLeft()).trim());
		});
		on('rawNICK', function (origin, params)
		{
			var u = origin.user();
			if (!User.isUser(u)) { return; }
			
			var nickname = params[0];
			var ts = parseInt(params[1]);
			
			
			u._nickname = nickname;
		});
		on('rawJOIN', function (origin, params)
		{
			var u = origin.user();
			if (!User.isUser(u))
			{
				u = introduceUser(origin.nickname, origin.ident, undefined, origin.hostname);
			}
			
			var names = [ ];
			var arr = params[0].split(',');
			for (var i in arr)
			{
				var name = arr[i];
				if (name.length > 0)
				{
					var c = findChannel(name);
					if (!Channel.isChannel(c))
					{
						c = introduceChannel(name);
					}
					
					c._users.push(u);
					u._channels.push(c);
				}
			}
		});
		on('rawQUIT', function (origin, params)
		{
			var u = origin.user();
			if (!User.isUser(u)) { return; }
			
			deleteUser(u);
		});
		on('rawPART', function (origin, params)
		{
			var c = findChannel(params[0]);
			if (!Channel.isChannel(c)) { return; }
			
			var u = origin.user();
			if (User.isUser(u))
			{
				delete c._users[c._users.indexOf(u)];
				delete u._channels[u._channels.indexOf(c)];
				
				if (c._users.length == 0)
				{
					delete this._channels[this._channels.indexOf(c)];
				}
			}
		});
		on('raw333', function (origin, params)
		{
			var c = findChannel(params[1]);
			if (!Channel.isChannel(c)) { return; }
			
			c._topicSetter = params[2];
			c._topicDate = new Date(parseInt(params[3]) * 1000);
		});
		on('rawTOPIC', function (origin, params)
		{
			var c = findChannel(params[0]);
			if (!Channel.isChannel(c)) { return; }
			
			c._topicSetter = params.length == 2 ? origin.nickname : params[1];
			c._topicDate = params.length == 2 ? new Date() : new Date(parseInt(params[2]) * 1000);
			c._topic = params.length == 2 ? params[1] : params[3];
		});
		on('rawKICK', function (origin, params)
		{
			var c = findChannel(params[0]);
			if (!Channel.isChannel(c)) { return; }
			
			var victim = params[1];
			var b = findBot(victim);
			if (Bot.isBot(b))
			{
				if (c._users.length == 0)
				{
					delete this._channels[this._channels.indexOf(c)];
				}
			}
			else
			{
				var u = findUser(victim);
				if (User.isUser(u))
				{
					delete u._channels[u._channels.indexOf(c)];
					delete c._users[c._users.indexOf(u)];
					
					if (c._users.length == 0)
					{
						delete this._channels[this._channels.indexOf(c)];
					}
				}
			}
		});
		on('rawMODE', function (origin, params)
		{
			var target = params[0];
			var modes = params[1];
			if (target[0] != '#')
			{
				var u = findUser(target);
				if (!User.isUser(u)) { return; }
				
				var removeModes = "", addModes = "";
				var which = 1;
				for (var i in modes)
				{
					var m = modes[i];
					if (m == '+')
					{
						which = 1;
					}
					else if (m == '-')
					{
						which = 2;
					}
					else
					{
						if (m == 1)
						{
							addModes += m;
						}
						else
						{
							removeModes += m;
							if (m == 't')
							{
								// If mode 't' was removed, the user's vhost is being removed
								u._vhost = '*';
							}
						}
					}
				}
				
				var newModes = "";
				for (var i in u._userModes)
				{
					var m = u._userModes[i];
					if (removeModes.indexOf(m) == -1)
					{
						newModes += m;
					}
				}
				newModes += addModes;
				
				u._userModes = newModes;
				
				return;
			}
			
			/*var c = findChannel(target);
			if (!Channel.isChannel(c))
			{
				return;
			}
			
			var set = 0;
			var paramOffset = 2;
			var paramsString = "";
			for (var i in modes)
			{
				var m = modes[i];
				if (m == '+') { set = 1; }
				else if (m == '-') { set = 2; }
				
				if (set == 0 || m == '+' || m == '-')
				{
					continue;
				}
				
				var group = 0;
				var prefixMode = isPrefixMode...
			}*/
		});
	}
}

ClientProtocol.prototype.sendRaw = function (data)
{
	return this._service.sendRaw(data);
}

ClientProtocol.prototype.logon = function ()
{
	if (this._set.password)
	{
		this.sendRaw("PASS " + this._set.password);
	}
	
	this.sendRaw("NICK " + this._set.nickname);
	this.sendRaw("USER " + this._set.ident + " \"\" \"\" :" + this._set.realname);
	
	this._synced = true;
}

ClientProtocol.prototype.introduceUser = function (nickname, ident, realname, hostname)
{
}

ClientProtocol.prototype.joinChannel = function (bot, channel)
{
	this.sendRaw("JOIN " + channel);
}

ClientProtocol.prototype.leaveChannel = function (bot, channel, reason)
{
	this.sendRaw("PART " + channel + (reason ? " " + reason : ""));
}

ClientProtocol.prototype.sendMessage = function (bot, target, message)
{
	this.sendRaw("PRIVMSG " + target + " :" + message);
}

ClientProtocol.prototype.sendNotice = function (bot, target, message)
{
	this.sendRaw("NOTICE " + target + " :" + message);
}

ClientProtocol.prototype.selfQuit = function (reason)
{
	this.sendRaw("QUIT" + (reason ? " :" + reason : ""));
}

ClientProtocol.prototype.botQuit = function (bot, reason)
{
}
