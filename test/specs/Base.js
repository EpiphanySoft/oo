const expect = require('assertly').expect;
const Base = require('../../src/Base.js');

const { lazy, merge, junction, mixinId } = require('../../src/decorators');

describe('Base', function () {
    var obj = {
        @lazy
        @merge((value, oldValue) => {
            debugger
        })
        foo: 42
    };

    describe('life-cycle', function () {
        let C, D, M;
        let log;

        beforeEach(function () {
            log = [];

            C = class c extends Base {
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
            class m extends Base {
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
    });
});
