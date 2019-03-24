const Sequelize = require('sequelize')

module.exports = (db, models) => {
    models.ProfilePoms = db.define('profile_poms', {
        joinTime: Sequelize.INTEGER
    })
}
