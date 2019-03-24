//
//     Manager for multiple reaction buttons
//

const ReactionButton = require('./ReactionButton')

module.exports = class ReactionButtonGroup {
    constructor() {
        this.buttons = []
    }

    createButton(...args) {
        let button = new ReactionButton(...args)

        this.buttons.push(button)

        return button
    }

    clearAll() {
        for (let b of this.buttons) {
            b.off()
        }

        this.buttons = []
    }
}
