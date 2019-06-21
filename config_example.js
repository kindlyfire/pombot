//
// Configuration file
// This is the exact file used by KOA, minus some private credentials
//

module.exports = {
    // Discord bot token
    token: '',

    commands: {
        prefix: '!rb ',
        raid: '!raid'
    },

    // Emojis used by the bot
    emojis: {
        joinPom: '559395438831337472',
        leavePom: '559395225731203072'
    },

    // Roles that grant some permissions
    permissions: {
        admin: [
            '386181538665988104',
            '473304691485310976',
            '547898687578177540'
        ]
    },

    // Where the bot will be present
    presence: {
        serverId: '382364344731828224',

        // What channel will be entirelly managed by the bot to display the current running pom
        pomChannelId: '556942513823416372',

        // Channels the "!raid" command works in
        raidChannels: ['556942513823416372', '382364344731828226'],

        // Channels the bot will notify in on pom done
        pomDoneChannels: ['382364344731828226'],

        statusChannels: []
    },

    messages: {
        info: `Hi ! I'm the Raid Master, manager of KOA pomodoro raids. A pomodoro raid is a group activity where members join a synchronised 25 minutes long timer using the Pomodoro Technique. <:pomodoro:529483142927745024>

A pomodoro raid can be called anytime using the \`!raid\` command in <#382364344731828226>. Anyone will be able to join and <#556942513823416372> will show the status of the raid. See you soon 👋`
    },

    // Settings for the embeds the bot sends
    embedSettings: {
        // Update interval of pom in milliseconds
        // NEVER SET THIS UNDER TEN SECONDS (10000)
        // THIS WOULD BE UNNECESSARY LOAD ON THE DISCORD SERVERS
        updateInterval: 10000,

        // Author display on embeds
        author: {
            name: '🍅 RAAAIIID!',
            icon: '',
            url: ''
        }
    },

    // MySQL database information
    mysql: {
        host: 'localhost',
        user: '',
        database: '',
        password: ''
    }
}
