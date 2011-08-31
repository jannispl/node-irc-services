exports = module.exports = Bot;

var events = require("events");
var util = require("util");

var User = require("./user");
var Channel = require("./channel");

function Bot(service)
{
	if (!(this instanceof Bot)) { return new Bot(service); }
	events.EventEmitter.call(this);
	
	this._service = service;
	this._protocol = service._protocol;
	
	this._nickname = undefined;
	this._ident = undefined;
	this._realname = undefined;
	this._hostname = undefined;
	
	this._channels = [ ];
	this._loggedOn = false;
}
util.inherits(Bot, events.EventEmitter);

Bot.isBot = function (obj)
{
	return typeof obj == 'object' && obj instanceof Bot;
}

Bot.prototype.logon = function (nickname, ident, realname, hostname)
{
	if (this._loggedOn)
	{
		// Already logged on
		return;
	}
	
	this._nickname = nickname;
	this._ident = ident;
	this._realname = realname;
	this._hostname = hostname;
	this._loggedOn = true;
	
	this._protocol.introduceUser(nickname, ident, realname, hostname);
}

Bot.prototype.join = function (channel)
{
	if (!this._loggedOn) { return; }
	
	var c = null;
	if (channel instanceof Channel)
	{
		c = channel;
		channel = channel._name;
		
		if (this._channels.indexOf(channel) != -1)
		{
			// We're in this channel already
			return;
		}
	}
	else
	{
		var lowerChannel = channel.toLowerCase();
		for (var i in this._channels)
		{
			if (this._channels[i]._name.toLowerCase() == lowerChannel)
			{
				// We're in this channel already
				return;
			}
		}
		
		c = this._service.findChannel(channel);
		if (!(c instanceof Channel))
		{
			c = this._service.introduceChannel(channel);
		}
	}
	
	this._channels.push(c);
	this._protocol.joinChannel(this, channel);
}

Bot.prototype.leave = function (channel, reason)
{
	if (!this._loggedOn) { return; }
	
	var c = null;
	if (channel instanceof Channel)
	{
		c = channel;
		channel = channel._name;
		
		var idx = this._channels.indexOf(c);
		if (idx == -1)
		{
			// We're not in this channel
			return;
		}
		
		delete this._channels[idx];
	}
	else
	{
		var lowerChannel = channel.toLowerCase();
		for (var i in this._channels)
		{
			if (this._channels[i]._name.toLowerCase() == lowerChannel)
			{
				c = this._channels[i];
				delete this._channels[i];
				break;
			}
		}
		
		if (c == null)
		{
			// We're not in this channel
			return;
		}
	}
	
	this._protocol.leaveChannel(this, channel, reason);
}

Bot.prototype.say = function (target, message)
{
	if (!this._loggedOn) { return; }
	
	if (target instanceof Channel)
	{
		target = target._name;
	}
	else if (target instanceof User)
	{
		target = target._nickname;
	}
	
	this._protocol.sendMessage(this, target, message);
}

Bot.prototype.notice = function (target, message)
{
	if (!this._loggedOn) { return; }
	
	if (target instanceof Channel)
	{
		target = target._name;
	}
	else if (target instanceof User)
	{
		target = target._nickname;
	}
	
	this._protocol.sendNotice(this, target, message);
}

Bot.prototype.findChannel = function (name)
{
	name = name.toLowerCase();
	for (var i in this._channels)
	{
		if (this._channels[i]._name.toLowerCase() == name)
		{
			return this._channels[i];
		}
	}
}

Bot.prototype.sendRaw = function (data)
{
	this._service.sendRaw(":" + this._nickname + " " + data);
}

Bot.prototype.toString = function ()
{
	return "Bot(" + this._nickname + ")";
}

Bot.prototype.__defineGetter__("nickname", function ()
{
	return this._nickname;
});

Bot.prototype.__defineGetter__("ident", function ()
{
	return this._ident;
});

Bot.prototype.__defineGetter__("realname", function ()
{
	return this._realname;
});

Bot.prototype.__defineGetter__("hostname", function ()
{
	return this._hostname;
});

Bot.prototype.__defineGetter__("channels", function ()
{
	var obj = { };
	for (var i in this._channels)
	{
		obj[this._channels[i]._name] = this._channels[i];
	}
	return obj;
});

