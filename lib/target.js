exports = module.exports = Target;

var Bot = require("./bot");

function Target()
{
}

Target.prototype.say = function (bot, message)
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

Target.prototype.notice = function (bot, message)
{
	if (!Bot.isBot(bot))
	{
		message = bot;
		if (!Bot.isBot(bot = this._service._defaultBot))
		{
			throw new Error("no.");
		}
	}
	return bot.notice(this, message);
}
