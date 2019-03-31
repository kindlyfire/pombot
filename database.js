const Sequelize = require('sequelize')

const autoloadModels = [
    'pom',
    'profile',
    'profile-poms',
    'break',
    'profile-breaks',
    'counter',
    '_relations'
]
const models = {}

module.exports = async (config) => {
    const db = new Sequelize(
        config.mysql.database,
        config.mysql.user,
        config.mysql.password,
        {
            host: config.mysql.host,
            dialect: 'mysql',

            pool: {
                max: 5,
                min: 1
            },

            logging: true
        }
    )

    await db.authenticate()

    // Load models
    for (let m of autoloadModels) {
        await require('./models/' + m)(db, models)
    }

    LOGGER().info('Database is ready')

    return { db, models }
}
