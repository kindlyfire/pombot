//
//     Handle reactions to pomodoro button
//

const Pom = require('../../pom')
const ReactionButton = require('../../utils/ReactionButton')

module.exports = class ReactionsHandler {
    constructor(pom, pomDisplayer) {
        if (!pom) throw new Error('No valid instance of models.Pom passed')

        this.pom = pom
        this.pomDisplayer = pomDisplayer
        this.listeners = []
        this.msg = null
    }

    async start() {
        this.pomDisplayer.on('newMessage', this.onNewStatusMessage.bind(this))
    }

    stop() {
        this.pomDisplayer.off('newMessage', this.onNewStatusMessage)
        this.clearListeners()
    }

    onNewStatusMessage(msg) {
        this.clearListeners()
        this.msg = msg
        this.setListeners()
    }

    setListeners() {
        this.listeners.push(
            new ReactionButton(
                this.msg,
                CONFIG().emojis.joinPom,
                async (user) => {
                    console.log('[JOIN] Clicked by ' + user.tag)

                    await Pom.addUser(this.msg.channel.id, {
                        id: user.id,
                        tag: user.tag,
                        avatarURL: user.displayAvatarURL
                    })

                    if (!this.pom.running) {
                        this.pom.running = true
                        this.pom.startedAt = new Date()
                        await this.pom.save()

                        // Update display
                        await this.pomDisplayer.update()
                        this.pomDisplayer.skip += 1
                    }
                }
            )
        )

        this.listeners.push(
            new ReactionButton(
                this.msg,
                CONFIG().emojis.leavePom,
                async (user) => {
                    await Pom.removeUser(this.msg.channel.id, {
                        id: user.id,
                        tag: user.tag,
                        avatarURL: user.displayAvatarURL
                    })
                }
            )
        )
    }

    // Clear all ReactionButtons
    clearListeners() {
        for (let l of this.listeners) {
            l.off()
        }

        this.listeners = []
    }
}
