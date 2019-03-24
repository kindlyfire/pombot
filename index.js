//
// Discord Pomodoro bot made for the Knights of Academia community
//
// Author: Tijl Van den Brugghen <me@tijlvdb.me>
//

const config = require('./config')
const Bot = require('./bot')
const Pom = require('./pom')
const bunyan = require('bunyan')

const database = require('./database')

const logger = bunyan.createLogger({
    name: 'pombot',
    level: 'debug'
})
global.LOGGER = () => logger

const start = async () => {
    // Set configuration
    Bot.config = config
    Pom.config = config

    // Connect to database
    const { db, models } = await database(config)

    global.MODELS = () => models

    // Set database
    Pom.db = db
    Pom.models = models

    // Start discord bot
    Bot.run()
}

start().catch((e) => {
    console.log(e)
})
