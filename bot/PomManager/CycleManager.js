//
//     Pomodoro Cycle Manager
//
// Manage the pomodoro process of a channel
//

const Pom = require('../../pom')
const PomCycle = require('./PomCycle')
const BreakCycle = require('./BreakCycle')
const Op = require('sequelize').Op

module.exports = class CycleManager {
    constructor(channelId) {
        // Load channel
        this.channel = CLIENT().channels.get(channelId)

        // List of cycles that have been run
        this.cycles = []
    }

    // Resume channel management or start new
    async run() {
        let pom = await this.getChannelPom()
        let brk = await this.getChannelBreak()
        let cycle

        if (brk.running) {
            cycle = new BreakCycle(this, brk)
        } else {
            cycle = new PomCycle(this, pom)
        }

        this.cycles.push(cycle)

        cycle.once('end', async () => {
            if (cycle.getType() === 'pom') {
                // Start break
                brk.running = true
                brk.startedAt = new Date()
                await brk.save()

                // Count the number of poms that the user finished
                // If it is equal to 5, send a message
                let profiles = await pom.getProfiles()

                let today = new Date()
                today.setUTCHours(0)
                today.setUTCMinutes(0)
                today.setUTCSeconds(0)

                let res = await Promise.all(
                    profiles.map(async (p) => {
                        return {
                            profile: p,
                            poms: await p.getPoms({
                                where: {
                                    createdAt: {
                                        [Op.gte]: today
                                    }
                                }
                            })
                        }
                    })
                )

                res = res.filter((r) => r.poms.length === 4)

                if (res.length > 0) {
                    let mentions = res.map((r) => `<@${r.profile.userId}>`)
                    let msg = '🔥 '

                    if (mentions > 1) {
                        msg += `${mentions.slice(0, -1).join(', ')} and ${
                            mentions[mentions.length]
                        }`
                    } else {
                        msg += mentions[0]
                    }

                    msg +=
                        (mentions.length === 1 ? ' is' : ' are') +
                        ` on a 5-pom streak! We can feel that determination there 💪`

                    let channels = CONFIG().presence.pomDoneChannels

                    for (let c of channels) {
                        let channel = BOT().client.channels.get(c)

                        if (channel) {
                            channel.send(msg).catch((e) => {
                                LOGGER().warn(
                                    { error: e },
                                    'Unable to send pom started message'
                                )
                            })
                        }
                    }
                }
            } else if (cycle.getType() === 'break') {
                // Start pom if someone pre-joined during break
                let profiles = await brk.getProfiles()

                this.sendStartedMessage(profiles)

                if (profiles.length > 0) {
                    await pom.setProfiles(profiles)
                    pom.running = true
                    pom.startedAt = new Date()
                    await pom.save()

                    // Send pom started message
                    let channels = CONFIG().presence.pomDoneChannels
                    let mentions = profiles
                        .map((p) => `<@${p.userId}>`)
                        .join(' ')
                    let message = `⚔ **A new round has started! Get to work** ಠ_ಠ (ping ${mentions})`

                    for (let c of channels) {
                        let channel = BOT().client.channels.get(c)

                        if (channel) {
                            channel.send(message).catch((e) => {
                                LOGGER().warn(
                                    { error: e },
                                    'Unable to send pom started message'
                                )
                            })
                        }
                    }
                }
            }

            this.run()
        })
    }

    sendStartedMessage(profiles) {}

    // Get last cycle
    getCurrentCycle() {
        if (this.cycles.length === 0) {
            return null
        }

        return this.cycles[this.cycles.length - 1]
    }

    // Get the current pom for a channel
    getChannelPom() {
        return Pom.getForChannel(this.channel.id)
    }

    async getChannelBreak() {
        let brk = await MODELS().Break.findOne({
            where: {
                channelId: this.channel.id,
                finished: false
            },
            order: [['createdAt', 'DESC']]
        })

        if (!brk) {
            brk = await MODELS().Break.create({
                channelId: this.channel.id,
                running: false,
                finished: false,
                length: 5
            })
        }

        return brk
    }

    // Getter for channel
    getChannel() {
        return this.channel
    }

    getDbChannel() {}
}
