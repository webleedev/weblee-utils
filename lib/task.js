class Task {
    /**
     *
     * @param {{input: String, output: String: options: Object}} meta - meta data describing task
     */
    constructor(meta) {
        if (meta) {
            Object.keys(meta).forEach(key => this[key] = meta[key])
        }
    }
}

module.exports = Task;