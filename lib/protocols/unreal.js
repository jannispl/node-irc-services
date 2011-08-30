var util = require("util");
var events = require("events");

var Protocol = require("./protocol").Protocol;
var Bot = require("../bot").Bot;
var User = require("../user").User;
var Channel = require("../channel").Channel;

function UnrealProtocol(set)
{
	if (!(this instanceof UnrealProtocol)) { return new UnrealProtocol(set); }
	events.EventEmitter.call(this);
	this._service = null;
	this._set = set;
}
util.inherits(UnrealProtocol, Protocol);
exports.UnrealProtocol = UnrealProtocol;
UnrealProtocol.prototype.serviceInit = function (service)
{
	var self = this;
	self._service = service;
	
	with (service)
	{
		on('rawPING', function (origin, params)
		{
			sendRaw("PONG " + params.join(" ").trim());
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
				var nickname = params[0];
				var ts = parseInt(params[1]);
				
				var u = origin.user();
				if (!(u instanceof User))
				{
					return;
				}
				u._nickname = nickname;
			}
		});
		on('rawJOIN', function (origin, params)
		{
			var u = origin.user();
			if (!(u instanceof User))
			{
				return;
			}
			
			var names = [ ];
			var arr = params[0].split(',');
			for (var i in arr)
			{
				var name = arr[i];
				if (name.length > 0)
				{
					var c = findChannel(name);
					if (!(c instanceof Channel))
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
			if (!(u instanceof User))
			{
				return;
			}
			
			deleteUser(u);
		});
		on('rawPART', function (origin, params)
		{
			var c = findChannel(params[0]);
			if (!(c instanceof Channel))
			{
				return;
			}
			
			var u = origin.user();
			if (u instanceof User)
			{
				delete c._users[c._users.indexOf(u)];
				delete u._channels[u._channels.indexOf(c)];
				
				if (c._users.length == 0)
				{
					delete this._channels[this._channels.indexOf(c)];
				}
			}
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
