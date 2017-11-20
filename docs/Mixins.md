# Mixins

The concept of mixins has been [explored](https://www.npmjs.com/package/core-decorators)
in various ways, but the approach Configly takes is to treat mixins like alternative base
classes as much as possible.

All mixin strategies basically reduce to copying properties from the mixin class to the
target class. Since Configly defines mixins as actual classes, this includes `static` as
well as `prototype` properties.

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
    
    > MyClass ctor
    > MyMixin ctor
    > MyDerived ctor

The first thing to note here is that all of the `ctor` methods were called and in the
proper, "top down" order.
    
    inst.foo();
    
    > MyDerived foo
    > MyClass foo
    > MyMixin bar

The call to the `bar` method in `MyDerived.foo()` is made possible by the copied reference
from the `MyMixin.prototype` to the `MyDerived.prototype`. This works in the same way for
`static` methods.

Object destruction is similar to creation:

    inst.destroy();
    
    > MyDerived dtor
    > MyMixin dtor
    > MyClass dtor

In the same way that the `ctor` methods were properly called, so are the `dtor` methods.

## The `@define` Decorator

The `@define` decorator is used above to include `MyMixin` as a mixin of `MyDerived`. This
language feature is currently a standard in progress. Said another way, it is an "ES.next"
feature.

The same features are available as a `static` method:

    class MyDerived extends MyClass {
        // ...
    }
    
    MyDerived.define({
        mixins: MyMixin
    })

### Why Not Use Multiple Decorators?

It is perhaps tempting to view each of these goals as their own decorators (say `@mixin`
for example). While this works in many cases, using multiple decorators does not ensure a
consistent order.

Instead that order is lexically determined. For example, consider these classes:

    @foo @bar
    class FooBar {
    }

    @bar @foo
    class BarFoo {
    }

The different order of the above decorators results in different execution order. In many
cases this difference will not matter, but if the `@foo` and `@bar` decorators intersect
in some way, their order can be important.

## Managing Mixin Collisions

When properties are copied from a mixin, only properties that have no prior definition
are included. If the target class has or inherits a property by the same name as one defined
in a mixin, that property is ignored.

The first step to managing overlapping mixins is to assign id's to them. The simplest way
is to assign one to the mixin class:

    @define({
        mixinId: 'mymixin'
    })
    class MyMixin extends Widget {
        //...
    }

Now when `MyMixin` is mixed into another class, it is added to the `mixins` object on the
class constructor and its prototype is added to a `mixins` object on the class prototype.
These object allow a class to directly access their mixins. In code:

    MyDerived.mixins['mymixin'] = MyMixin;
    MyDerived.prototype.mixins['mymixin'] = MyMixin.prototype;

For example:

    import { Widget, define } from '@epiphanysoft/oo';
    
    class MyClass extends Widget {
        foo () {
            console.log('MyClass foo');
        }
    }

    @define({
        mixinId: 'mymixin'
    })
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
            this.mixins.mymixin.foo.call(this);
        }
    }
    
    let inst = new MyDerived();
    
    inst.foo();
    
    > MyClass foo
    > MyDerived foo
    > MyMixin foo

Because there is a `mixins` object maintained on the constructor as well as on the
prototype, the same technique applies to `static` methods.

## Alternative Forms of `mixins`

The `mixins` property passed to `@define` above was a single class. When multiple mixins
are used, this can changed to an array.

    @define({
        mixins: [ MyMixin, MyOtherMixin ]
    })
    class MyOtherDerived extends MyClass {
        //
    }

In this case the mixin classes are mixed in sequentially. This means `MyMixin` may have
properties that do not collide with `MyOtherDerived` and would be included while the same
properties defined in `MyOtherMixin` would be ignored.

The fact that a `mixins` array is mixed in sequentially ensures predictability. When using
an array, each element can be either a class to mixin or a 2-element array:

    @define({
        mixins: [
            MyMixin,
            [ 'othermix', MyOtherMixin ]
        ]
    })
    class MyOtherDerived extends MyClass {
        //
    }

When one of the elements of the `mixins` array is a 2-element array, the first item in
that array is the mixin id (the key to use in the `mixins` object of the target class).
This form may be needed if the mixin class did not define an id or if perhaps the mixin
classes came from different authors and had conflicting id's.

## Method Junctions

When methods collide it is often desirable to treat the mixin methods as normal `super`
methods. This can be accomplished by declaring the colliding method as a `@junction`.

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
    
    > MyClass foo
    > MyMixin foo
    > MyDerived foo

### Behind The Curtain

In order to achieve the above simplicity of using `super.foo()` and having that call reach
both the proper super class as well as `MyMixin`, the `@junction` decorator inserts the
junction method in the class prototype chain between `MyDerived` and `MyClass`. This extra
link in the prototype chain is added by the first `@junction` method only (all other
junctions reuse it).

## Method Chains

In cases like `ctor` and `dtor`, it is important for methods in a class hierarchy to be
called only once, even if there are multiple paths to a common base class (a.k.a., the
["dreaded diamond"](https://en.wikipedia.org/wiki/Multiple_inheritance)). This behavior is
available for other methods using the `chains` processor:

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
    
    > MyClass init 1 2
    > MyMixin init 1 2
    > MyDerived init 1 2

The critical role `chains` plays is preventing methods from being copied from mixins to
target classes. This is because if they were copied, the `callChain()` method would
ultimately call those methods one time for each class onto which they were copied.

While most such methods are `ctor`-like methods (or forward chains), there is also the
`callChainRev()` method for those cases where the `dtor` call order is needed.
