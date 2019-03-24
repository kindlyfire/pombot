//
//     Display manager for the pomodoro display
//

const Discord = require('discord.js')
const Pom = require('../../pom')
const TIGroup = require('../../utils/TIGroup')
const EventEmitter = require('events').EventEmitter

module.exports = class PomDisplayer extends EventEmitter {
    constructor(pom) {
        super()

        if (!pom) throw new Error('No valid instance of models.Pom passed')

        this.pom = pom
        this.cachedMessage = null
        this.tiGroup = new TIGroup()
        this.skip = 0
        this.updateCount = 0
    }

    // Get the status message in a safe way
    // Meaning it will be created if it got deleted
    async getMessage() {
        let channel = CLIENT().channels.get(this.pom.channelId)

        if (this.pom.messageId) {
            try {
                let msg = await channel.fetchMessage(this.pom.messageId)

                if (!this.cachedMessage || this.cachedMessage.id !== msg.id) {
                    this.emit('newMessage', msg)
                }

                this.cachedMessage = msg

                return msg
            } catch (e) {}
        }

        let msg = await this.createMessage(channel)

        // Save new message ID
        this.pom.messageId = msg.id
        await this.pom.save()

        this.cachedMessage = msg
        this.emit('newMessage', msg)

        return msg
    }

    getCachedMessage() {
        return this.cachedMessage
    }

    // Create a "Loading..." message that will later
    // be edited. Contains the join/leave reactions.
    async createMessage(channel) {
        let msg = await channel.send({
            embed: await embeds.Loading()
        })

        await msg.react(CONFIG().emojis.joinPom)
        await msg.react(CONFIG().emojis.leavePom)

        return msg
    }

    // Run the displayer
    // Runs .update() every once in a while
    async start() {
        this.update()

        this.tiGroup.setInterval(
            () => this.update(),
            CONFIG().embedSettings.updateInterval
        )
    }

    // Stop the displayer
    async pause() {
        this.tiGroup.clearAll()
    }

    // Do the *real* updating
    async update() {
        this.updateCount += 1

        let pom = this.pom
        let msg = await this.getMessage()
        let info = await Pom.getInformation(this.pom.id)

        if (this.skip > 0) {
            this.skip -= 1
            return
        }

        // Stop updating if there is no time left
        if (
            pom.running &&
            info.raw.timeLeft < CONFIG().embedSettings.updateInterval / 1000 &&
            this.updateCount > 1
        ) {
            this.pause()
        }

        if (pom.running) {
            this.updateRunning(info)
        } else if (pom.finished) {
            this.updateFinished(info)
        } else {
            await msg.edit({
                embed: embeds.NotRunning()
            })
        }
    }

    async updateRunning(info) {
        let msg = this.getCachedMessage()

        if (!msg) {
            msg = await this.getMessage()
        }

        await msg.edit({
            embed: embeds.Running(info)
        })
    }

    async updateFinished(info) {
        let msg = this.getCachedMessage()

        if (!msg) {
            msg = await this.getMessage()
        }

        await msg.edit({
            embed: embeds.Finished(info)
        })
    }
}

const embeds = {
    DefaultEmbed() {
        let embedConfig = BOT().config.embedSettings.author

        return new Discord.RichEmbed()
            .setAuthor(embedConfig.name, embedConfig.icon, embedConfig.url)
            .setColor(0xe55b40)
    },

    Loading() {
        return this.DefaultEmbed().setDescription('Loading...')
    },

    NotRunning() {
        return this.DefaultEmbed()
            .setDescription(
                'No pomodoro raid is running at the moment. You may start one at any time by pressing the blue circle button.'
            )
            .setFooter(
                'Pomodoro timers are 25 minutes long timers where you work on something alongside other people.'
            )
    },

    // info: return value of Pom.getInformation()
    Running(info) {
        let participants = info.participants.map((p) => {
            let parts = p.split('#')
            return `**${parts[0]}**#${parts[1]}`
        })

        return this.DefaultEmbed()
            .setDescription(
                `There is a 25-minute pomodoro timer ongoing. You may join in at any time by clicking the blue circle or leave with the red circle.`
            )
            .addField('Started at', info.startedAt, true)
            .addField('Time left', info.timeLeft, true)
            .addField(
                'Participants',
                `(${participants.length}) ${participants.join(', ') || '-'}`
            )
            .setFooter(
                // `"My general attitude to life is to enjoy every minute of every day" — Richard Branson`
                `"The way to get started is to quit talking and begin doing" — Walt Disney`
            )
    },

    Finished(info) {
        let participants = info.participants.map((p) => {
            let parts = p.split('#')
            return `**${parts[0]}**#${parts[1]}`
        })

        return this.DefaultEmbed()
            .setDescription(
                `This pomodoro timer has ended. Congrats to all who made it through the hard journey of productivity !`
            )
            .addField('Started at', info.startedAt, true)
            .addField(
                'Participants',
                `(${participants.length}) ${participants.join(', ') || '-'}`,
                true
            )
    }
}
