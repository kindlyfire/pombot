//
//     PomManager manages a channel containing a pom
//

const Pom = require('../../pom')
const Discord = require('discord.js')
const PomDisplayer = require('./PomDisplayer')
const ReactionsHandler = require('./ReactionsHandler')

const utils = require('../../utils')

module.exports = class PomManager {
    constructor(channel) {
        this.channel = channel
        this.pom = null

        this.pomDisplayer = null
        this.reactionsHandler = null

        // When the pom ends
        this.pomEndTimeout = null

        // Just after the last update before the pom ends
        this.pomBeforeEndTimeout = null
    }

    reset() {
        if (this.pomDisplayer) {
            this.pomDisplayer.pause()
        }

        if (this.reactionsHandler) {
            this.reactionsHandler.stop()
        }

        this.pom = null

        clearTimeout(this.pomEndTimeout)
        clearTimeout(this.pomBeforeEndTimeout)
    }

    async run() {
        this.reset()

        let pom = (this.pom = await Pom.getForChannel(this.channel.id))

        this.pomDisplayer = new PomDisplayer(pom)
        this.reactionsHandler = new ReactionsHandler(pom, this.pomDisplayer)

        this.reactionsHandler.start()
        this.pomDisplayer.start()

        if (pom.running) {
            this.addEndTimeout()
        }

        // Listen for the new pom event, to add timeout
        Pom.pomStartedHandlers = [
            (pom) => {
                if (pom.id === this.pom.id) {
                    // Update local copy of pom
                    this.pom = pom

                    this.addEndTimeout()
                }
            }
        ]
    }

    // Add timeout for when the pom ends
    async addEndTimeout() {
        clearTimeout(this.pomEndTimeout)
        let pomInfo = await Pom.getInformation(this.pom.id)

        this.pomEndTimeout = setTimeout(async () => {
            this.endPom()
        }, pomInfo.raw.timeLeft * 1000)

        this.pomBeforeEndTimeout = setTimeout(async () => {
            await this.pomDisplayer.pause()
        }, pomInfo.raw.timeLeft * 1000 - CONFIG().embedSettings.updateInterval)
    }

    async endPom() {
        if (!this.pom || this.pom.finished) return

        let pom = this.pom
        let pomInfo = await Pom.getInformation(this.pom.id)

        // Update db info
        pom.running = false
        pom.finished = true
        await pom.save()

        // Update display card
        await this.pomDisplayer.pause()
        await this.pomDisplayer.updateFinished(pomInfo)

        // Stop the reaction handler
        await this.reactionsHandler.stop()

        // Send pom done message
        let mentions = pomInfo.raw.participants.map((p) => `<@${p.userId}>`)

        // await this.channel.send(
        //     `Hold up fellow pommers ✋ ! Drop everything, the pom is done ! (ping ${mentions.join(
        //         ' '
        //     )})`
        // )

        // Send messages indicating that the pom is done in other channels
        for (let channelId of CONFIG().presence.pomDoneChannels) {
            let channel = CLIENT().channels.get(channelId)

            if (channel) {
                channel
                    .send(
                        `**Round Has Ended! Take a 5 minute breather. You deserve it** 😌\nParticipants in Last Round's Raid: ${mentions.join(
                            ', '
                        )}`
                    )
                    .catch(console.error)
            }
        }

        // Re-run manager
        this.run()

        return

        // Remove reactions to that message
        await this.managedMessage.clearReactions()
    }
}

const embeds = {
    DefaultEmbed() {
        let embedConfig = BOT().config.embedAuthorDefaults

        return new Discord.RichEmbed()
            .setAuthor(embedConfig.name, embedConfig.icon, embedConfig.url)
            .setColor(0xe55b40)
    },

    NoPom() {
        return this.DefaultEmbed()
            .setDescription(
                'No pomodoro timer is running at the moment. You may start one at any time by pressing the blue circle button.'
            )
            .setFooter(
                'Pomodoro timers are 25 minutes long timers where you work on something alongside other people.'
            )
    },

    PomDone() {
        return this.DefaultEmbed().setDescription(
            'This pomodoro timer has ended. Congrats to all who made it through the hard journey of productivity !'
        )
    }
}
