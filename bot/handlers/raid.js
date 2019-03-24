//
// Command handler for "!raid"
//

const Discord = require('discord.js')
const Bot = require('../index')
const Pom = require('../../pom')
const ReactionButton = require('../../utils/ReactionButton')

let reactionButton

module.exports = async (message) => {
    if (!Bot.config.presence.raidChannels.includes(message.channel.id)) {
        return
    }

    let msg = await message.channel.send(
        `**RAAAAAAAAAAAAAAAAAAAID!** ⚔\n\`Join in by reacting!\``
    )

    if (reactionButton) {
        reactionButton.off()
    }

    let joinMessages = new Discord.Collection()

    reactionButton = new ReactionButton(msg, '⚔', async (user) => {
        let cycle = BOT().pomManager.getCurrentCycle()

        if (!cycle) {
            return
        }

        let r = await cycle.joinUser(user)

        if (!r) {
            return
        }

        let info = await cycle.getInformation()

        let msg = await message.channel.send(
            `⚔ **${user} has joined the Raid!** ⚔  <#${
                CONFIG().presence.pomChannelId
            }> has been updated.`
        )

        joinMessages.set(user.id, msg)

        setTimeout(() => {
            msg.delete().catch(console.error)
        }, 60000)
    })

    reactionButton.addListener('remove', async (user) => {
        let cycle = BOT().pomManager.getCurrentCycle()

        if (!cycle) {
            return
        }

        await cycle.leaveUser(user)

        if (joinMessages.has(user.id)) {
            joinMessages
                .get(user.id)
                .delete()
                .catch((e) => {
                    LOGGER().warn(
                        { error: e },
                        'Failed to delete pom join message on leave'
                    )
                })
        }
    })

    await msg.react('⚔')
}
