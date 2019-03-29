//
// Main Bot class
//

const Discord = require('discord.js')

const CycleManager = require('./PomManager2')

const Bot = {
    // Configuration file
    config: null,

    // Discord.js client
    client: null,

    // Pomodoro channel manager
    pomManager: null,

    commandMap: new Discord.Collection(),

    async run() {
        global.BOT = () => this
        global.CONFIG = () => this.config
        global.CLIENT = () => this.client

        await this.createClient()

        this.pomManager = new CycleManager(CONFIG().presence.pomChannelId)
        this.pomManager.run()

        this.commandMap.set(CONFIG().commands.raid, `raid`)

        // Load command handlers
        // this.handlers = require('./handlers')(this)

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

    handleMessage(message) {
        if (
            message.author.bot ||
            message.guild.id !== this.config.presence.serverId
        ) {
            return
        }

        let content = message.content.trim()

        if (this.commandMap.has(content)) {
            content = CONFIG().commands.prefix + this.commandMap.get(content)
        }

        // Prefix should be checked here
        let prefix = CONFIG().commands.prefix

        if (content !== prefix.trim() && !content.startsWith(prefix)) {
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

        console.log(command, args, content)

        // // Slice the 404 handler off
        // let handlers = this.handlers.slice(1)

        // for (let h of handlers) {
        //     for (let c of h.commands) {
        //         if (message.content.startsWith(c)) {
        //             h.handler(message)
        //             return
        //         }
        //     }
        // }

        // 404 message handler
        // this.handlers[0].handler(message)
    }
}

module.exports = Bot
