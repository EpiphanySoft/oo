const expect = require('assertly').expect;
const Widget = require('../../src/Widget.js');

const { define, lazy, merge, junction, mixinId } = require('../../src/decorators.js');

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

describe('Widget', function () {
    function getAllKeys (obj) {
        let ret = [];

        for (let key in obj) {
            ret.push(key);
        }

        return ret;
    }

    describe('basics', function () {
        it('should have the correct processors', function () {
            let names = Widget.getMeta().getProcessors().map(p => p.name);

            expect(names).to.equal([
                'properties',
                'prototype',
                'static',
                'chains',
                'mixins',
                'config'
            ]);
        });

        it('should have ctor/dtor chains', function () {
            let meta = Widget.getMeta();
            let chains = getAllKeys(meta.liveChains);

            chains.sort();
            expect(chains).to.equal([ 'ctor', 'dtor' ]);

            chains = getAllKeys(meta.chains);

            chains.sort();
            expect(chains).to.equal([ 'ctor', 'dtor' ]);
        });
    });

    describe('life-cycle', function () {
        let C, D, M;
        let log;

        beforeEach(function () {
            log = [];

            C = class c extends Widget {
                ctor () {
                    log.push('C.ctor');
                    this.str = (this.str || '') + 'C';
                }

                dtor () {
                    log.push('C.dtor');
                }

                foo (x) {
                    log.push('C.foo=' + x);
                    return 'c' + x;
                }
            };

            @mixinId('mixum')
            class m extends Widget {
                ctor () {
                    log.push('M.ctor');
                    this.str = (this.str || '') + 'M';
                }

                dtor () {
                    log.push('M.dtor');
                }

                foo (x) {
                    log.push('M.foo=' + x);
                    return 'm' + x;
                }
            };
            M = m;

            D = class d extends C {
                ctor () {
                    log.push('D.ctor');
                    this.str = (this.str || '') + 'D';
                }

                dtor () {
                    log.push('D.dtor');
                }

                @junction
                foo (x) {
                    let r = super.foo(x);
                    log.push('D.foo=' + x);
                    return 'd' + r;
                }
            }
        });

        it('should be able to create an instance', function () {
            let instance = new C();

            expect(C.isClass).to.be(true);
            expect(instance.isInstance).to.be(true);

            expect(instance.str).to.be('C');
            expect(log).to.equal([ 'C.ctor' ]);
        });

        it('should be able to destroy an instance', function () {
            let instance = new C();

            log = [];
            instance.destroy();

            expect(log).to.equal([ 'C.dtor' ]);
        });

        it('should be able to call an instance method', function () {
            let instance = new C();
            let res = instance.foo(42);

            expect(res).to.be('c42');
            expect(log).to.equal([ 'C.ctor', 'C.foo=42' ]);
        });

        it('should be able to create derived instance', function () {
            let instance = new D();

            expect(instance.str).to.be('CD');
            expect(log).to.equal([ 'C.ctor', 'D.ctor' ]);
        });

        it('should be able to destroy a derived instance', function () {
            let instance = new D();

            log = [];
            instance.destroy();

            expect(log).to.equal([ 'D.dtor', 'C.dtor' ]);
        });

        it('should be able to call a derived instance method', function () {
            let instance = new D();
            let res = instance.foo(42);

            expect(res).to.be('dc42');
            expect(log).to.equal([ 'C.ctor', 'D.ctor', 'C.foo=42', 'D.foo=42' ]);
        });

        it('should be able to applyMixins', function () {
            // D.Junction(null, null, {
            //     value: D.prototype.foo
            // });

            D.applyMixins(M);

            expect(D.mixins.mixum === M).to.be(true);

            let instance = new D();

            expect(instance.str).to.be('CMD');
            expect(log).to.equal([ 'C.ctor', 'M.ctor', 'D.ctor' ]);
            expect(instance.mixins.mixum === M.prototype).to.be(true);

            log = [];
            let res = instance.foo(42);

            expect(res).to.be('dc42');
            expect(log).to.equal([ 'C.foo=42', 'M.foo=42', 'D.foo=42' ]);

            log = [];
            instance.destroy();
            expect(log).to.equal([ 'D.dtor', 'M.dtor', 'C.dtor' ]);
        });

        it('should not copy ctor/dtor methods from mixin', function () {
            @define({
                mixins: M
            })
            class F extends Widget {
                //
            }

            expect(F.prototype.ctor).to.be(undefined);

            let instance = new F();

            expect(instance.str).to.be('M');
            expect(log).to.equal([ 'M.ctor' ]);
            expect(instance.mixins.mixum === M.prototype).to.be(true);

            expect(instance.getMeta().liveChains.ctor).to.be(true);
            expect(instance.getMeta().liveChains.dtor).to.be(true);
        });

        it('should copy prototype and static properties', function () {
            @define({
                prototype: {
                    foo: 1
                },
                static: {
                    bar: 2
                }
            })
            class F extends Widget {
                //
            }

            expect(F.bar).to.be(2);

            expect(F.prototype.foo).to.be(1);
        });

        it('should not call ctor/dtor methods if absent', function () {
            class F extends Widget {
                //
            }

            let instance = new F();

            instance.destroy();

            expect(log).to.equal([ ]);

            expect(F.getMeta().liveChains.ctor).to.be(false);
            expect(F.getMeta().liveChains.dtor).to.be(false);
        });
    }); // life-cycle

    describe('mixins', function () {
        it('should be able to reassign mixinId', function () {
            @define({
                mixinId: 'moo'
            })
            class M extends Widget {
                static foo () {}
                foo () {}
            }

            @define({
                mixins: [
                    M
                ]
            })
            class D extends Widget {
                //
            }

            expect(D.foo).to.be(M.foo);
            expect(D.prototype.foo).to.be(M.prototype.foo);

            expect(D.mixins.moo).to.be(M);

            @define({
                mixins: [
                    [ 'goo', M ]
                ]
            })
            class E extends Widget {
                //
            }

            expect(E.foo).to.be(M.foo);
            expect(E.prototype.foo).to.be(M.prototype.foo);

            expect(E.mixins.moo).to.be(undefined);
            expect(E.mixins.goo).to.be(M);
        });
    });

    describe('processors', function () {
        it('should allow for custom processors', function () {
            @define({
                processors: 'foo'
            })
            class Foo extends Widget {
                static applyFoo (stuff) {
                    this.fooWasHere = stuff;
                }
            }

            @define({
                foo: 42
            })
            class Bar extends Foo {
                //
            }

            expect(Bar.fooWasHere).to.be(42);
        });

        it('should allow for custom processors to precede inherited', function () {
            let vars = [];

            @define({
                processors: {
                    foo: {
                        before: 'prototype'
                    }
                },
                prototype: {
                    foobar: 123
                }
            })
            class Foo extends Widget {
                static applyFoo (stuff) {
                    vars.push(this.prototype.foobar);
                    this.prototype.foobar = stuff;
                }
            }

            @define({
                foo: 1,
                prototype: {
                    foobar: 42
                }
            })
            class Bar extends Foo {
                static applyPrototype (stuff) {
                    vars.push(this.prototype.foobar);
                    super.applyPrototype(stuff);
                    vars.push(this.prototype.foobar);
                }
            }

            expect(Foo.prototype.foobar).to.be(123);
            expect(Bar.prototype.foobar).to.be(42);
            expect(vars).to.equal([123, 1, 42]);
        });

        it('should order processors', function () {
            @define({
                static: {
                    fooWasHere: ''
                },
                processors: {
                    x: 'y',
                    y: 'z',
                    z: 0
                }
            })
            class Foo extends Widget {
                static applyX (stuff) {
                    this.fooWasHere += `(x=${stuff})`;
                }
                static applyY (stuff) {
                    this.fooWasHere += `(y=${stuff})`;
                }
                static applyZ (stuff) {
                    this.fooWasHere += `(z=${stuff})`;
                }
            }

            @define({
                x: 'a',
                y: 'b',
                z: 'c'
            })
            class Bar extends Foo {
                //
            }

            expect(Bar.fooWasHere).to.be('(z=c)(y=b)(x=a)');
        });

        it('should order inherited processors', function () {
            @define({
                static: {
                    fooWasHere: ''
                },
                processors: {
                    y: 'z',
                    z: 0
                }
            })
            class Foo extends Widget {
                static applyY (stuff) {
                    this.fooWasHere += `(y=${stuff})`;
                }
                static applyZ (stuff) {
                    this.fooWasHere += `(z=${stuff})`;
                }
            }

            @define({
                processors: {
                    x: {
                        before: 'y'
                    }
                }
            })
            class Foo2 extends Foo {
                static applyX (stuff) {
                    this.fooWasHere += `(x=${stuff})`;
                }
            }

            @define({
                y: 'b',
                z: 'c'
            })
            class Bar extends Foo {
                //
            }

            expect(Bar.fooWasHere).to.be('(z=c)(y=b)');

            @define({
                y: 'b',
                z: 'c',
                x: 'a'
            })
            class Bar2 extends Foo2 {
                //
            }

            expect(Bar2.fooWasHere).to.be('(z=c)(x=a)(y=b)');
        });
    });

    describe('configs', function () {
        it('should define basic config', function () {
            @define({
                config: {
                    foo: 123
                }
            })
            class Foo extends Widget {}

            let fooMeta = Foo.getMeta();
            let names = Object.keys(fooMeta.configs);

            expect(names).to.equal([ 'foo' ]);

            names = Object.keys(fooMeta.configValues);

            expect(names).to.equal([ 'foo' ]);

            let values = Object.values(fooMeta.configValues);

            expect(values).to.equal([ 123 ]);

            expect(fooMeta.configs.foo.owner).to.be(null);
            expect(fooMeta.configs.foo.lazy).to.be(false);
            expect(fooMeta.configs.foo.cached).to.be(false);
        });

        it('should define lazy config', function () {
            @define({
                config: {
                    @lazy
                    foo: 123
                }
            })
            class Foo extends Widget {}

            let fooMeta = Foo.getMeta();
            let names = Object.keys(fooMeta.configs);

            expect(names).to.equal([ 'foo' ]);

            names = Object.keys(fooMeta.configValues);

            expect(names).to.equal([ 'foo' ]);

            let values = Object.values(fooMeta.configValues);

            expect(values).to.equal([ 123 ]);

            expect(fooMeta.configs.foo.owner).to.be(Foo);
            expect(fooMeta.configs.foo.lazy).to.be(true);
            expect(fooMeta.configs.foo.cached).to.be(false);
        });

        it('should define lazy config w/custom merge', function () {
            let mergeFn = () => {};
            @define({
                config: {
                    @lazy
                    @merge(mergeFn)
                    foo: 123
                }
            })
            class Foo extends Widget {}

            let fooMeta = Foo.getMeta();
            let names = Object.keys(fooMeta.configs);

            expect(names).to.equal([ 'foo' ]);

            names = Object.keys(fooMeta.configValues);

            expect(names).to.equal([ 'foo' ]);

            let values = Object.values(fooMeta.configValues);

            expect(values).to.equal([ 123 ]);

            expect(fooMeta.configs.foo.owner).to.be(Foo);
            expect(fooMeta.configs.foo.cached).to.be(false);
            expect(fooMeta.configs.foo.lazy).to.be(true);
            expect(fooMeta.configs.foo.merge).to.be(mergeFn);
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
            let names = Object.keys(fooMeta.configs);

            expect(names).to.equal([ ]);

            names = getAllKeys(fooMeta.configs);

            expect(names).to.equal([ 'foo' ]);

            names = Object.keys(fooMeta.configValues);

            expect(names).to.equal([ ]);

            names = getAllKeys(fooMeta.configValues);

            expect(names).to.equal([ 'foo' ]);

            let values = Object.values(fooMeta.configValues);

            expect(values).to.equal([ ]);

            values = getAllValues(fooMeta.configValues);

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
            let names = Object.keys(fooMeta.configs);

            expect(names).to.equal([ 'foo' ]);

            names = Object.keys(fooMeta.configValues);

            expect(names).to.equal([ 'foo' ]);

            let values = Object.values(fooMeta.configValues);

            expect(values).to.equal([ 123 ]);

            let barMeta = Bar.getMeta();

            expect(fooMeta.configs.foo === barMeta.configs.foo).to.be(true);
            expect(barMeta.configs.foo.owner).to.be(null);
        });
    });
});
