//
// Utility to create buttons from reactions to a message
//

const EventEmitter = require('events').EventEmitter

module.exports = class ReactionButton extends EventEmitter {
    constructor(message, emojiName, callback, removeReaction = false) {
        super()

        this.message = message
        this.emojiName = emojiName
        this.callback = callback
        this.removeReaction = removeReaction

        this.boundedHandlerAdd = (...a) => this.handlerAdd(...a)
        this.boundedHandlerRemove = (...a) => this.handlerRemove(...a)

        message.client.on('messageReactionAdd', this.boundedHandlerAdd)
        message.client.on('messageReactionRemove', this.boundedHandlerRemove)
    }

    // Handler for event
    async handlerAdd(reaction, user) {
        if (
            // Ignore reactions by the bot
            user.id === this.message.client.user.id ||
            // Ignore reactions not on the message we are handling
            reaction.message.id !== this.message.id ||
            // Ignore reactions with a different name
            (reaction.emoji.name !== this.emojiName &&
                reaction.emoji.id !== this.emojiName)
        )
            return

        this.callback(user)

        // It's a button, so remove the reaction again
        //
        // Because this would be called a lot, we only use it where
        //  really required
        if (this.removeReaction) {
            await reaction.remove(user)
        }
    }

    async handlerRemove(reaction, user) {
        if (
            // Ignore reactions by the bot
            user.id === this.message.client.user.id ||
            // Ignore reactions not on the message we are handling
            reaction.message.id !== this.message.id ||
            // Ignore reactions with a different name
            (reaction.emoji.name !== this.emojiName &&
                reaction.emoji.id !== this.emojiName)
        )
            return

        this.emit('remove', user)
    }

    // Remove listener
    off() {
        this.message.client.off('messageReactionAdd', this.boundedHandlerAdd)
        this.message.client.off(
            'messageReactionRemove',
            this.boundedHandlerRemove
        )

        this.removeAllListeners()
    }
}
