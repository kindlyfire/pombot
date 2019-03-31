//
//     Handler for the leaderboard
//

const Sequelize = require('sequelize')
const Discord = require('discord.js')
const utils = require('../../utils')

module.exports = (bot) => {
    let handler = async ({ message, channel, args }) => {
        let page = 1
        let counterName = 'default'

        if (args.length === 1) {
            if (isNaN(parseInt(args[0]))) {
                counterName = args[0]
            } else {
                page = parseInt(args[0])
            }
        } else if (args.length === 2) {
            if (!isNaN(parseInt(args[0]))) {
                page = parseInt(args[0])
                counterName = args[1]
            } else if (!isNaN(parseInt(args[1]))) {
                page = parseInt(args[1])
                counterName = args[0]
            } else {
                return channel.send(
                    `❌ Wrong arguments. Usage: \`${
                        CONFIG().commands.prefix
                    }leaderboard <counter?> <page>\``
                )
            }
        } else if (args.length > 2) {
            return channel.send(
                `❌ Too many arguments. Usage: \`${
                    CONFIG().commands.prefix
                }leaderboard <counter?> <page>\``
            )
        }

        let counter = await getCounter(counterName)

        if (!counter) {
            return channel.send(
                `❌ Could not find a counter named \`${counterName}\``
            )
        }

        let profiles = await getProfiles(counter.startedAt)

        if (page < 1) {
            page = 1
        } else if (
            page > Math.ceil(profiles.length / 10) &&
            profiles.length > 0
        ) {
            return channel.send(`❌ That page does not exist`)
        }

        page -= 1

        let userPosition = profiles.findIndex(
            (p) => p.userId === message.author.id
        )

        let embed = new Discord.RichEmbed()
            .setAuthor(`🍅 Raid Leaderboard`)
            .setColor(0xe55b40)
            .setDescription(
                `All-time pomodoro leaderboard.\n\n` +
                    (profiles.length > 0
                        ? profiles
                              .slice(page * 10, page * 10 + 10)
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
                              .slice(0, 2040)
                        : `No raids have been recorded in this leaderboard yet.`)
            )

        if (profiles.length > 0) {
            embed.setFooter(
                `Page ${page + 1}/${Math.ceil(profiles.length / 10) ||
                    1} • Your leaderboard rank: ${utils.formatPosition(
                    userPosition + 1
                )}`
            )
        }

        channel.send({ embed })
    }

    bot.commands.set('lb', handler)
    bot.commands.set('leaderboard', handler)
}

const getCounter = async (name) => {
    return await MODELS().Counter.findOne({
        where: {
            slug: name
        }
    })
}

const getProfiles = async (startingFrom) => {
    // Get all poms that have run since

    let profiles = await MODELS().Profile.findAll({
        attributes: [
            'tag',
            'userId',
            [
                Sequelize.literal(
                    `(SELECT SUM(timeSpent) as timeInPoms FROM profile_poms WHERE profiles.id = profile_poms.profileId AND profile_poms.createdAt >= $1)`
                ),
                'timeInPoms'
            ],
            [
                Sequelize.literal(
                    `(SELECT COUNT(*) as pomCount FROM profile_poms WHERE profiles.id = profile_poms.profileId AND profile_poms.createdAt >= $1)`
                ),
                'pomCount'
            ]
        ],
        bind: [
            startingFrom
                .toISOString()
                .slice(0, 19)
                .replace('T', ' ')
        ],
        include: [
            {
                model: MODELS().Pom,
                attributes: [],
                where: {
                    finished: true,
                    startedAt: {
                        [Sequelize.Op.gte]: startingFrom
                    }
                }
            }
        ],
        order: [[Sequelize.literal('timeInPoms'), 'DESC']]
    })

    profiles = profiles.map((p) => ({
        userId: p.dataValues.userId,
        pomCount: parseInt(p.dataValues.pomCount || 0),
        timeInPoms: parseInt(p.dataValues.timeInPoms)
    }))

    return profiles
}
