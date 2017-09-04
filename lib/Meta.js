'use strict';

const Configlet = require('./Configlet.js');

class Meta {
    constructor (cls, superclass = null) {
        let $meta = {
            value: this
        };

        Object.defineProperty(cls, '$meta', $meta);
        Object.defineProperty(cls.prototype, '$meta', $meta);

        this.cls = cls;
        this.superclass = superclass;
        this.superMeta = superclass ? null : superclass.$meta;
    }

    addConfigs (configs) {

    }
}

module.exports = Meta;
