//
//     Handler for the leaderboard
//

const Sequelize = require('sequelize')
const Discord = require('discord.js')
const utils = require('../../utils')

module.exports = (bot) => {
    let m = MODELS()

    let handler = async ({ message, channel, args }) => {
        let profiles = await m.Profile.findAll({
            attributes: [
                'tag',
                'userId',
                [
                    Sequelize.literal(
                        `(SELECT SUM(timeSpent) as timeInPoms FROM profile_poms WHERE profiles.id = profile_poms.profileId)`
                    ),
                    'timeInPoms'
                ],
                [
                    Sequelize.literal(
                        `(SELECT COUNT(*) as pomCount FROM profile_poms WHERE profiles.id = profile_poms.profileId)`
                    ),
                    'pomCount'
                ]
            ],
            include: [
                { model: m.Pom, attributes: [], where: { finished: true } }
            ],
            order: [[Sequelize.literal('timeInPoms'), 'DESC']]
        })

        profiles = profiles.map((p) => ({
            userId: p.dataValues.userId,
            pomCount: parseInt(p.dataValues.pomCount || 0),
            timeInPoms: parseInt(p.dataValues.timeInPoms)
        }))

        let userPosition = profiles.findIndex(
            (p) => p.userId === message.author.id
        )

        let embed = new Discord.RichEmbed()
            .setAuthor(`🍅 Raid Leaderboard`)
            .setColor(0xe55b40)
            .setDescription(
                `All-time pomodoro leaderboard.\n` +
                    profiles
                        .slice(0, 10)
                        .map(
                            (p, i) =>
                                `\`${i + 1}\`. <@${
                                    p.userId
                                }>: **${utils.formatSeconds(
                                    p.timeInPoms
                                )}** in ${p.pomCount} pom${
                                    p.pomCount === 1 ? '' : 's'
                                }`
                        )
                        .join('\n')
                        .slice(0, 2048)
            )
            .setFooter(
                userPosition !== -1
                    ? `You are ranked #${userPosition + 1}`
                    : `You are not ranked yet.`
            )

        channel.send({ embed })
    }

    bot.commands.set('lb', handler)
    bot.commands.set('leaderboard', handler)
}
