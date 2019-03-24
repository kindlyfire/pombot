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

        // Old code
        let h = d.getHours()

        let str = `${h}:`

        if (d.getMinutes() < 10) {
            str += '0'
        }

        str += d.getMinutes()

        return str
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
