//
//     Command Handler for !raid
//

const Discord = require('discord.js')
const ReactionButton = require('../../utils/ReactionButton')

module.exports = (bot) => {
    let reactionButton
    let lastMessage

    bot.rootCommands.set('!raid', async ({ message, channel }) => {
        if (!CONFIG().presence.raidChannels.includes(channel.id)) {
            return
        }

        let msg = await message.channel.send(
            `**RAAAAAAAAAAAAAAAAAAAID!** ⚔\n\`Join in by reacting!\``
        )

        if (reactionButton) {
            reactionButton.off()
        }

        if (lastMessage) {
            lastMessage.delete().catch((e) => {
                LOGGER().warn(
                    { error: e },
                    'Failed to delete last raid message'
                )
            })
        }
        lastMessage = msg

        setTimeout(() => {
            message.delete().catch((e) => {
                LOGGER().warn({ error: e }, 'Failed to delete raid message')
            })
            reactionButton.off()
        }, 3000)

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

            // let info = await cycle.getInformation()

            let msg = await message.channel.send(
                `⚔ **${user} has joined the Raid!** ⚔  <#${
                    CONFIG().presence.pomChannelId
                }> has been updated.`
            )

            joinMessages.set(user.id, msg)

            setTimeout(() => {
                msg.delete().catch(console.error)
                joinMessages.delete(user.id)
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
                        LOGGER().info(
                            { error: e },
                            'Failed to delete pom join message on leave'
                        )
                    })
            }
        })

        await msg.react('⚔')
    })
}
