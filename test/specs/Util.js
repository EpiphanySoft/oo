const expect = require('assertly').expect;

const Util = require('../../src/Util.js');

describe('Util', function () {
    describe('setProto', function () {
        it('should use setPrototypeOf', function () {
            expect(Util.setProto).to.be(Object.setPrototypeOf);
        });

        it('should be able to use __proto__', function () {
            let b = { a: 1 };
            let c = {};

            expect(c.a).to.be(undefined);

            Util.setProto__(c, b);

            expect(c.a).to.be(1);
        });

        it('should throw if cannot set prototype', function () {
            expect(() => {
                Util.noSetProto();
            }).to.throw('Cannot polyfill setPrototypeOf');
        });
    });

    describe('getOwnKeys', function () {
        it('should return keys', function () {
            let keys = Util.getOwnKeys({ a: 1, b: 2 });

            expect(keys).to.equal([ 'a', 'b' ]);
        });

        it('should return symbols', function () {
            let keys = Util.getOwnKeys({
                [Symbol.iterator] () {}
            });

            expect(keys).to.equal([ Symbol.iterator ]);
        });

        it('should return keys and symbols', function () {
            let keys = Util.getOwnKeys({
                [Symbol.iterator] () {},
                a: 1
            });

            expect(keys).to.equal([ 'a', Symbol.iterator ]);
        });
    });

    describe('capitalize', function () {
        it('should not throw on capitalize(null)', function () {
            let o = Util.capitalize(null);
            expect(o).to.be('');
        });

        it('should capitalize lowercase name', function () {
            expect(Util.capitalize('hello')).to.be('Hello');
        });

        it('should preserve capitalized name', function () {
            expect(Util.capitalize('Hello')).to.be('Hello');
        });
    });

    describe('clone', function () {
        it('should not throw on clone(null)', function () {
            let o = Util.clone(null);
            expect(o).to.be(null);
        });

        it('should clone arrays', function () {
            let date = new Date();
            let array = [ 1, 2, date ];
            let src = {
                a: array,
                d: date
            };
            let dest = Util.clone(src);

            expect(dest).to.equal(src);
            expect(dest).not.to.be(src);

            expect(src.a).to.be(array);
            expect(dest.a).not.to.be(array);

            expect(src.a[2]).to.be(date);
            expect(dest.a[2]).not.to.be(date);

            expect(src.d).to.be(date);
            expect(dest.d).not.to.be(date);
        });
    });

    describe('copy/If', function () {
        it('should handle null', function () {
            expect(Util.copy(null)).to.be(null);
            expect(Util.copyIf(null)).to.be(null);
        });

        it('should copy and replace', function () {
            let obj = Util.copy({
                a: 1,
                b: 2
            }, null, {
                b: 3,
                c: 4
            });

            expect(obj).to.equal({ a: 1, b: 3, c: 4 });
        });

        it('should copyIf only if not present', function () {
            let obj = Util.copyIf({
                a: 1,
                b: 2
            }, null, {
                b: 3,
                c: 4
            });

            expect(obj).to.equal({ a: 1, b: 2, c: 4 });
        });
    });

    // describe('Map', function () {
    //     let M = Util.Map;
    //
    //     it('should have a clone method', function () {
    //
    //     });
    // });

    describe('merge', function () {
        it('should handle null', function () {
            expect(Util.merge(null)).to.be(null);
        });

        it('should merge correctly', function () {
            let inner = { a: { b: 1 } };
            let date = new Date();
            let merged = Util.merge({
                in: inner,
                obj: {},
                num: 4,
                y: true
            }, null, {
                in: { a: { c: 2 }, d: 23 },
                obj: 42,
                num: date,
                x: 123
            });

            expect(merged).to.equal({
                in: {
                    a: { b: 1, c: 2 },
                    d: 23
                },
                obj: 42,
                num: date,
                x: 123,
                y: true
            });

            expect(merged.in).to.be(inner);
        });
    });

    describe('str', function () {
        it('should return empty for null', function () {
            expect(Util.str(null)).to.be('');
        });

        it('should return empty for undefined', function () {
            expect(Util.str()).to.be('');
        });

        it('should return "0" for 0', function () {
            expect(Util.str(0)).to.be('0');
        });
    });

    describe('typeOf', function () {
        it('should handle null', function () {
            expect(Util.typeOf(null)).to.be('null');
        });

        it('should handle undefined', function () {
            expect(Util.typeOf(undefined)).to.be('undefined');
        });

        it('should handle booleans', function () {
            expect(Util.typeOf(false)).to.be('boolean');
        });

        it('should handle dates', function () {
            expect(Util.typeOf(new Date())).to.be('date');
        });

        it('should handle functions', function () {
            expect(Util.typeOf(function () {})).to.be('function');
            expect(Util.typeOf(() => {})).to.be('function');
        });

        it('should handle numbers', function () {
            expect(Util.typeOf(0)).to.be('number');
        });

        it('should handle regexp', function () {
            expect(Util.typeOf(/a/)).to.be('regexp');
        });

        it('should not throw if parseRe fails', function () {
            let fn = Util.typeOf;
            let parseRe = fn.parseRe;

            fn.parseRe = /xx/;
            delete fn.cache['[object RegExp]'];

            try {
                expect(Util.typeOf(/a/)).to.be('[object RegExp]');
            }
            finally {
                fn.parseRe = parseRe;
            }
        });
    });
});
