//
// Main Bot class
//

const Discord = require('discord.js')
const globby = require('globby')
const path = require('path')

const CycleManager = require('./PomManager')

const Bot = {
    // Configuration file
    config: null,

    // Discord.js client
    client: null,

    // Pomodoro channel manager
    pomManager: null,

    rootCommands: new Discord.Collection(),
    commands: new Discord.Collection(),

    async run() {
        global.BOT = () => this
        global.CONFIG = () => this.config
        global.CLIENT = () => this.client

        await this.createClient()

        this.pomManager = new CycleManager(CONFIG().presence.pomChannelId)
        this.pomManager.run()

        this.client.on('message', (...a) => this.handleMessage(...a))

        LOGGER().info('Bot is ready')

        // Send a message to status channels
        for (let channelId of CONFIG().presence.statusChannels) {
            let channel = CLIENT().channels.get(channelId)

            if (channel) {
                channel.send('Bot started.').catch((e) => {
                    LOGGER().warn(
                        { error: e },
                        'Error sending bot started message'
                    )
                })
            }
        }

        this.loadCommands()
    },

    createClient() {
        this.client = new Discord.Client()

        this.client.setMaxListeners(10000)

        this.client.on('error', (e) => {
            LOGGER().warn({ error: e }, 'Client error')

            if (e.code === 'EHOSTUNREACH' || e.code === 'EAI_AGAIN') {
                // Exit the program to allow it to be rebooted by the supervisor
                setTimeout(() => process.exit(1), 250)
            }
        })

        return new Promise((resolve, reject) => {
            this.client.login(this.config.token)

            this.client.once('ready', resolve)
        })
    },

    async loadCommands() {
        let files = await globby(path.join(__dirname, 'commands', '**.js'))

        for (let file of files) {
            let mod = require(file)

            try {
                mod(this)
            } catch (e) {
                LOGGER().error(
                    { error: e },
                    `Could not load command in file ${file.slice(
                        __dirname.length + '/commands/'.length
                    )}`
                )
            }
        }
    },

    async handleMessage(message) {
        if (
            message.author.bot ||
            message.guild.id !== this.config.presence.serverId
        ) {
            return
        }

        let content = message.content.trim()

        // Prefix should be checked here
        let prefix = CONFIG().commands.prefix

        let parts = content.split(' ')

        if (
            content !== prefix.trim() &&
            !content.startsWith(prefix) &&
            !this.rootCommands.has(parts[0])
        ) {
            return
        }

        const args = content
            .slice(prefix.length)
            .trim()
            .split(/ +/g)

        if (args.length === 0) {
            args = ['']
        }

        const command = args.shift().toLowerCase()
        let handler = null

        if (this.rootCommands.has(content.split(' ')[0])) {
            handler = this.rootCommands.get(content.split(' ')[0])
        } else if (this.commands.has(command)) {
            handler = this.commands.get(command)
        }

        let member
        let isAdmin = false

        if (message.guild) {
            member = message.guild.member(message.author)

            if (
                CONFIG().permissions.admin.filter((roleId) =>
                    member.roles.has(roleId)
                ).length !== 0
            ) {
                isAdmin = true
            }
        }

        if (handler) {
            try {
                await handler({
                    message,
                    content,
                    args,
                    command,
                    channel: message.channel,
                    member,
                    isAdmin
                })
            } catch (e) {
                LOGGER().error(
                    { error: e },
                    'Error during execution of command handler'
                )
                console.log(e)
            }
        }
    }
}

module.exports = Bot
