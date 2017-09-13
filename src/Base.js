'use strict';

const Meta = require('./Meta.js');
const Util = require('./Util.js');

const JunctionSymbol = Symbol('methodJunction');

const instanceSkip = new Util.Empty({
    constructor: 1,
    ctor: 1,
    dtor: 1,
    $meta: 1,
    super: 1
});
const staticSkip = new Util.Empty({
    prototype: 1,
    length: 1,
    name: 1,
    $meta: 1,
    super: 1
});

class Base {
    static addConfigs (configs) {
        this.getMeta().addConfigs(configs);
    }

    static define (options) {

    }

    static getMeta () {
        let meta = this.$meta;

        if (meta.class !== this) {
            meta = new Meta(this, Object.getPrototypeOf(this));
        }

        return meta;
    }

    constructor (config) {
        let meta = this.$meta;
        let C = this.constructor;

        if (meta.class !== C) {
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

    static Junction (target, name, descriptor) {
        let fn = descriptor.value;

        if (typeof fn === 'function') {
            fn[JunctionSymbol] = true;
        }
    }

    static addJunction (isStatic, key, method) {
        let target = this;
        let shim = target.$meta.getShim(isStatic);
        let sup = target.super;

        if (!isStatic) {
            sup = sup.prototype;
        }

        method.fns = [];

        // A junction calls the true super method and all mixin methods and returns the
        // return value of the first method called.
        shim[key] = method.$junction = function (...args) {
            let called = sup[key];
            let result = called && called.apply(this, args);
            let res;

            for (let fn of method.fns) {
                res = fn.apply(this, args);

                if (!called) {
                    called = true;
                    result = res;
                }
            }

            return result;
        };
    }

    static mix (mixinCls, mixinId) {
        let me = this;
        let meta = me.getMeta();
        let classes = meta.classes;
        let mixinMeta = mixinCls.getMeta();  // ensure all Meta's exist
        let beforeCount = classes.size;
        let instanceMap = new Util.Empty();
        let staticsMap = new Util.Empty();
        let existing, fn, i, isStatic, k, key, keys, map, members, mixCls, mixMeta, prop,
            skip, target;

        if (meta.complete) {
            Util.raise(`Too late apply a mixin into this class`);
        }

        if (!mixinId) {
            mixinId = mixinMeta.getMixinId();
        }

        for (mixCls = mixinCls; mixCls !== Base; mixCls = mixCls.super) {
            if (classes.has(mixCls)) {
                break;
            }

            classes.add(mixCls);
            mixMeta = mixCls.$meta; // earlier call to getMeta ensures this is OK
            mixMeta.init();  // mark the class as complete since we cannot update later

            // Start with instance side members:
            isStatic = false;
            map = instanceMap;
            skip = instanceSkip;
            target = me.prototype;

            for (members = mixMeta.getMembers(); members; members = members.statics) {
                keys = members.keys;
                k = keys.length;

                for (i = 0; i < k; ++i) {
                    key = keys[i];
                    if (skip[key] || map[key]) { // TODO filter ctor/dtor et al
                        continue;
                    }

                    map[key] = true;
                    prop = members.props[key];
                    fn = prop.value;
                    fn = (typeof fn === 'function') && fn;

                    if (fn && !fn.$owner) {
                        fn.$owner = mixCls;
                    }

                    if (!(key in target)) {
                        Object.defineProperty(target, key, prop);
                    }
                    else if (fn && target.hasOwnProperty(key)) {
                        existing = target[key];
                        if (!existing.$owner) {
                            existing.$owner = me;
                        }

                        /*
                            @Junction
                            foo (x, y) {
                                super.foo(x, y);
                            }
                        */
                        if (existing[JunctionSymbol] && existing.$owner === me) {
                            // We could have previously mixed in a method from a class
                            // that was also a Junction, so we need to check that the
                            // method belongs to the target class.
                            if (!existing.fns) {
                                me.addJunction(isStatic, key, existing);
                            }

                            existing.fns.push(fn);
                        }
                    }
                }

                // Switch over to statics for next loop
                isStatic = true;
                map = staticsMap;
                skip = staticSkip;
                target = me;
            }

        }

        if (beforeCount !== classes.size) {
            classes.addAll(mixinMeta.classes);
        }

        meta.invalidateMembers();
    }
}

Base.JunctionSymbol = JunctionSymbol;

Base.isClass = true;

Base.prototype.isInstance = true;

new Meta(Base);

module.exports = Base;
