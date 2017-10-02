'use strict';

const Base = require('./Base.js');
const Config = require('./Config.js');
const symbols = Base.symbols;

module.exports = {
    /**
     * Defines method chains for a class.
     *
     * For example:
     *
     *      @chains('init')
     *      class Foo extends Base {
     *          constructor (config) {
     *              super(config);
     *
     *              this.callChain('init');
     *          }
     *
     *          init () {
     *          }
     *      }
     */
    chains (...methods) {
        return C => {
            C.getMeta().addChains(...methods);
        };
    },

    define (options) {
        return C => {
            let chains = options.chains;
            let mixins = options.mixins;
            let mixinId = options.mixinId;

            if (chains) {
                C.getMeta().addChains(chains);
            }
            if (mixins) {
                C.mixin(mixins);
            }
            if (mixinId) {
                C[symbols.mixinId] = mixinId;
            }
        }
    },

    lazy (instance, name) {
        Config.addMeta(instance, name, 'lazy', true);
    },

    merge (fn) {
        return (instance, name) => {
            Config.addMeta(instance, name, 'merge', fn);
        }
    },

    /**
     * Declares the mixin id for this class. This is used by classes that mixin the
     * class an need to address it directly.
     *
     * For example
     *
     *      @mixinId('helper')
     *      class Helper extends Base {
     *          something (x) {
     *          }
     *      }
     *
     *      @define({
     *          mixins: [ Helper ]
     *      })
     *      class Foo extends Base {
     *          something (x) {
     *              // this method hides the method by this name in the
     *              // Helper mixin... but we can call it directly:
     *
     *              this.mixins.helper.something.call(this, x);
     *          }
     *      }
     */
    mixinId (mixinId) {
        return C => {
            C[symbols.mixinId] = mixinId;
        }
    },

    /**
     * This decorator is applied to class methods that have multiple base class and/or
     * mixin "super" methods.
     *
     * For example:
     *
     *      class Foo extends Base {
     *          @junction
     *          bar (x, y) {
     *              super.bar(x, y);
     *          }
     *      }
    */
    junction (targetCls, name, descriptor) {
        let fn = descriptor.value;

        if (typeof fn === 'function') {
            fn[symbols.junction] = true;
        }
    }
};
