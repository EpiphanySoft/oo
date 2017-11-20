'use strict';

const { Empty, prototype } = require('./Util.js');

@prototype({
    defaults: null,

    // The array of Config instances that need to be initialized per-instance
    inits: null,

    initsMap: null,

    names: null,  // [ 'collapsed', 'disabled', 'text' ]  (sorted)

    open: false
})
class Configs {
    constructor (superConfigs = null) {
        let me = this;

        me.super = superConfigs;

        if (superConfigs) {
            me.defs = Object.create(superConfigs.defs);
            me.inherited = Object.create(superConfigs.inherited);
            me.values = Object.create(superConfigs.values);
        }
        else {
            me.defs = new Empty(
                // title: Config.get('title')
            );

            me.inherited = new Empty({
                hasConfigs: false
            });

            me.values = new Empty(
                // title: 'hello'
            );
        }
    }

    extend () {
        return new Configs(this);
    }
}

module.exports = Configs;
