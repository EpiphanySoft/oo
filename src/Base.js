'use strict';

const Meta = require('./Meta.js');
const Processor = require('./Processor.js');
const Util = require('./Util.js');
const Empty = Util.Empty;

const JunctionSym = Symbol('junction');

const instanceSkip = new Empty({
    constructor: 1,

    $meta: 1,
    super: 1
});

const staticSkip = new Empty({
    prototype: 1,
    length: 1,
    name: 1,

    $meta: 1,
    super: 1
});

class Base {
    constructor (config) {
        let C = this.constructor;
        let meta = this.$meta;

        if (meta.class !== C) {
            meta = C.getMeta();
        }

        if (!meta.instances++ && !meta.completed) {
            meta.complete();
        }

        this.construct();
    }

    construct () {
        let meta = this.$meta;

        if (meta.liveChains.ctor) {
            meta.callChain(this, 'ctor');
        }
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

    static define (options) {
        let processors = options.processors;

        if (processors) {
            delete options.processors;
            this.applyProcessors(processors);
        }

        processors = this.getMeta().getProcessors();

        for (let proc of processors) {
            let name = proc.name;

            if (name in options) {
                this[proc.applier](options[name]);
                delete options[name];
            }
        }

        for (let key in options) {
            let applier = Processor.getApplierName(key);

            if (this[applier]) {
                this[applier](options[key]);
            }
            else {
                Util.raise(`Invalid class option: ${key}`);
            }
        }

        return this;
    }

    static getMeta () {
        let meta = this.$meta;

        if (meta.class !== this) {
            meta = new Meta(this, Object.getPrototypeOf(this));
        }

        return meta;
    }

    //-------------------------------------------------------------------------------
    // Private

    static applyChains (chains) {
        this.getMeta().addChains(chains);
    }

    static applyConfig (configs) {
        this.getMeta().addConfigs(configs);
    }

    static applyMixinId (mixinId) {
        this.getMeta().mixinId = mixinId;
    }

    static applyMixins (mixinCls) {
        let me = this;

        if (Array.isArray(mixinCls)) {
            mixinCls.forEach(me.applyMixins, me);
            return;
        }

        let prototype = me.prototype;
        let meta = me.getMeta();
        let chains = meta.getChains();
        let bases = meta.bases;
        let mixinMeta = mixinCls.getMeta();  // ensure all Meta's exist
        let mixinId = mixinMeta.getMixinId();
        let instanceMap = new Empty();
        let staticsMap = new Empty();
        let existing, fn, i, isStatic, k, key, keys, map, members, mixCls,
            mixMeta, prop, skip, target;

        if (me.constructor.isPrototypeOf(mixinCls)) {
            Util.raise('Cannot mix a derived class into a super class');
        }
        if (!Base.isPrototypeOf(mixinCls)) {
            Util.raise(`Mixins must extend Base`);
        }
        if (meta.completed) {
            Util.raise(`Too late apply a mixin into this class`);
        }

        mixinMeta.complete();

        if (mixinId) {
            let mixins = meta.getMixins();

            if (!mixins[mixinId]) {
                mixins[mixinId] = mixinCls;
                prototype.mixins[mixinId] = mixinCls.prototype;
            }
        }

        for (mixCls = mixinCls; mixCls !== Base; mixCls = mixCls.super) {
            if (bases.has(mixCls)) {
                break;
            }

            mixMeta = mixCls.$meta; // earlier call to getMeta ensures this is OK

            // Start with instance side members:
            isStatic = false;
            map = instanceMap;
            skip = instanceSkip;
            target = prototype;

            for (members = mixMeta.getMembers(); members; members = members.statics) {
                keys = members.keys;
                k = keys.length;

                for (i = 0; i < k; ++i) {
                    if (skip[key = keys[i]]) {
                        continue;
                    }

                    prop = members.props[key];

                    fn = prop.value;
                    fn = (typeof fn === 'function') && fn;
                    if (fn && !fn.$owner) {
                        fn.$owner = mixCls;
                    }

                    if (map[key]) {
                        continue;
                    }
                    map[key] = true;

                    if (!isStatic && chains[key]) {
                        continue;
                    }

                    if (!(key in target)) {
                        Object.defineProperty(target, key, prop);
                    }
                    else if (fn && target.hasOwnProperty(key)) {
                        existing = target[key];
                        if (!existing.$owner) {
                            existing.$owner = me;
                        }

                        if (existing[JunctionSym] && existing.$owner === me) {
                            // We could have previously mixed in a method from a class
                            // that was also a Junction, so we need to check that the
                            // method belongs to the target class.
                            if (!existing.fns) {
                                me.createJunction(isStatic, key, existing);
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

        bases.addAll(mixinMeta.bases).add(mixinCls);
    }

    static applyProcessors (processors) {
        let meta = this.getMeta();

        meta.processors = Processor.decode(processors, meta.getProcessors());
    }

    static applyPrototype (members) {
        Object.assign(this.prototype, members);
    }

    static applyStatic (members) {
        Object.assign(this, members);
    }

    static createJunction (isStatic, key, method) {
        let cls = this;
        let shim = cls.$meta.getShim(isStatic);
        let sup = cls.super;

        if (!isStatic) {
            sup = sup.prototype;
        }

        method.fns = [];

        // A junction calls the true super method and all applyMixins methods and
        // returns the return value of the first method called.
        shim[key] = method[JunctionSym] = function (...args) {
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
}

Base.isClass = true;

Base.symbols = {
    junction: JunctionSym
};

Base.mixins = new Empty();

Base.prototype.isInstance = true;
Base.prototype.mixins = new Empty();

new Meta(Base);

Base.define({
    chains: [ 'ctor', 'dtor' ],

    processors: {
        chains: null,
        config: 'mixins',
        mixins: 'chains'
    }
});

module.exports = Base;
