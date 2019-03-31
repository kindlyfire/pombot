//
//     Help message
//

let Discord = require('discord.js')

module.exports = (bot) => {
    bot.commands.set('help', async ({ channel }) => {
        let embed = new Discord.RichEmbed()
            .setAuthor(`🍅 Raid Leaderboard`)
            .setColor(0xe55b40)
            .setDescription(
                `Every commands starts with \`${CONFIG().commands.prefix}\`.`
            )
            .addField('!rb', `Show information about what this bot does.`)
            .addField('!rb help', `Show this information message.`)
            .addField(
                '!rb leaderboard [counter?] [page?]',
                `Show a leaderboard. Special leaderboards can be viewed like \`today\` and \`week\`. Defaults to \`!rb leaderboard default 1\``
            )

        return channel.send({ embed })
    })
}
