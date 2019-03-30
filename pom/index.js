//
// Pom manager
//
// Decouples the "pom" from Discord
// (someday, joining from the web might be a thing)
//

const utils = require('../utils')

const Pom = {
    // Configuration file
    config: null,

    // Instance of Sequelize DB
    db: null,

    // Sequelize models
    models: null,

    pomStartedHandlers: [],

    async getForChannel(channelId) {
        let pom = await this.models.Pom.findOne({
            where: {
                channelId,
                finished: false
            },
            order: [['createdAt', 'DESC']]
        })

        if (!pom) {
            pom = await this.models.Pom.create({
                channelId,
                running: false,
                finished: false
            })
        }

        return pom
    },

    // Add a user to
    //
    // user { id, tag, avatarURL }
    async addUser(channelId, user) {
        let profile = await this.getUserProfile(user)

        let pom = await this.getForChannel(channelId)

        if (!pom.running) {
            pom.running = true
            pom.startedAt = new Date()
            await pom.save()

            // Call handlers
            for (h of this.pomStartedHandlers) {
                h(pom)
            }
        }

        let pomInfo = await this.getInformation(pom.id)

        if (await pom.hasProfile(profile)) {
            return false
        }

        await pom.addProfile(profile, {
            through: {
                // Round it up
                timeSpent: Math.ceil(pomInfo.raw.timeLeft / 60) * 60
            }
        })

        return true
    },

    // Remove a user from a pom
    async removeUser(channelId, user) {
        let profile = await this.getUserProfile(user)

        let pom = await this.models.Pom.findOne({
            where: {
                channelId,
                finished: false
            }
        })

        if (!pom) return

        await pom.removeProfile(profile)
    },

    // Get a profile for a user
    // Creates/updates if necessary
    async getUserProfile(user) {
        let profile = await this.models.Profile.findOne({
            where: {
                userId: user.id
            }
        })

        if (!profile) {
            profile = await this.models.Profile.create({
                userId: user.id,
                tag: user.tag,
                avatarURL: user.avatarURL
            })
        }

        // If there are changes to the profile, update it
        if (profile.tag !== user.tag || profile.avatarURL !== user.avatarURL) {
            profile.tag = user.tag
            profile.avatarURL = user.avatarURL
            await profile.save()
        }

        return profile
    },

    // Build full pom information
    // As will be displayed by the PomManager
    async getInformation(pomId) {
        let pom = await this.models.Pom.findOne({
            where: {
                id: pomId
            },
            include: [this.models.Profile]
        })

        if (!pom) {
            return {
                startedAt: `?`,
                timeLeft: `?`,
                timeLeftShort: `?`,
                participants: [],

                raw: {
                    startedAt: 0,
                    timeLeft: 0,
                    participants: []
                }
            }
        }

        let startedAt = utils.dateToUTC(pom.startedAt)
        let now = new Date(utils.dateNowUTC())

        let endsAt = new Date(startedAt)
        endsAt.setSeconds(endsAt.getSeconds() + 60 * 25)

        // Time left in seconds
        let timeLeft = Math.floor(
            25 * 60 - (utils.dateNowUTC() - startedAt.getTime()) / 1000
        )

        let pomInfo = {
            startedAt: `${utils.timeDisplayHourMin(startedAt)} UTC`,
            timeLeft: `~${Math.floor(timeLeft / 60)}m ${timeLeft %
                60}s (updated at ${utils.timeDisplayHourMin(now)} UTC)`,
            timeLeftShort: `~${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s`,
            endsAt: `${utils.timeDisplayHourMin(endsAt)} UTC`,
            participants: pom.profiles.map((p) => p.tag),

            raw: {
                startedAt,
                endsAt,
                timeLeft,
                participants: pom.profiles
            }
        }

        return pomInfo
    }
}

module.exports = Pom
