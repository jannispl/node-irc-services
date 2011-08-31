exports = module.exports = Channel;

var User = require("./user");
var Bot = require("./bot");

function Channel(service)
{
	if (!(this instanceof Channel)) { return new Channel(service); }
	
	this._service = service;
	this._name = undefined;
	this._users = [ ];
}

Channel.isChannel = function (obj)
{
	return typeof obj == 'object' && obj instanceof Channel;
}

Channel.prototype.findUser = function (nickname)
{
	for (var i in this._users)
	{
		if (this._users[i]._nickname == nickname)
		{
			return this._users[i];
		}
	}
}

Channel.prototype.say = function (bot, message)
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

Channel.prototype.toString = function ()
{
	return "Channel(" + this._name + ")";
}

Channel.prototype.__defineGetter__("name", function ()
{
	return this._name;
});

Channel.prototype.__defineGetter__("users", function ()
{
	var obj = { };
	for (var i in this._users)
	{
		obj[this._users[i]._nickname] = this._users[i];
	}
	return obj;
});
