const Sequelize = require('sequelize')

module.exports = (db, models) => {
    models.Counter = db.define('counters', {
        slug: Sequelize.STRING,
        description: Sequelize.STRING,
        startedAt: Sequelize.DATE
    })
}
