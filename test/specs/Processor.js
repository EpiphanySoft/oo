const expect = require('assertly').expect;
const Processor = require('../../src/Processor.js');

describe('Processor', function () {
    describe('base cases', function () {
        it('should handle one processor', function () {
            let procs = Processor.decode('foo');

            expect(procs.size).to.be(1);

            let array = procs.sorted;

            expect(array.length).to.be(1);
            expect(array[0].applier).to.be('applyFoo');
            expect(array[0].name).to.be('foo');
        });
    });
});
