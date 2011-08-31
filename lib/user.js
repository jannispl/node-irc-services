exports = module.exports = User;

var Bot = require("./bot");

function User(service)
{
	if (!(this instanceof User)) { return new User(service); }
	
	this._service = service;
	this._nickname = undefined;
	this._ident = undefined;
	this._realname = undefined;
	this._hostname = undefined;
	this._userModes = "";
	this._channels = [ ];
}

User.isUser = function (obj)
{
	return typeof obj == 'object' && obj instanceof User;
}

User.prototype.findChannel = function (name)
{
	for (var i in this._channels)
	{
		if (this._channels[i]._name == name)
		{
			return this._channels[i];
		}
	}
}

User.prototype.say = function (bot, message)
{
	if (!Bot.isBot(bot))
	{
		message = bot;
		if (!Bot.isBot(bot = this._service._defaultBot))
		{
			throw new Error("no.");
		}
	}
	return bot.say(this, message);
}

User.prototype.toString = function ()
{
	return "User(" + this._nickname + ")";
}

User.prototype.__defineGetter__("nickname", function ()
{
	return this._nickname;
});

User.prototype.__defineGetter__("ident", function ()
{
	return this._ident;
});

User.prototype.__defineGetter__("realname", function ()
{
	return this._realname;
});

User.prototype.__defineGetter__("hostname", function ()
{
	return this._hostname;
});

User.prototype.__defineGetter__("userModes", function ()
{
	return this._userModes;
});

User.prototype.__defineGetter__("vhost", function ()
{
	return this._vhost;
});

User.prototype.__defineGetter__("cloaked", function ()
{
	return this._cloaked;
});

User.prototype.__defineGetter__("channels", function ()
{
	var obj = { };
	for (var i in this._channels)
	{
		obj[this._channels[i]._name] = this._channels[i];
	}
	return obj;
});
