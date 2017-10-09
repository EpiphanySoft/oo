'use strict';

const Util = require('./Util.js');
const { define } = require('./decorators.js');

@define({
    chains: [ 'ctor', 'dtor' ],

    processors: {
        chains: null,
        mixins: 'chains',
        config: 'mixins'
    },

    prototype: {
        configuring: false,
        constructing: true,
        destroying: false,
        destroyed: false
    }
})
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

        if (config || meta.configs) {
            me.configuring = true;

            me.configure(config);

            me.configuring = false;
        }

        if (meta.liveChains.ctor) {
            meta.callChain(me, 'ctor');
        }
    }

    configure (config) {
        this.configure = Util.nullFn;
        this.$meta.configure(this, config);
    }

    destroy () {
        let me = this;

        me.destroy = Util.nullFn;
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

    reconfigure (config) {
        let me = this;

        me.configuring = true;
        me.$meta.reconfigure(me, config);
        me.configuring = false;
    }
}

module.exports = Base;
