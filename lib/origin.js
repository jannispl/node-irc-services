exports = module.exports = Origin;

function Origin(service, nickname, ident, hostname)
{
	if (!(this instanceof Origin)) { return new Origin(service, nickname, ident, hostname); }
	
	this._service = service;
	this._nickname = nickname;
	this._ident = ident;
	this._hostname = hostname;
}

Origin.prototype.user = function ()
{
	return this._service.findUser(this._nickname);
}

Origin.prototype.bot = function ()
{
	return this._service.findBot(this._nickname);
}

Origin.prototype.toString = function ()
{
	if (typeof this._nickname == 'undefined')
	{
		return Object.toString(this);
	}
	
	if (typeof this._ident != 'undefined' && typeof this._hostname != 'undefined')
	{
		return this._nickname + "!" + this._ident + "@" + this._hostname;
	}
	else if (typeof this._ident != 'undefined')
	{
		return this._nickname + "!" + this._ident;
	}
	else if (typeof this._hostname != 'undefined')
	{
		return this._nickname + "@" + this._hostname;
	}
	
	return this._nickname;
}
