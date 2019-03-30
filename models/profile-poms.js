const Sequelize = require('sequelize')

module.exports = (db, models) => {
    models.ProfilePoms = db.define('profile_poms', {
        timeSpent: Sequelize.INTEGER
    })
}
