//
//     Class handling the display for a Cycle
//

const Discord = require('discord.js')

module.exports = class PomCycleDisplay {
    constructor(parent) {
        this.parent = parent
    }

    updateNoPom() {
        return this.parent.editMessage({
            embed: embeds.NoPom()
        })
    }

    updateRunning(info) {
        return this.parent.editMessage({
            embed: embeds.Running(info)
        })
    }

    updateFinished(info) {
        return this.parent.editMessage({
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
    },

    // info: return value of Pom.getInformation()
    Running(info) {
        let participants = info.participants.map((p) => {
            let parts = p.split('#')
            return `**${parts[0]}**#${parts[1]}`
        })

        return this.DefaultEmbed()
            .setDescription(
                `There is a 25-minute pomodoro timer ongoing. You may join in at any time by clicking the blue circle or leave with the red circle. This message updates every ${Math.round(
                    CONFIG().embedSettings.updateInterval / 1000
                )} seconds.`
            )
            .addField('Started at', info.startedAt, true)
            .addField(
                'Ends at',
                `${info.endsAt} (${info.timeLeftShort} from now)`,
                true
            )
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
