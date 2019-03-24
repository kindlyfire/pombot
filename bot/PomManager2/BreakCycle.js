//
//     A pause cycle
//

const EventEmitter = require('events').EventEmitter
const TIGroup = require('../../utils/TIGroup')
const utils = require('../../utils')
const BreakCycleDisplay = require('./BreakCycleDisplay')
const ReactionButtonGroup = require('../../utils/ReactionButtonGroup')
const Pom = require('../../pom')

module.exports = class BreakCycle extends EventEmitter {
    constructor(parent, brk) {
        super()

        // Save CycleManager instance
        this.parent = parent

        // Save database Break instance
        this.brk = brk

        // Timings group
        this.tiGroup = new TIGroup()

        // Display
        this.display = new BreakCycleDisplay(this)

        // Discord message
        this.message = null

        // Reaction buttons
        this.buttonGroup = new ReactionButtonGroup()

        // Child logger
        this.log = LOGGER().child({ component: 'BreakCycle' })

        // Startup
        this.start()
    }

    getType() {
        return 'break'
    }

    start() {
        if (!this.brk.running) {
            this.emit('end')

            return
        }

        this.setupUpdateTimers()
    }

    async joinUser(user) {
        let profile = await Pom.getUserProfile(user)

        return await this.brk.addProfile(profile)
    }

    async leaveUser(user) {
        let profile = await Pom.getUserProfile(user)

        return await this.brk.removeProfile(profile)
    }

    setupUpdateTimers() {
        let timeIncrement = CONFIG().embedSettings.updateInterval

        // Clear any previous timings
        this.tiGroup.clearAll()

        const finish = async () => {
            this.log.debug(`BreakCycle[finish]`)

            this.brk.running = false
            this.brk.finished = true
            await this.brk.save()

            if (this.message) {
                this.message.delete().catch((e) => {
                    console.log(e)

                    this.log.warn(
                        { error: e },
                        'BreakCycle: Failed to delete message'
                    )
                })
            }

            this.emit('end')
        }

        const update = async () => {
            let info = await this.getInformation()

            this.log.debug(`BreakCycle[update] T-${info.timeLeft}s`)

            if (info.timeLeft > 0) {
                this.display.updateRunning(info).catch((e) => {
                    console.log(e)
                    this.log.warn(
                        { error: e },
                        'Failed to update BreakCycle message'
                    )
                })
            }

            if (info.timeLeft > timeIncrement / 1000 + 5) {
                this.tiGroup.setTimeout(update, timeIncrement)
            } else {
                this.tiGroup.setTimeout(finish, info.timeLeft * 1000)
            }
        }

        update()

        this.log.info('BreakCycle[started]')
    }

    // Create buttons for join/leave to pom
    async setupReactionsListeners() {
        if (!this.message) {
            this.log.debug(
                'setupReactionsListeners called without instanciated message'
            )
        }

        let reactions = this.message.reactions

        // Add reactions if they are not yet there
        if (
            !reactions.find((r) =>
                [r.emoji.name, r.emoji.id].includes(CONFIG().emojis.joinPom)
            )
        ) {
            await this.message.react(CONFIG().emojis.joinPom)

            this.log.debug('Added join reaction to PomCycle message')
        }

        if (
            !reactions.find((r) =>
                [r.emoji.name, r.emoji.id].includes(CONFIG().emojis.leavePom)
            )
        ) {
            await this.message.react(CONFIG().emojis.leavePom)

            this.log.debug('Added leave reaction to PomCycle message')
        }

        // Create reaction button for join
        this.buttonGroup.createButton(
            this.message,
            CONFIG().emojis.joinPom,
            (user) => {
                this.log.debug(`User ${user.tag} reacted with join emoji`)

                this.joinUser(user)
            }
        )

        // Create reaction button for leave
        this.buttonGroup.createButton(
            this.message,
            CONFIG().emojis.leavePom,
            (user) => {
                this.log.debug(`User ${user.tag} reacted with leave emoji`)

                this.leaveUser(user)
            },
            true
        )

        this.log.debug('Listening for reactions to Cycle message')
    }

    // Return information about this break (like time left)
    async getInformation() {
        let brk = await MODELS().Break.findOne({
            where: { id: this.brk.id },
            include: [MODELS().Profile]
        })

        let startedAt = utils.dateToUTC(brk.startedAt)
        let now = utils.dateNowUTC()

        let endsAt = new Date(startedAt)
        endsAt.setMinutes(endsAt.getMinutes() + brk.length)

        // Time left in seconds
        let timeLeft = Math.floor(
            this.brk.length * 60 -
                (utils.dateNowUTC() - startedAt.getTime()) / 1000
        )

        return {
            startedAt,
            endsAt,
            timeLeft,
            participants: brk.profiles
        }
    }

    // editMessage creates the message if necessary
    async editMessage(data) {
        let channel = this.parent.getChannel()

        if (!this.message && this.brk.messageId) {
            try {
                this.message = await channel.fetchMessage(this.brk.messageId)

                this.log.info('Loaded existing BreakCycle message')

                this.setupReactionsListeners()
            } catch (e) {
                // 10008 is "Unknown Message" error. Do not log that.
                if (e.code !== 10008) {
                    this.log.warn(
                        { error: e },
                        'Could not fetch BreakCycle message'
                    )
                }
            }
        }

        if (this.message) {
            // Editing the message could fail if it got deleted somehow
            try {
                await this.message.edit(data)
                return
            } catch (e) {
                this.log.warn({ error: e }, 'Could not edit BreakCycle message')
            }
        }

        try {
            this.message = await channel.send(data)

            this.setupReactionsListeners()

            // Update message in database
            this.brk.messageId = this.message.id
            this.brk.save()
        } catch (e) {
            this.log.error({ error: e }, 'Could not create BreakCycle message')
        }
    }
}
