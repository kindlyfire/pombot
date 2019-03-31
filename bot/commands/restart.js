//
//     Handler for prefix !
//

module.exports = (bot) => {
    bot.commands.set('force-restart', async ({ channel, isAdmin }) => {
        if (!isAdmin) {
            return
        }

        setTimeout(() => process.exit(1), 1000)

        return channel.send(`✅ Forced restart in one second...`)
    })
}
