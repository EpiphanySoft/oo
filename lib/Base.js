'use strict';

const Meta = require('./Meta.js');

class Base {
    static addConfigs (configs) {
        this.getMeta().addConfigs(configs);
    }

    static define (options) {

    }

    static getMeta () {
        let meta = this.$meta;

        if (meta.cls !== this) {
            meta = new Meta(this, Object.getPrototypeOf(this));
        }

        return meta;
    }

    getMeta () {
        let meta = this.$meta;
        let C = this.constructor;

        if (meta.cls !== C) {
            meta = C.getMeta();
        }

        return meta;
    }

    constructor (config) {
        //
    }

    destroy () {

    }
}

Base.prototype.isInstance = true;

new Meta(Base);

module.exports = Base;
