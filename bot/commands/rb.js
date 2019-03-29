//
//     Handler for prefix !
//

module.exports = (bot) => {
    bot.commands.set('', ({ message, channel }) => {
        channel.send(CONFIG().messages.info)
    })
}
