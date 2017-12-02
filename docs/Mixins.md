# Mixins

The concept of mixins has been [explored](https://www.npmjs.com/package/core-decorators)
in various ways, but the approach taken here is to treat mixins like alternative base
classes as much as possible.

All mixin strategies basically reduce to copying properties from the mixin class to the
target class. Since mixins as actual classes, this includes `static` as well as `prototype`
properties.

```javascript
    import { Widget, define } from '@epiphanysoft/oo';
    
    class MyClass extends Widget {
        ctor () {
            console.log('MyClass ctor');
        }

        dtor () {
            console.log('MyClass dtor');
        }
        
        foo () {
            console.log('MyClass foo');
        }
    }

    class MyMixin extends Widget {
        ctor () {
            console.log('MyMixin ctor');
        }

        dtor () {
            console.log('MyMixin dtor');
        }
        
        bar () {
            console.log('MyMixin bar');
        }
    }

    @define({
        mixins: MyMixin
    })
    class MyDerived extends MyClass {
        ctor () {
            console.log('MyClass ctor');
        }

        dtor () {
            console.log('MyClass dtor');
        }
        
        foo () {
            console.log('MyDerived foo');
            super.foo();
            this.bar();
        }
    }
    
    let inst = new MyDerived();
```

The first thing to note here is that all of the `ctor` methods were called and in the
proper, "top down" order.
    
    > MyClass ctor
    > MyMixin ctor
    > MyDerived ctor

Methods (actually all properties) that are not already defined on the target class are
copied from the mix in class. This allows the `foo()` method to call `this.bar()`.

```javascript
    inst.foo();
```

The result is this:

    > MyDerived foo
    > MyClass foo
    > MyMixin bar

The call to the `bar` method in `MyDerived.foo()` is made possible by the copied reference
from the `MyMixin.prototype` to the `MyDerived.prototype`. This works in the same way for
`static` methods.

Object destruction is similar to creation:

```javascript
    inst.destroy();
```
    
    > MyDerived dtor
    > MyMixin dtor
    > MyClass dtor

In the same way that the `ctor` methods were properly called, so are the `dtor` methods.

## Multiple `mixins`

The `mixins` property passed to `@define` above was a single class. When multiple mixins
are used, `mixins` becomes an array.

```javascript
    @define({
        mixins: [ MyMixin, MyOtherMixin ]
    })
    class MyOtherDerived extends MyClass {
        //
    }
```

In this case the mixin classes are mixed in sequentially. This means `MyMixin` may have
properties that do not collide with `MyOtherDerived` and would be included while the same
properties defined in `MyOtherMixin` would be ignored.

## Managing Mixin Collisions

When properties are copied from a mixin, only properties that have no prior definition
are included. If the target class has or inherits a property by the same name as one defined
in a mixin, that property is ignored.

For methods that need to call both the proper `super` method as well as the mixin's method,
a manual `call()` is used.

For example:

```javascript
    import { Widget, define } from '@epiphanysoft/oo';
    
    class MyClass extends Widget {
        foo () {
            console.log('MyClass foo');
        }
    }

    class MyMixin extends Widget {
        foo () {
            console.log('MyMixin foo');
        }
    }

    @define({
        mixins: MyMixin
    })
    class MyDerived extends MyClass {
        foo () {
            super.foo();

            console.log('MyDerived foo');

            MyMixin.prototype.foo.call(this);
        }
    }
    
    let inst = new MyDerived();
    
    inst.foo();
```

Which produces this:
 
    > MyClass foo
    > MyDerived foo
    > MyMixin foo

Again, the same technique applies to `static` methods.

<a name="_junctions">

## Method Junctions

When methods collide it is often desirable to treat the mixin methods as normal `super`
methods. This can be accomplished by declaring the colliding method as a `@junction`.

```javascript
    import { Widget, define, junction } from '@epiphanysoft/oo';
    
    class MyClass extends Widget {
        foo () {
            console.log('MyClass foo');
        }
    }

    class MyMixin extends Widget {
        foo () {
            console.log('MyMixin foo');
        }
    }

    @define({
        mixins: MyMixin
    })
    class MyDerived extends MyClass {
        @junction
        foo () {
            super.foo(); // calls MyClass.foo() then MyMixin.foo()
            
            console.log('MyDerived foo');
        }
    }
    
    let inst = new MyDerived();
    
    inst.foo();
```
    
    > MyClass foo
    > MyMixin foo
    > MyDerived foo

### Behind The Curtain

In order to achieve the `super.foo()` simplicity above, the `@junction` decorator inserts 
the junction method in the class prototype chain between `MyDerived` and `MyClass`. This
extra link in the prototype chain is added only by the first `@junction` method (all other
method junctions reuse it).

<a name="_chains">

## Method Chains

In cases like `ctor` and `dtor`, it is important for methods in a class hierarchy to be
called only once, even if there are multiple paths to a common base class (a.k.a., the
["dreaded diamond"](https://en.wikipedia.org/wiki/Multiple_inheritance)). This behavior is
available for other methods using the `chains` processor:

```javascript
    import { Widget, define } from '@epiphanysoft/oo';
    
    @define({
        chains: ['init']
    })
    class MyClass extends Widget {
        initialize (x, y) {
            this.callChain('init', x, y);
        }
        
        init (x, y) {
            console.log('MyClass init', x, y);
        }
    }

    class MyMixin extends Widget {
        init (x, y) {
            console.log('MyMixin init', x, y);
        }
    }

    @define({
        mixins: MyMixin
    })
    class MyDerived extends MyClass {
        init (x, y) {
            console.log('MyDerived init', x, y);
        }
    }
    
    let inst = new MyDerived();
    
    inst.initialize(1, 2);
```
    
    > MyClass init 1 2
    > MyMixin init 1 2
    > MyDerived init 1 2

The critical role `chains` plays is preventing methods from being copied from mixins to
target classes. This is because if they were copied, the `callChain()` method would
ultimately call those methods one time for each class onto which they were copied.

While most such methods are `ctor`-like methods (or forward chains), there is also the
`callChainRev()` method for those cases where the `dtor` call order is needed.
