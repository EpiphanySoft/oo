'use strict';

const Meta = require('./Meta.js');
const Util = require('./Util.js');

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

    constructor (config) {
        let meta = this.$meta;
        let C = this.constructor;

        if (meta.cls !== C) {
            meta = C.getMeta();
        }

        if (!meta.instances++) {
            meta.init();
        }

        this.construct();
    }

    construct () {
        //
    }

    destroy () {
        let me = this;
        let meta = me.$meta;

        me.destroy = Util.nullFn;
        me.destroying = true;

        me.destruct();

        me.destroying = false;
        me.destroyed = true;
    }

    destruct () {
        //
    }

    getMeta () {
        return this.$meta;
    }

    //-------------------------------------------------------------------------------
    // Private

    static joinMethods () {
        //
    }

    static mix (mixinCls, mixinId) {
        let meta = this.getMeta(),
            classes = meta.classes,
            mixinMeta = mixinCls.getMeta(),  // ensure all Meta's exist
            mixCls;

        if (!mixinId) {
            mixinId = mixinMeta.getMixinId();
        }

        for (mixCls = mixinCls; mixCls !== Base; mixCls = mixCls.super) {
            if (classes.has(mixCls)) {
                break;
            }

            classes.add(mixCls);
            mixinMeta = mixinCls.$meta; // earlier call to getMeta ensures this is OK
        }
    }
}

Base.isClass = true;

Base.prototype.isInstance = true;

new Meta(Base);

module.exports = Base;
