const expect = require('assertly').expect;

const Config = require('../../src/Config.js');
const Widget = require('../../src/Widget.js');

const { define, initial, lazy, merge, open } = require('../../src/decorators.js');

function getAllKeys (object) {
    let keys = [];

    for (let key in object) {
        keys.push(key);
    }

    return keys;
}

function getAllValues (object) {
    let values = [];

    for (let key in object) {
        values.push(object[key]);
    }

    return values;
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

        it('should mixin a basic config', function () {
            @define({
                config: {
                    foo: 123
                }
            })
            class Bar extends Widget {}

            @define({
                mixins: Bar
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

            let barMeta = Bar.getMeta();

            expect(configs.foo === configs.foo).to.be(true);
            expect(configs.foo.owner).to.be(null);
        });

        it('should populate the inits array and map w/no handler methods', function () {
            @define({
                config: {
                    prop1: null,
                    prop2: undefined,

                    prop3: 123,

                    prop4: true,
                    prop5: false,

                    prop6: 'hello',

                    prop7: () => {},

                    // These require initialization per-instance:

                    prop8: /abc/,

                    prop9: new Date(),

                    prop10: [],
                    prop11: {}
                }
            })
            class Foo extends Widget {}

            let fooMeta = Foo.getMeta();
            let fooConfigs = fooMeta.configs;

            expect(fooConfigs.inits).to.be(null);
            expect(fooConfigs.initsMap).to.be(null);

            let inst = new Foo();

            expect(fooConfigs.inits.length).to.be(4);

            expect(fooConfigs.inits[0].name).to.be('prop10');
            expect(fooConfigs.inits[1].name).to.be('prop11');
            expect(fooConfigs.inits[2].name).to.be('prop8');
            expect(fooConfigs.inits[3].name).to.be('prop9');

            let keys = Object.keys(fooConfigs.initsMap);
            keys.sort();

            expect(keys).to.equal([ 'prop10', 'prop11', 'prop8', 'prop9' ]);
        });
    });

    describe('behaviors', function () {
        describe('first instances', function () {
            it('should store ', function () {

            });
        });
    });
});
