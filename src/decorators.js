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

        fn[Meta.symbols.junction] = true;
    },

    //-----------------------------------------------------------------------
    // Configs

    cached (instance, name, descriptor) {
        Config.addMeta(descriptor, 'cached', true);
    },

    /**
     * Defines the initial value of a config. This value will be applied without running
     * through the normal apply/update process when set during construction.
     *
     * For example
     *
     *      @define({
     *          config: {
     *              @initial
     *              disabled: false
     *          }
     *      })
     *      class Foo extends Widget {
     *      }
     *
     * The above indicates that the `disabled` config has an initial state that is
     * described by `false`. When an instance is created using this value for `disabled`
     * the `applyDisabled` and `updateDisabled` sequence is bypassed.
     */
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
    },

    /**
     * Declares that a classes configs are open. This means that the config object given
     * to the constructor can contain non-config properties. These will be copied to the
     * instance as simple properties.
     *
     *      @define({
     *          @open
     *          config: {
     *              ...
     *          }
     *      })
     *      class Foo extends Widget {
     *      }
     */
    open (instance, name, descriptor) {
        let value = descriptor.initializer();

        value[Config.symbols.open] = true;

        // descriptor.initializer = () => value;
    }
};
