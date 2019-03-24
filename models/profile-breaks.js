const Sequelize = require('sequelize')

module.exports = (db, models) => {
    models.ProfileBreaks = db.define('profile_breaks', {})
}
