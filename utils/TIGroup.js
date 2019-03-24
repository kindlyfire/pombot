//
//     Timeout Interval Group (TIGroup)
//

module.exports = class TIGroup {
    constructor() {
        this.timeouts = []
        this.intervals = []
    }

    clearAll() {
        this.timeouts.map(clearTimeout)
        this.intervals.map(clearInterval)

        this.timeouts = []
        this.intervals = []
    }

    setInterval(f, ms) {
        this.intervals.push(setInterval(f, ms))
    }

    setTimeout(f, ms) {
        let id = setTimeout(() => {
            // Call the function
            f()

            // Remove it from the timeouts
            this.timeouts = this.timeouts.filter((t) => t !== id)
        }, ms)

        this.timeouts.push(id)
    }
}
