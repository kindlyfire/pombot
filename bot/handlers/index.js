//
// Include all handlers
//

module.exports = (bot) => {
    return [
        {
            commands: ['404'],
            async handler(message) {
                await message.channel.send(`❌ That command does not exist.`)
            }
        },
        {
            commands: [bot.config.commands.raid],
            handler: require('./raid')
        }
    ]
}
