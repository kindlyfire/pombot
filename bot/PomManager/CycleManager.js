//
//     Pomodoro Cycle Manager
//
// Manage the pomodoro process of a channel
//

const Pom = require('../../pom')
const PomCycle = require('./PomCycle')
const BreakCycle = require('./BreakCycle')

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
            } else if (cycle.getType() === 'break') {
                // Start pom if someone pre-joined during break
                let profiles = await brk.getProfiles()

                this.sendStartedMessage(profiles)

                if (profiles.length > 0) {
                    await pom.setProfiles(profiles)
                    pom.running = true
                    pom.startedAt = new Date()
                    await pom.save()
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
