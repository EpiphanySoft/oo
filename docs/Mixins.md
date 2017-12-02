# Mixins

The concept of mixins has been [explored](https://www.npmjs.com/package/core-decorators)
in various ways, but the approach taken here is to treat mixins like alternative base
classes as much as possible.

All mixin strategies basically reduce to copying properties from the mixin to the target
class. Since mixins as actual classes, this includes `static` as well as `prototype`
properties. Further, they participate in the common [life cycle](../Readme.md#_mixins).

## Multiple `mixins`

The `mixins` property passed to `@define` can be a single class or an array.

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

## Name Collisions

When properties are copied from a mixin, only properties that have no prior definition
are included. If the target class has or inherits a property by the same name as one defined
in a mixin, that property on the mixin is ignored.

For methods that need to call both the proper `super` method as well as the mixin's method,
a manual `call()` can be used.

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

<a name="_junctions"></a>

## Method Junctions

When methods collide it is often desirable to treat the mixin methods as normal `super`
methods. This can be accomplished by declaring the method at the point of collision to be
a `@junction`:

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

<a name="_chains"></a>

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
