exports = module.exports = UnrealProtocol;

var util = require("util");
var events = require("events");

var Protocol = require("./protocol");
var Bot = require("../bot");
var User = require("../user");
var Channel = require("../channel");

function UnrealProtocol(set)
{
	if (!(this instanceof UnrealProtocol)) { return new UnrealProtocol(set); }
	
	this._service = null;
	this._set = set;
	this._support = { };
}
util.inherits(UnrealProtocol, Protocol);

UnrealProtocol.prototype.serviceInit = function (service)
{
	var self = this;
	self._service = service;
	
	with (service)
	{
		on('rawPING', function (origin, params, paramsString)
		{
			sendRaw(("PONG " + paramsString.trimLeft()).trim());
		});
		on('rawNETINFO', function (origin, params)
		{
			if (!this._synced)
			{
				sendRaw("EOS");
				this._synced = true;
				
				console.log("[SVC] Initial synchronization finished");
			}
		});
		on('rawPROTOCTL', function (origin, params)
		{
			for (var i in params)
			{
				var support = params[i];
				if (support == "NICKv2")
				{
					self._support.nickv2 = true;
					continue;
				}
				
				var idx = support.indexOf('=');
				if (idx != -1)
				{
					var value = support.substr(idx + 1);
					if (support.length > 10 && support.substr(0, 10) == "CHANMODES=")
					{
						self._support.chanmodes = value.split(',');
					}
				}
			}
		});
		on('rawNICK', function (origin, params)
		{
			if (params.length == 11)
			{
				// server is introducing a new user
				var nickname = params[0];
				var hopcount = parseInt(params[1]);
				var timestamp = parseInt(params[2]);
				var ident = params[3];
				var hostname = params[4];
				var server = params[5];
				var servicestamp = parseInt(params[6]);
				var usermodes = params[7];
				var vhost = params[8];
				var cloaked = params[9];
				var realname = params[10];
				
				introduceUser(nickname, ident, realname, hostname, server, hopcount, usermodes, vhost, cloaked);
				
				console.log("[NEW USER] " + nickname + "!" + ident + "@" + cloaked);
			}
			else if (params.length == 2)
			{
				var u = origin.user();
				if (!User.isUser(u)) { return; }
				
				var nickname = params[0];
				var ts = parseInt(params[1]);
				
				
				u._nickname = nickname;
			}
		});
		on('rawJOIN', function (origin, params)
		{
			var u = origin.user();
			if (!User.isUser(u)) { return; }
			
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
		on('rawCHGHOST', function (origin, params)
		{
			var u = findUser(params[0]);
			if (!User.isUser(u)) { return; }
			
			u._vhost = params[1];
		});
		on('rawCHGIDENT', function (origin, params)
		{
			var u = findUser(params[0]);
			if (!User.isUser(u)) { return; }
			
			u._ident = params[1];
		});
		on('rawCHGNAME', function (origin, params)
		{
			var u = findUser(params[0]);
			if (!User.isUser(u)) { return; }
			
			u._realname = params[1];
		});
		on('rawSETHOST', function (origin, params)
		{
			var u = findUser(params[0]);
			if (!User.isUser(u)) { return; }
			
			u._vhost = params[0];
		});
		on('rawSETIDENT', function (origin, params)
		{
			var u = findUser(params[0]);
			if (!User.isUser(u)) { return; }
			
			u._ident = params[0];
		});
		on('rawSETNAME', function (origin, params)
		{
			var u = findUser(params[0]);
			if (!User.isUser(u)) { return; }
			
			u._realname = params[0];
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

UnrealProtocol.prototype.sendRaw = function (data)
{
	return this._service.sendRaw(data);
}

UnrealProtocol.prototype.logon = function ()
{
	if (this._set.password)
	{
		this.sendRaw("PASS " + this._set.password);
	}
	
	this.sendRaw("PROTOCTL NICKv2 CLK");
	this.sendRaw("SERVER " + (this._set.serviceHost || "service.node.js") + " 1 " + (this._set.numeric || 123) + " :node.js service");
}

UnrealProtocol.prototype.introduceUser = function (nickname, ident, realname, hostname)
{
	var shost = this._set.serviceHost || "service.node.js";
	this.sendRaw("NICK " + nickname + " 1 " + Math.floor(new Date().getTime() / 1000) + " " + ident + " " + hostname + " " + shost + " 0 0 " + hostname + " * :" + realname);
}

UnrealProtocol.prototype.joinChannel = function (bot, channel)
{
	this.sendRaw(":" + bot._nickname + " JOIN " + channel);
}

UnrealProtocol.prototype.leaveChannel = function (bot, channel, reason)
{
	this.sendRaw(":" + bot._nickname + " PART " + channel + (reason ? " " + reason : ""));
}

UnrealProtocol.prototype.sendMessage = function(bot, target, message)
{
	this.sendRaw(":" + bot._nickname + " PRIVMSG " + target + " :" + message);
}
