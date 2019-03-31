//
// Utility functions
//

module.exports = {
    dateToUTC(od) {
        return new Date(od.getTime() + od.getTimezoneOffset() * 60000)
    },

    dateNowUTC() {
        return Date.now() + new Date().getTimezoneOffset() * 60000
    },

    timeDisplayHourMin(d) {
        return d.toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        })
    },

    formatSeconds(s) {
        let str = ''

        if (s > 3600) {
            let h = Math.floor(s / 3600)
            s = s % 3600

            str += `${h}h`
        }

        if (s > 60) {
            let m = Math.floor(s / 60)
            s = s % 60

            str += ` ${m}m`
        }

        if (s > 0 || str === '') {
            str += ` ${s}s`
        }

        return str.trim()
    },

    formatPosition(n) {
        let map = {
            0: 'th',
            1: 'st',
            2: 'nd',
            3: 'rd'
        }

        if ((n >= 10 && n <= 20) || n % 10 > 3) {
            return `${n}th`
        }

        return `${n}${map[n % 10]}`
    },

    timeoutAsync(ms, f) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (f) {
                    f()
                        .then(resolve)
                        .catch(reject)
                } else {
                    resolve()
                }
            }, ms)
        })
    }
}
