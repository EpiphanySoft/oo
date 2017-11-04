'use strict';

const Config = require('./Config.js');
const Meta = require('./Meta.js');

module.exports = {
    //-----------------------------------------------------------------------
    // Classes

    /**
     * Defines method chains for a class.
     *
     * For example:
     *
     *      @define({
     *          chains: 'init'
     *      })
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
    define (options) {
        return C => {
            if (!C.define) {
                Meta.adopt(C);
            }

            C.define(options);
        }
    },

    /**
     * Declares the applyMixins id for this class. This is used by classes that applyMixins the
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
     *              // Helper applyMixins... but we can call it directly:
     *
     *              this.mixins.helper.something.call(this, x);
     *          }
     *      }
     */
    mixinId (mixinId) {
        return C => {
            C.applyMixinId(mixinId);
        }
    },

    //-----------------------------------------------------------------------
    // Methods

    /**
     * This decorator is applied to class methods that have multiple base class and/or
     * applyMixins "super" methods.
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
            fn[Meta.symbols.junction] = true;
        }
    },

    //-----------------------------------------------------------------------
    // Configs

    initial (instance, name, descriptor) {
        Config.addMeta(descriptor, 'initial', true);
    },

    lazy (instance, name, descriptor) {
        Config.addMeta(descriptor, 'lazy', true);
    },

    merge (fn) {
        return (instance, name, descriptor) => {
            Config.addMeta(descriptor, 'merge', fn);
        }
    }
};
