'use strict';

const Meta  = require('./Meta.js');
const { nullFn } = require('./Util.js');

class Base {
    constructor (...args) {
        let me = this;
        let C = me.constructor;
        let meta = me.$meta;

        if (meta.class !== C) {
            meta = C.getMeta();
        }

        // After the above code has executed "this.$meta" will always be valid for an
        // instance. This is a helpful performance gain since it allows us to avoid a
        // method call every time we want the meta class.

        if (!meta.instances++ && !meta.completed) {
            meta.complete();
        }

        me.construct(...args);
    }

    construct (config) {
        let me = this;
        let meta = me.$meta;

        if (meta.configs[Meta.symbols.hasConfigs]) {
            me.config = {};
            me.configure(config);
        }
        else {
            if (config) {
                Object.assign(me, config);
            }

            me.configGen = 1;
        }

        if (meta.liveChains.ctor) {
            meta.callChain(me, 'ctor');
        }
    }

    configure (config) {
        this.$meta.configure(this, config);
    }

    destroy () {
        let me = this;

        me.destroy = nullFn;
        me.destroying = true;

        me.destruct();

        me.destroyed = true;
    }

    destruct () {
        let meta = this.$meta;

        if (meta.liveChains.dtor) {
            meta.callChain(this, 'dtor', null, true);
        }
    }

    callChain (method, ...args) {
        this.$meta.callChain(this, method, args);
    }

    callChainRev (method, ...args) {
        this.$meta.callChain(this, method, args, true);
    }

    getMeta () {
        return this.$meta;
    }
}

Meta.adopt(Base);

Base.define({
    chains: [ 'ctor', 'dtor' ],

    processors: {
        properties: null,
        prototype: 'properties',
        static: 'prototype',
        chains: 'static',
        mixins: 'chains',
        config: 'mixins'

        // mixinId and processors are deliberately not defined. The "mixinId" processor
        // is only of use when the class is mixed in to another class (so it has no
        // interaction with other aspects of the class on which it is used). As for the
        // "processors" processor, because it defines other processors, it is hoisted to
        // the first in every case.
    },

    properties: {
        isInstance: {
            value: true
        },
        configuring: {
            value: false,
            writable: true
        },
        constructing: {
            value: true,
            writable: true
        },
        destroying: {
            value: false,
            writable: true
        },
        destroyed: {
            value: false,
            writable: true
        }
    },

    prototype: {
        configGen: 0,
        afterConfigure: null,
        beforeConfigure: null
    }
});

module.exports = Base;
