//
//     Handler for prefix !
//

module.exports = (bot) => {
    bot.commands.set('skip', async ({ message, channel, author, isAdmin }) => {
        if (!isAdmin) {
            return
        }

        let cycle = BOT().pomManager.getCurrentCycle()

        if (cycle.getType() === 'pom') {
            return channel.send(`❌ Only breaks can be skipped.`)
        } else {
            cycle.skip()

            return channel.send(`✅ Skipped the break`)
        }
    })
}
