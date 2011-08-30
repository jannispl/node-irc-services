var User = require("./user").User;

function Channel(service)
{
	if (!(this instanceof Channel)) { return new Channel(service); }
	
	this._service = service;
	this._name = undefined;
	this._users = [ ];
}
exports.Channel = Channel;

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
