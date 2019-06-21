# Pomodoro Bot

This Discord bot was created for the [Knights of Academia](https://knightsofacademia.org/) Discord server ([invite](https://discord.gg/EYX7XGG)). It handles what we call pomodoro raids, group pomodoro timers. A _pom_ or _pomodoro_ is simply a focused work session of 25 minutes. The _Pomodoro Technique_ involves alternating work periods of 25 minutes, with rest periods of 5 minutes. A _Pomorodo Raids_ is the group version of this technique, allowing multiple people to use the same timer at the same time.

Features:

-   Alternating 25 minutes of work and 5 minutes of break
-   Join/leave with reactions
-   Automatically stops when everyone leaves, does not run when no-one joins
-   All data is saved in the database
-   Includes a leaderboard command
-   Clock that updates at a configurable interval

![Screenshot](screenshot.png?raw=true)

## Installation

This bot was created solely for [Knights of Academia](https://knightsofacademia.org/). That said, the code is not locked in to their Discord server and is fully configurable. Example configuration is available in `config_example.js`. The configuration file name will be named `config.js`:

```bash
# Run using the configuration from `config.js`
node index.js
```

Database models are in the `models/` directory. You could use those and let [Sequelize](http://docs.sequelizejs.com/) sync the database up for you. You'll have to figure this out using their examples though. The code is also pretty well documented, although if I were to start a project like this again it wouldn't at all be implemented this way again.

## Contributing

This project is not actively developed anymore. That said, if you have anything interesting to propose, feel free to reach out to `kindly#0001` on the support server of my Quarko bot ([invite](https://discord.gg/wmA6Bzf)).
