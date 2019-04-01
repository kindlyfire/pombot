//
//     Display methods for BreakCycle
//

const Discord = require('discord.js')
const utils = require('../../utils')

module.exports = class BreakCycleDisplay {
    constructor(parent) {
        // Save BreakCycle instance
        this.parent = parent
    }

    updateRunning(info) {
        return this.parent.editMessage({
            embed: embeds.Running(info)
        })
    }
}

const embeds = {
    DefaultEmbed() {
        let embedConfig = BOT().config.embedSettings.author

        return new Discord.RichEmbed()
            .setAuthor(embedConfig.name, embedConfig.icon, embedConfig.url)
            .setColor(0xbaed91)
    },

    Running(info) {
        let participants = info.participants.map((p) => {
            let parts = p.tag.split('#')
            return `**${parts[0]}**#${parts[1]}`
        })

        let embed = this.DefaultEmbed()
            .setTitle('Break')
            .setDescription(
                `There is a five-minutes break ongoing. Next pom will start soon ! This message updates every ${Math.round(
                    CONFIG().embedSettings.updateInterval / 1000
                )} seconds.`
            )
            .addField(
                'Started at',
                `${utils.timeDisplayHourMin(info.startedAt)} UTC`,
                true
            )
            .addField(
                'Ends at',
                `${utils.timeDisplayHourMin(info.endsAt)} UTC (~${Math.floor(
                    info.timeLeft / 60
                )}m ${info.timeLeft % 60}s from now)`,
                true
            )

            .setFooter(
                // `"My general attitude to life is to enjoy every minute of every day" — Richard Branson`
                `"The way to get started is to quit talking and begin doing" — Walt Disney`
            )

        if (participants.length > 0) {
            embed.addField(
                'Participants for next pom',
                `(${participants.length}) ${participants.join(', ') || '-'}`
            )
        }

        return embed
    }
}
