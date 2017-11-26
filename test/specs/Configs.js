const expect = require('assertly').expect;

const Config = require('../../src/Config.js');
const Widget = require('../../src/Widget.js');

const { cached, define, initial, lazy, merge, open } = require('../../src/decorators.js');

function getKeys (object, own) {
    let keys = [];

    for (let key in object) {
        if (!own || object.hasOwnProperty(key)) {
            keys.push(key);
        }
    }

    keys.sort();

    return keys;
}

function getValues (object, own) {
    let values = [];

    for (let key of getKeys(object, own)) {
        values.push(object[key]);
    }

    return values;
}

function getAllKeys (object) {
    return getKeys(object, false);
}

function getAllValues (object) {
    return getValues(object, false);
}

function getOwnKeys (object) {
    return getKeys(object, true);
}

function getOwnValues (object) {
    return getValues(object, true);
}

describe('Configs', function () {
    describe('internals', function () {
        it('should define basic config', function () {
            @define({
                config: {
                    foo: 123
                }
            })
            class Foo extends Widget {}

            let widgetMeta = Widget.getMeta();
            let widgetConfigs = widgetMeta.getConfigs();
            expect(widgetConfigs).to.be(null);

            widgetConfigs = widgetMeta.configs;
            expect(widgetConfigs.open).to.be(false);

            let fooMeta = Foo.getMeta();
            let configs = fooMeta.configs.defs;
            let configValues = fooMeta.configs.values;

            expect(fooMeta.configs.open).to.be(false);

            let names = Object.keys(configs);

            expect(names).to.equal([ 'foo' ]);

            names = Object.keys(configValues);

            expect(names).to.equal([ 'foo' ]);

            let values = Object.values(configValues);

            expect(values).to.equal([ 123 ]);

            expect(configs.foo.owner).to.be(null);
            expect(configs.foo.lazy).to.be(false);
            expect(configs.foo.cached).to.be(false);

            let inst = new Foo({
                bar: 456
            });

            expect(inst.foo).to.be(123);

            // Not "open" by default
            expect(inst.bar).to.be(undefined);
            expect('bar' in inst).to.be(false);

            inst.foo = 456;
            expect(inst.foo).to.be(456);

            expect(inst[Config.symbols.values]).to.flatly.equal({
                foo: 456
            });
        });

        it('should define basic, open config', function () {
            @define({
                @open
                config: {
                    foo: 123
                }
            })
            class Foo extends Widget {}

            let fooMeta = Foo.getMeta();
            let configs = fooMeta.configs.defs;
            let configValues = fooMeta.configs.values;
            let names = Object.keys(configs);

            let widgetMeta = Widget.getMeta();

            expect(widgetMeta.getConfigs()).to.be(null);
            expect(widgetMeta.configs.open).to.be(false);

            expect(fooMeta.configs.open).to.be(true);

            expect(names).to.equal([ 'foo' ]);

            names = Object.keys(configValues);

            expect(names).to.equal([ 'foo' ]);

            let values = Object.values(configValues);

            expect(values).to.equal([ 123 ]);

            expect(configs.foo.owner).to.be(null);
            expect(configs.foo.lazy).to.be(false);
            expect(configs.foo.cached).to.be(false);

            let inst = new Foo({
                bar: 321
            });

            expect(inst.foo).to.be(123);
            expect(inst.bar).to.be(321);

            inst.foo = 456;
            expect(inst.foo).to.be(456);

            expect(inst[Config.symbols.values]).to.flatly.equal({
                foo: 456
            });
        });

        it('should define lazy config', function () {
            let log = [];

            @define({
                config: {
                    @lazy
                    foo: 123
                }
            })
            class Foo extends Widget {
                fooChange (value, oldValue) {
                    log.push([ 'change', value, oldValue ]);
                    return value;
                }

                fooUpdate (value, oldValue) {
                    log.push([ 'update', value, oldValue ]);
                }
            }

            let fooMeta = Foo.getMeta();
            let configs = fooMeta.configs.defs;
            let configValues = fooMeta.configs.values;
            let names = Object.keys(configs);

            expect(names).to.equal([ 'foo' ]);

            names = Object.keys(configValues);

            expect(names).to.equal([ 'foo' ]);

            let values = Object.values(configValues);

            expect(values).to.equal([ 123 ]);

            expect(configs.foo.owner).to.be(Foo);
            expect(configs.foo.lazy).to.be(true);
            expect(configs.foo.cached).to.be(false);

            let inst = new Foo();

            expect(log).to.equal([]);

            expect(inst.foo).to.be(123);  // ask for it...

            expect(log).to.equal([
                [ 'change', 123, undefined ],
                [ 'update', 123, undefined ]
            ]);
        });

        it('should define lazy config w/custom merge', function () {
            let mergeFn = (value, oldValue) => {};

            @define({
                config: {
                    @lazy
                    @merge(mergeFn)
                    foo: 123
                }
            })
            class Foo extends Widget {}

            let fooMeta = Foo.getMeta();
            let configs = fooMeta.configs.defs;
            let configValues = fooMeta.configs.values;
            let names = Object.keys(configs);

            expect(names).to.equal([ 'foo' ]);

            names = Object.keys(configValues);

            expect(names).to.equal([ 'foo' ]);

            let values = Object.values(configValues);

            expect(values).to.equal([ 123 ]);

            expect(configs.foo.owner).to.be(Foo);
            expect(configs.foo.cached).to.be(false);
            expect(configs.foo.lazy).to.be(true);
            expect(configs.foo.merge).to.be(mergeFn);
        });

        it('should inherit basic config', function () {
            @define({
                config: {
                    foo: 123
                }
            })
            class Bar extends Widget {}

            class Foo extends Bar {}

            let fooMeta = Foo.getMeta();
            let configs = fooMeta.getConfigs(true).defs;
            let configValues = fooMeta.configs.values;
            let names = Object.keys(configs);

            expect(names).to.equal([ ]);

            names = getAllKeys(configs);

            expect(names).to.equal([ 'foo' ]);

            names = Object.keys(configValues);

            expect(names).to.equal([ ]);

            names = getAllKeys(configValues);

            expect(names).to.equal([ 'foo' ]);

            let values = Object.values(configValues);

            expect(values).to.equal([ ]);

            values = getAllValues(configValues);

            expect(values).to.equal([ 123 ]);
        });

        it('should mixin only new configs', function () {
            @define({
                config: {
                    foo: 123,
                    bar: 'xyz',
                    zip: 'zap'
                }
            })
            class Bar extends Widget {}

            @define({
                config: {
                    zip: 'woot'
                }
            })
            class Super extends Widget {}

            @define({
                mixins: Bar,
                config: {
                    foo: 456
                }
            })
            class Foo extends Super {}

            let fooMeta = Foo.getMeta();
            let configs = fooMeta.configs.defs;
            let configValues = fooMeta.configs.values;

            expect(configs).to.have.only.keys('foo', 'bar', 'zip');

            expect(configValues).to.have.only.keys('foo', 'bar','zip');

            expect(configValues).to.flatly.equal({
                foo: 456,
                bar: 'xyz',
                zip: 'woot'
            });

            let barMeta = Bar.getMeta();

            expect(configs.foo === configs.foo).to.be(true);
            expect(configs.foo.owner).to.be(null);
        });

        it('should populate the inits array and map w/no handler methods', function () {
            const array = [];
            const fn = () => {};
            const re = /abc/;
            const date = new Date();
            const object = {};

            @define({
                config: {
                    // These primitive properties (w/o handlers) should just go to the
                    // class "defaults" object:

                    prop1: null,
                    prop2: undefined,

                    prop3: 123,

                    prop4: true,
                    prop5: false,

                    prop6: 'hello',

                    prop7: fn,

                    // These require initialization per-instance:

                    prop8: re,

                    prop9: date,

                    prop10: array,
                    prop11: object
                }
            })
            class Foo extends Widget {}

            let fooMeta = Foo.getMeta();
            let fooConfigs = fooMeta.configs;

            expect(fooConfigs.inits).to.be(null);
            expect(fooConfigs.initsMap).to.be(null);

            let inst = new Foo();
            let initProps = fooConfigs.inits.map(cfg => cfg.name);

            expect(initProps).to.equal([ 'prop10', 'prop11', 'prop8', 'prop9' ]);

            let keys = Object.keys(fooConfigs.initsMap);
            keys.sort();

            expect(keys).to.equal(initProps);

            expect(inst.prop1).to.be(null);
            expect(inst.prop2).to.be(undefined);
            expect(inst.prop3).to.be(123);
            expect(inst.prop4).to.be(true);
            expect(inst.prop5).to.be(false);
            expect(inst.prop6).to.be('hello');
            expect(inst.prop7).to.be(fn);
            expect(inst.prop8).to.be(re);
            expect(inst.prop9).to.be(date);
            expect(inst.prop10).to.be(array);
            expect(inst.prop11).to.be(object);

            const values = inst[Config.symbols.values];

            expect(values.prop1).to.be(null);
            expect(values.prop2).to.be(undefined);
            expect(values.prop3).to.be(123);
            expect(values.prop4).to.be(true);
            expect(values.prop5).to.be(false);
            expect(values.prop6).to.be('hello');
            expect(values.prop7).to.be(fn);
            expect(values.prop8).to.be(re);
            expect(values.prop9).to.be(date);
            expect(values.prop10).to.be(array);
            expect(values.prop11).to.be(object);

            expect(values).to.have.only.own.keys(
                'prop8', 'prop9', 'prop10', 'prop11'
            );

            const defaults = Object.getPrototypeOf(values);

            expect(defaults.prop1).to.be(null);
            expect(defaults.prop2).to.be(undefined);
            expect(defaults.prop3).to.be(123);
            expect(defaults.prop4).to.be(true);
            expect(defaults.prop5).to.be(false);
            expect(defaults.prop6).to.be('hello');
            expect(defaults.prop7).to.be(fn);

            expect(defaults).to.have.only.own.keys(
                'prop1', 'prop2', 'prop3', 'prop4', 'prop5', 'prop6', 'prop7'
            );
        });

        it('should populate the inits array and map w/change methods', function () {
            const array = [];
            const fn = () => {};
            const re = /abc/;
            const date = new Date();
            const object = {};

            @define({
                config: {
                    // These should just go to the class "defaults" object:

                    prop1: null,
                    prop2: undefined,

                    // These require initialization per-instance:

                    prop3: 123,

                    prop4: true,
                    prop5: false,

                    prop6: 'hello',

                    prop7: fn,

                    prop8: re,

                    prop9: date,

                    prop10: array,
                    prop11: object
                }
            })
            class Foo extends Widget {
                prop1Change (v) { return v; }
                prop2Change (v) { return v; }
                prop3Change (v) { return v; }
                prop4Change (v) { return v; }
                prop5Change (v) { return v; }
                prop6Change (v) { return v; }
                prop7Change (v) { return v; }
                prop8Change (v) { return v; }
                prop9Change (v) { return v; }
                prop10Change (v) { return v; }
                prop11Change (v) { return v; }
            }

            let fooMeta = Foo.getMeta();
            let fooConfigs = fooMeta.configs;

            expect(fooConfigs.inits).to.be(null);
            expect(fooConfigs.initsMap).to.be(null);

            let inst = new Foo();
            let initProps = fooConfigs.inits.map(cfg => cfg.name);

            expect(initProps).to.equal([
                'prop10', 'prop11',
                'prop3', 'prop4', 'prop5', 'prop6', 'prop7', 'prop8', 'prop9'
            ]);

            let keys = Object.keys(fooConfigs.initsMap);
            keys.sort();

            expect(keys).to.equal(initProps);

            expect(inst.prop1).to.be(null);
            expect(inst.prop2).to.be(undefined);
            expect(inst.prop3).to.be(123);
            expect(inst.prop4).to.be(true);
            expect(inst.prop5).to.be(false);
            expect(inst.prop6).to.be('hello');
            expect(inst.prop7).to.be(fn);
            expect(inst.prop8).to.be(re);
            expect(inst.prop9).to.be(date);
            expect(inst.prop10).to.be(array);
            expect(inst.prop11).to.be(object);

            const values = inst[Config.symbols.values];

            expect(values.prop1).to.be(null);
            expect(values.prop2).to.be(undefined);
            expect(values.prop3).to.be(123);
            expect(values.prop4).to.be(true);
            expect(values.prop5).to.be(false);
            expect(values.prop6).to.be('hello');
            expect(values.prop7).to.be(fn);
            expect(values.prop8).to.be(re);
            expect(values.prop9).to.be(date);
            expect(values.prop10).to.be(array);
            expect(values.prop11).to.be(object);

            expect(values).to.have.only.own.keys(
                'prop3', 'prop4', 'prop5', 'prop6', 'prop7', 'prop8', 'prop9',
                'prop10', 'prop11'
            );

            const defaults = Object.getPrototypeOf(values);

            expect(defaults.prop1).to.be(null);
            expect(defaults.prop2).to.be(undefined);

            expect(defaults).to.have.only.own.keys('prop1', 'prop2');
        });

        it('should populate the inits array and map w/update methods', function () {
            const array = [];
            const fn = () => {};
            const re = /abc/;
            const date = new Date();
            const object = {};

            @define({
                config: {
                    // These should just go to the class "defaults" object:

                    prop1: null,
                    prop2: undefined,

                    // These require initialization per-instance:

                    prop3: 123,

                    prop4: true,
                    prop5: false,

                    prop6: 'hello',

                    prop7: fn,

                    prop8: re,

                    prop9: date,

                    prop10: array,
                    prop11: object
                }
            })
            class Foo extends Widget {
                prop1Update (v) { return v; }
                prop2Update (v) { return v; }
                prop3Update (v) { return v; }
                prop4Update (v) { return v; }
                prop5Update (v) { return v; }
                prop6Update (v) { return v; }
                prop7Update (v) { return v; }
                prop8Update (v) { return v; }
                prop9Update (v) { return v; }
                prop10Update (v) { return v; }
                prop11Update (v) { return v; }
            }

            let fooMeta = Foo.getMeta();
            let fooConfigs = fooMeta.configs;

            expect(fooConfigs.inits).to.be(null);
            expect(fooConfigs.initsMap).to.be(null);

            let inst = new Foo();
            let initProps = fooConfigs.inits.map(cfg => cfg.name);

            expect(initProps).to.equal([
                'prop10', 'prop11',
                'prop3', 'prop4', 'prop5', 'prop6', 'prop7', 'prop8', 'prop9'
            ]);

            let keys = Object.keys(fooConfigs.initsMap);
            keys.sort();

            expect(keys).to.equal(initProps);

            expect(inst.prop1).to.be(null);
            expect(inst.prop2).to.be(undefined);
            expect(inst.prop3).to.be(123);
            expect(inst.prop4).to.be(true);
            expect(inst.prop5).to.be(false);
            expect(inst.prop6).to.be('hello');
            expect(inst.prop7).to.be(fn);
            expect(inst.prop8).to.be(re);
            expect(inst.prop9).to.be(date);
            expect(inst.prop10).to.be(array);
            expect(inst.prop11).to.be(object);

            const values = inst[Config.symbols.values];

            expect(values.prop1).to.be(null);
            expect(values.prop2).to.be(undefined);
            expect(values.prop3).to.be(123);
            expect(values.prop4).to.be(true);
            expect(values.prop5).to.be(false);
            expect(values.prop6).to.be('hello');
            expect(values.prop7).to.be(fn);
            expect(values.prop8).to.be(re);
            expect(values.prop9).to.be(date);
            expect(values.prop10).to.be(array);
            expect(values.prop11).to.be(object);

            expect(values).to.have.only.own.keys(
                'prop3', 'prop4', 'prop5', 'prop6', 'prop7', 'prop8', 'prop9',
                'prop10', 'prop11'
            );

            const defaults = Object.getPrototypeOf(values);

            expect(defaults.prop1).to.be(null);
            expect(defaults.prop2).to.be(undefined);

            expect(defaults).to.have.only.own.keys('prop1', 'prop2');
        });

        it('should populate the inits array and map w/initial and updater', function () {
            const fn = () => {};
            const re = /abc/;
            const date = new Date();

            @define({
                config: {
                    // These should just go to the class "defaults" object:

                    prop1: null,
                    prop2: undefined,

                    // These require initialization per-instance:

                    @initial
                    prop3: 123,

                    @initial
                    prop4: true,
                    @initial
                    prop5: false,

                    @initial
                    prop6: 'hello',

                    @initial
                    prop7: fn,

                    @initial
                    prop8: re,

                    @initial
                    prop9: date
                }
            })
            class Foo extends Widget {
                prop1Update (v) { return v; }
                prop2Update (v) { return v; }
                prop3Update (v) { return v; }
                prop4Update (v) { return v; }
                prop5Update (v) { return v; }
                prop6Update (v) { return v; }
                prop7Update (v) { return v; }
                prop8Update (v) { return v; }
                prop9Update (v) { return v; }
            }

            let fooMeta = Foo.getMeta();
            let fooConfigs = fooMeta.configs;

            expect(fooConfigs.inits).to.be(null);
            expect(fooConfigs.initsMap).to.be(null);

            let inst = new Foo();
            let initProps = fooConfigs.inits.map(cfg => cfg.name);

            expect(initProps).to.equal([]);

            let keys = Object.keys(fooConfigs.initsMap);
            keys.sort();

            expect(keys).to.equal(initProps);

            expect(inst.prop1).to.be(null);
            expect(inst.prop2).to.be(undefined);
            expect(inst.prop3).to.be(123);
            expect(inst.prop4).to.be(true);
            expect(inst.prop5).to.be(false);
            expect(inst.prop6).to.be('hello');
            expect(inst.prop7).to.be(fn);
            expect(inst.prop8).to.be(re);
            expect(inst.prop9).to.be(date);

            const values = inst[Config.symbols.values];

            expect(values.prop1).to.be(null);
            expect(values.prop2).to.be(undefined);
            expect(values.prop3).to.be(123);
            expect(values.prop4).to.be(true);
            expect(values.prop5).to.be(false);
            expect(values.prop6).to.be('hello');
            expect(values.prop7).to.be(fn);
            expect(values.prop8).to.be(re);
            expect(values.prop9).to.be(date);

            expect(values).to.have.only.own.keys(/* none */);

            const defaults = Object.getPrototypeOf(values);

            expect(defaults.prop1).to.be(null);
            expect(defaults.prop2).to.be(undefined);

            expect(defaults).to.have.only.own.keys(
                'prop1', 'prop2', 'prop3', 'prop4', 'prop5', 'prop6', 'prop7', 'prop8',
                'prop9'
            );
        });

        it('should populate the defaults object w/cached configs', function () {
            const array = [];
            const fn = () => {};
            const re = /abc/;
            const date = new Date();
            const object = {};

            @define({
                config: {
                    @cached
                    prop1: null,

                    @cached
                    prop2: undefined,

                    @cached
                    prop3: 123,

                    @cached
                    prop4: true,
                    @cached
                    prop5: false,

                    @cached
                    prop6: 'hello',

                    @cached
                    prop7: fn,

                    @cached
                    prop8: re,

                    @cached
                    prop9: date,

                    @cached
                    prop10: array,

                    @cached
                    prop11: object
                }
            })
            class Foo extends Widget {
                prop1Change (v) { throw new Error('do not call') }
                prop2Change (v) { throw new Error('do not call') }
                prop3Change (v) { return v * 10; }
                prop4Change (v) { return !v; }
                prop5Change (v) { return !v; }
                prop6Change (v) { return v.toUpperCase(); }
                prop7Change (v) { v.foo = 1; return v; }
                prop8Change (v) { v.foo = 2; return v; }
                prop9Change (v) { v.foo = 3; return v; }
                prop10Change (v) { return ['foo'].concat(v); }
                prop11Change (v) { return { foo: 4, v }; }
            }

            let fooMeta = Foo.getMeta();
            let fooConfigs = fooMeta.configs;

            expect(fooConfigs.inits).to.be(null);
            expect(fooConfigs.initsMap).to.be(null);

            let inst = new Foo();
            let initProps = fooConfigs.inits.map(cfg => cfg.name);

            expect(initProps).to.equal([]);

            let keys = Object.keys(fooConfigs.initsMap);
            keys.sort();

            expect(keys).to.equal(initProps);

            expect(inst.prop1).to.be(null);
            expect(inst.prop2).to.be(undefined);
            expect(inst.prop3).to.be(1230);
            expect(inst.prop4).to.be(false);
            expect(inst.prop5).to.be(true);
            expect(inst.prop6).to.be('HELLO');
            expect(inst.prop7).to.be(fn);
            expect(inst.prop8).to.be(re);
            expect(inst.prop9).to.be(date);
            expect(inst.prop10).to.equal([ 'foo' ]);
            expect(inst.prop11).to.equal({ foo: 4, v: object });

            expect(fn.foo).to.be(1);
            expect(re.foo).to.be(2);
            expect(date.foo).to.be(3);

            const values = inst[Config.symbols.values];

            expect(values.prop1).to.be(null);
            expect(values.prop2).to.be(undefined);
            expect(values.prop3).to.be(1230);
            expect(values.prop4).to.be(false);
            expect(values.prop5).to.be(true);
            expect(values.prop6).to.be('HELLO');
            expect(values.prop7).to.be(fn);
            expect(values.prop8).to.be(re);
            expect(values.prop9).to.be(date);
            expect(values.prop10).to.equal([ 'foo' ]);
            expect(values.prop11).to.equal({ foo: 4, v: object });

            expect(values).to.have.only.own.keys(/* none */);

            const defaults = Object.getPrototypeOf(values);

            expect(defaults.prop1).to.be(null);
            expect(defaults.prop2).to.be(undefined);

            expect(defaults).to.have.only.own.keys(
                'prop1', 'prop2',
                'prop3', 'prop4', 'prop5', 'prop6', 'prop7', 'prop8', 'prop9',
                'prop10', 'prop11'
            );
        });

        it('should populate the defaults object w/cached configs even if configured', function () {
            const array = [];
            const fn = () => {};
            const re = /abc/;
            const date = new Date();
            const object = { foo: 1 };

            const log = [];

            @define({
                config: {
                    // These should just go to the class "defaults" object:

                    @cached
                    prop1: null,

                    @cached
                    prop2: undefined,

                    // These require initialization per-instance:

                    @cached
                    prop3: 123,

                    @cached
                    prop4: true,
                    @cached
                    prop5: false,

                    @cached
                    prop6: 'hello',

                    @cached
                    prop7: fn,

                    @cached
                    prop8: re,

                    @cached
                    prop9: date,

                    @cached
                    prop10: array,

                    @cached
                    prop11: object
                }
            })
            class Foo extends Widget {
                prop1Change  (...args)  { log.push([ 'p1', args ]); return args[0]; }
                prop2Change (...args)  { log.push([ 'p2', args ]); return args[0]; }
                prop3Change (...args)  { log.push([ 'p3', args ]); return args[0]; }
                prop4Change (...args)  { log.push([ 'p4', args ]); return args[0]; }
                prop5Change (...args)  { log.push([ 'p5', args ]); return args[0]; }
                prop6Change (...args)  { log.push([ 'p6', args ]); return args[0]; }
                prop7Change (...args)  { log.push([ 'p7', args ]); return args[0]; }
                prop8Change (...args)  { log.push([ 'p8', args ]); return args[0]; }
                prop9Change (...args)  { log.push([ 'p9', args ]); return args[0]; }
                prop10Change (...args) { log.push([ 'p10', args ]); return args[0]; }
                prop11Change (...args) { log.push([ 'p11', args ]); return args[0]; }

                afterCachedConfig () {
                    log.push('afterCachedConfig');
                }

                beforeInitConfig () {
                    log.push('beforeInitConfig');
                }
            }

            let fooMeta = Foo.getMeta();
            let fooConfigs = fooMeta.configs;

            expect(fooConfigs.inits).to.be(null);
            expect(fooConfigs.initsMap).to.be(null);

            let inst = new Foo({
                prop1: 'a',
                prop2: 'b',
                prop3: 'c',
                prop4: 'd',
                prop5: 'e',
                prop6: 'f',
                prop7: 'g',
                prop8: 'h',
                prop9: 'i',
                prop10: null,
                prop11: null
            });

            expect(log).to.equal([
                [ 'p10', [ array, undefined ] ],
                [ 'p11', [ object, undefined ] ],
                [ 'p3',  [ 123, undefined ] ],
                [ 'p4',  [ true, undefined ] ],
                [ 'p5',  [ false, undefined ] ],
                [ 'p6',  [ 'hello', undefined ] ],
                [ 'p7',  [ fn, undefined ] ],
                [ 'p8',  [ re, undefined ] ],
                [ 'p9',  [ date, undefined ] ],
                'afterCachedConfig',

                'beforeInitConfig',
                [ 'p1', [ 'a', null ] ],
                [ 'p10', [ null, array ] ],
                [ 'p11', [ null, object ] ],
                [ 'p2', [ 'b', undefined ] ],
                [ 'p3', [ 'c', 123 ] ],
                [ 'p4', [ 'd', true ] ],
                [ 'p5', [ 'e', false ] ],
                [ 'p6', [ 'f', 'hello' ] ],
                [ 'p7', [ 'g', fn ] ],
                [ 'p8', [ 'h', re ] ],
                [ 'p9', [ 'i', date ] ]
            ]);

            let initProps = fooConfigs.inits.map(cfg => cfg.name);

            expect(initProps).to.equal([]);

            let keys = Object.keys(fooConfigs.initsMap);
            keys.sort();

            expect(keys).to.equal(initProps);

            expect(inst.prop1).to.be('a');
            expect(inst.prop2).to.be('b');
            expect(inst.prop3).to.be('c');
            expect(inst.prop4).to.be('d');
            expect(inst.prop5).to.be('e');
            expect(inst.prop6).to.be('f');
            expect(inst.prop7).to.be('g');
            expect(inst.prop8).to.be('h');
            expect(inst.prop9).to.be('i');
            expect(inst.prop10).to.be(null);
            expect(inst.prop11).to.be(null);

            const values = inst[Config.symbols.values];

            expect(values.prop1).to.be('a');
            expect(values.prop2).to.be('b');
            expect(values.prop3).to.be('c');
            expect(values.prop4).to.be('d');
            expect(values.prop5).to.be('e');
            expect(values.prop6).to.be('f');
            expect(values.prop7).to.be('g');
            expect(values.prop8).to.be('h');
            expect(values.prop9).to.be('i');
            expect(values.prop10).to.be(null);
            expect(values.prop11).to.be(null);

            expect(values).to.have.only.own.keys(
                'prop1', 'prop2',
                'prop3', 'prop4', 'prop5', 'prop6', 'prop7', 'prop8', 'prop9',
                'prop10', 'prop11'
            );

            const defaults = Object.getPrototypeOf(values);

            expect(defaults.prop1).to.be(null);
            expect(defaults.prop2).to.be(undefined);

            expect(defaults).to.have.only.own.keys(
                'prop1', 'prop2',
                'prop3', 'prop4', 'prop5', 'prop6', 'prop7', 'prop8', 'prop9',
                'prop10', 'prop11'
            );

            log.length = 0;

            let inst2 = new Foo({
                prop1: 'a',
                prop2: 'b',
                prop3: 'c',
                prop4: 'd',
                prop5: 'e',
                prop6: 'f',
                prop7: 'g',
                prop8: 'h',
                prop9: 'i',
                prop10: null,
                prop11: {
                    bar: 2
                }
            });

            expect(log).to.equal([
                'beforeInitConfig',
                [ 'p1', [ 'a', null ] ],
                [ 'p10', [ null, array ] ],
                [ 'p11', [ { foo:1, bar:2 }, object ] ],
                [ 'p2', [ 'b', undefined ] ],
                [ 'p3', [ 'c', 123 ] ],
                [ 'p4', [ 'd', true ] ],
                [ 'p5', [ 'e', false ] ],
                [ 'p6', [ 'f', 'hello' ] ],
                [ 'p7', [ 'g', fn ] ],
                [ 'p8', [ 'h', re ] ],
                [ 'p9', [ 'i', date ] ]
            ]);

            expect(inst2.prop1).to.be('a');
            expect(inst2.prop2).to.be('b');
            expect(inst2.prop3).to.be('c');
            expect(inst2.prop4).to.be('d');
            expect(inst2.prop5).to.be('e');
            expect(inst2.prop6).to.be('f');
            expect(inst2.prop7).to.be('g');
            expect(inst2.prop8).to.be('h');
            expect(inst2.prop9).to.be('i');
            expect(inst2.prop10).to.be(null);
            expect(inst2.prop11).to.equal({ foo:1, bar:2 });

            const values2 = inst2[Config.symbols.values];

            expect(values2.prop1).to.be('a');
            expect(values2.prop2).to.be('b');
            expect(values2.prop3).to.be('c');
            expect(values2.prop4).to.be('d');
            expect(values2.prop5).to.be('e');
            expect(values2.prop6).to.be('f');
            expect(values2.prop7).to.be('g');
            expect(values2.prop8).to.be('h');
            expect(values2.prop9).to.be('i');
            expect(values2.prop10).to.be(null);
            expect(values2.prop11).to.equal({ foo:1, bar:2 });

            expect(values2).to.have.only.own.keys(
                'prop1', 'prop2',
                'prop3', 'prop4', 'prop5', 'prop6', 'prop7', 'prop8', 'prop9',
                'prop10', 'prop11'
            );

            expect(defaults.prop1).to.be(null);
            expect(defaults.prop2).to.be(undefined);

            expect(defaults).to.have.only.own.keys(
                'prop1', 'prop2',
                'prop3', 'prop4', 'prop5', 'prop6', 'prop7', 'prop8', 'prop9',
                'prop10', 'prop11'
            );
        });
    }); // internals

    describe('behaviors', function () {
        describe('first instances', function () {
            it('should store ', function () {

            });
        });
    });
});
