exports = module.exports = Channel;

var util = require("util");

var User = require("./user");
var Bot = require("./bot");
var Target = require("./target");

function Channel(service)
{
	if (!(this instanceof Channel)) { return new Channel(service); }
	Target.call(this);
	
	this._service = service;
	this._name = undefined;
	this._users = [ ];
}
util.inherits(Channel, Target);

Channel.isChannel = function (obj)
{
	return typeof obj == 'object' && obj instanceof Channel;
}

Channel.prototype.findUser = function (nickname, ignoreCase)
{
	if (typeof ignoreCase == 'undefined' || !ignoreCase)
	{
		for (var i in this._users)
		{
			if (this._users[i]._nickname == nickname)
			{
				return this._users[i];
			}
		}
	}
	else
	{
		nickname = nickname.toLowerCase();
		for (var i in this._users)
		{
			if (this._users[i]._nickname.toLowerCase() == nickname)
			{
				return this._users[i];
			}
		}
	}
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
