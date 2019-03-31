//
//     One pomodoro cycle
//
// Each cycle is basically a pomodoro
//

const EventEmitter = require('events').EventEmitter
const TIGroup = require('../../utils/TIGroup')
const ReactionButtonGroup = require('../../utils/ReactionButtonGroup')
const Pom = require('../../pom')

const PomCycleDisplay = require('./PomCycleDisplay')

module.exports = class PomCycle extends EventEmitter {
    constructor(parent, pom) {
        super()

        // Save a reference to CycleManager
        this.parent = parent

        // Save a reference to the database Pom
        this.pom = pom

        // Each cycle/pom is bound to a message
        this.message = null

        // Display
        this.display = new PomCycleDisplay(this)

        // Timing group
        this.tiGroup = new TIGroup()

        // Reaction buttons
        this.buttonGroup = new ReactionButtonGroup()

        // Setup logger
        this.log = LOGGER().child({ component: 'PomCycle' })

        // Function to run on finish
        this._finish = null

        // Startup program
        this.start()
    }

    getType() {
        return 'pom'
    }

    start() {
        if (this.pom.running) {
            // Resume a running pom
            this.setupUpdateTimers()

            return
        }

        // Edit message to display not running pom
        this.display.updateNoPom()
    }

    clearListeners() {
        this.tiGroup.clearAll()
        this.buttonGroup.clearAll()
    }

    async setupUpdateTimers() {
        let timeIncrements = CONFIG().embedSettings.updateInterval

        // Clear any previous timings
        this.tiGroup.clearAll()

        this._finish = async () => {
            this.log.debug('Cycle finished')

            this.clearListeners()
            this._finish = null

            this.pom.finished = true
            this.pom.running = false
            await this.pom.save()

            // Update information card
            let info = await this.getInformation()

            // Delete pom message
            if (this.message) {
                this.message.delete().catch((e) => {
                    this.log.error(
                        { error: e },
                        'Error during deletion of pom message'
                    )
                })
            }

            // Send done message in channels
            if (info.raw.participants.length > 0) {
                let mentions = info.raw.participants.map(
                    (p) => `<@${p.userId}>`
                )
                let msg = `**Round Has Ended! Take a 5 minute breather. You deserve it** 👍\nParticipants in Last Round's Raid: ${mentions.join(
                    ', '
                )}`

                for (let channelId of CONFIG().presence.pomDoneChannels) {
                    let channel = CLIENT().channels.get(channelId)

                    if (channel) {
                        channel.send(msg).catch((e) => {
                            this.log.error(
                                { error: e },
                                'Error during sending of pom finished message'
                            )
                        })
                    }
                }
            }

            // Clear reactions on old message (not updated anymore)
            // if (this.message) {
            //     this.message.clearReactions().catch((e) => {
            //         this.log.warn(
            //             { error: e },
            //             'Could not remove reactions on old pom message'
            //         )
            //     })
            // }

            this.emit('end')
        }

        const update = async () => {
            let info = await this.getInformation()

            this.log.debug(`PomCycle[update] T-${info.raw.timeLeft}`)

            this.display.updateRunning(info).catch((e) => {
                this.log.error(
                    { error: e },
                    'Error during update of Cycle display'
                )
            })

            if (info.raw.timeLeft * 1000 > timeIncrements + 1500) {
                this.tiGroup.setTimeout(update, timeIncrements)
            } else {
                this.tiGroup.setTimeout(this._finish, info.raw.timeLeft * 1000)
            }
        }

        update()

        this.log.info('PomCycle[started]')
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

    // Join a user to a pom
    async joinUser(user) {
        let r = await Pom.addUser(this.parent.getChannel().id, {
            id: user.id,
            tag: user.tag,
            avatarURL: user.displayAvatarURL
        })

        if (!this.pom.running) {
            this.pom.running = true
            this.pom.startedAt = new Date()
            await this.pom.save()

            this.setupUpdateTimers()
        }

        return r
    }

    async leaveUser(user) {
        await Pom.removeUser(this.parent.getChannel().id, {
            id: user.id,
            tag: user.tag,
            avatarURL: user.displayAvatarURL
        })

        let info = await this.getInformation()

        if (info.raw.participants.length === 0) {
            this.clearListeners()

            this.pom.running = false
            this.pom.startedAt = null
            await this.pom.save()

            this.log.info('PomCycle[stopped]')

            this.message = null

            this.start()
        }
    }

    // editMessage creates the message if necessary
    async editMessage(data) {
        let channel = this.parent.getChannel()

        if (!this.message && this.pom.messageId) {
            try {
                this.message = await channel.fetchMessage(this.pom.messageId)

                this.log.debug('Loaded existing Cycle message')

                this.setupReactionsListeners()
            } catch (e) {
                // 10008 is "Unknown Message" error. Do not log that.
                if (e.code !== 10008) {
                    this.log.error(
                        { error: e },
                        'Could not fetch Cycle message'
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
                this.log.warn({ error: e }, 'Could not edit Cycle message')
            }
        }

        try {
            this.message = await channel.send(data)

            this.setupReactionsListeners()

            // Update message in database
            this.pom.messageId = this.message.id
            this.pom.save()
        } catch (e) {
            this.log.error({ error: e }, 'Could not create Cycle message')
        }
    }

    //
    // GETTERS
    //

    // Get pom information
    getInformation() {
        return Pom.getInformation(this.pom.id)
    }
}
