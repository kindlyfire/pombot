const Sequelize = require('sequelize')

module.exports = (db, models) => {
    models.Break = db.define('breaks', {
        // Discord channel ID
        channelId: Sequelize.STRING,

        // Discord message ID
        messageId: Sequelize.STRING,

        // When the pom has started
        startedAt: Sequelize.DATE,

        // How long, in minutes, that the break is
        length: Sequelize.INTEGER,

        running: Sequelize.BOOLEAN,
        finished: Sequelize.BOOLEAN
    })
}
