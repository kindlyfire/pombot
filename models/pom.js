const Sequelize = require('sequelize')

module.exports = (db, models) => {
    models.Pom = db.define('poms', {
        // Discord channel ID
        channelId: Sequelize.STRING,

        // Discord message ID
        messageId: Sequelize.STRING,

        // When the pom has started
        startedAt: Sequelize.DATE,

        running: Sequelize.BOOLEAN,
        finished: Sequelize.BOOLEAN
    })
}
