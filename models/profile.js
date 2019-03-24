const Sequelize = require('sequelize')

module.exports = (db, models) => {
    models.Profile = db.define('profiles', {
        // User information
        userId: Sequelize.STRING,
        tag: Sequelize.STRING,
        avatarURL: Sequelize.STRING
    })
}
