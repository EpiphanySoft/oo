const expect = require('assertly').expect;
const Processor = require('../../src/Processor.js');

describe('Processor', function () {
    describe('base cases', function () {
        it('should handle one processor', function () {
            let procs = Processor.decode('foo');

            expect(procs.length).to.be(1);

            expect(procs[0].applier).to.be('applyFoo');
            expect(procs[0].name).to.be('foo');

            let map = procs.byName;

            expect(Object.values(map).length).to.be(1);

            let keys = Object.keys(map);
            expect(keys).to.equal([ 'foo' ]);

            expect(map.foo).to.be(procs[0]);
        });

        it('should handle two processors', function () {
            let procs = Processor.decode(['foo', 'bar']);

            expect(procs.length).to.be(2);

            expect(procs[1].applier).to.be('applyFoo');
            expect(procs[1].name).to.be('foo');

            expect(procs[0].applier).to.be('applyBar');
            expect(procs[0].name).to.be('bar');

            let map = procs.byName;

            expect(Object.values(map).length).to.be(2);

            let keys = Object.keys(map);
            keys.sort();
            expect(keys).to.equal([ 'bar', 'foo' ]);

            expect(map.bar).to.be(procs[0]);
            expect(map.foo).to.be(procs[1]);
        });

        it('should handle two processors w/order', function () {
            let procs = Processor.decode({
                bar: 'foo',
                foo: null
            });

            expect(procs.length).to.be(2);

            expect(procs[0].applier).to.be('applyFoo');
            expect(procs[0].name).to.be('foo');

            expect(procs[1].applier).to.be('applyBar');
            expect(procs[1].name).to.be('bar');

            let map = procs.byName;

            expect(Object.values(map).length).to.be(2);

            let keys = Object.keys(map);
            keys.sort();
            expect(keys).to.equal([ 'bar', 'foo' ]);

            expect(map.bar).to.be(procs[1]);
            expect(map.foo).to.be(procs[0]);
        });
    });

    describe('inheritance', function () {
        beforeEach(function () {
            this.base = Processor.decode([ 'foo', 'bar' ]);
        });

        it('should append to inherited processors', function () {
            let derived = Processor.decode('aaa', this.base);
        });
    });
});
