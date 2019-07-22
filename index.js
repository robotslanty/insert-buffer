const EventEmitter = require('events');

module.exports = class InsertBuffer extends EventEmitter {
    constructor(tableName, options = {}) {
        super();
        const defaults = {
            size: 1000,
            useIgnore: false,
            useReplace: false,
            onDuplicateKeyUpdate: false,
        };
        this.options = { ...defaults, ...options };
        this.tableName = tableName;
        this.cols = [];
        this.lines = [];
        this.bind = [];
        this.promises = [];
    }

    async end() {
        this._drain();
        await Promise.all(this.promises);
        return true;
    }

    add(data) {
        if (!this.cols.length) {
            this.cols = Object.keys(data);
        }

        this.lines.push(this.getPlaceholders(data));
        this.bind = this.bind.concat(Object.values(data));

        if (this.lines.length >= this.options.size) {
            this._drain();
        }
    }

    _drain() {
        if (this.lines.length) {
            const query = [];

            if (this.options.useIgnore) {
                query.push('INSERT IGNORE');
            } else if (this.options.useReplace) {
                query.push('REPLACE');
            } else {
                query.push('INSERT');
            }

            query.push('INTO ' + this.tableName + ' (`' + this.cols.join('`, `') + '`) VALUES');
            query.push(this.lines.join(',\n'));

            if (this.options.onDuplicateKeyUpdate) {
                query.push('ON DUPLICATE KEY UPDATE ' + this.options.onDuplicateKeyUpdate);
            }

            const waitFor = (promise) => {
                this.promises.push(promise);
            };

            this.emit('drain', query.join('\n') + ';', this.bind, waitFor);
            this.lines = [];
            this.bind = [];
        }
    }

    getPlaceholders(data) {
        return '(' + Array(Object.values(data).length).fill('?').join(', ') + ')';
    }
}