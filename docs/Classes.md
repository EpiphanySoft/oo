# Classes

As the name implies, the goal of Configly is to make classes (and their instances, see
below) configurable. This starts at the class-level by allowing classes to be augmented
in several ways:

 - Mixins (multiple inheritance)
 - Method junctions
 - Method chains
 - Extensible processors

While most of these features are provided by Configly's `Meta` class (which can be applied
to any class), standard usage is simplified by extending Configly's `Base` class.

## Base

Configly exports a recommended `Base` class:

    import { Base } from '@epiphanysoft/configly';
    
    class MyClass extends Base {
        //
    }

The main feature of `Base` is its standard object life-cycle. 

### Life-cycle

The `constructor` of `Base` expects a single `Object` parameter that holds configuration
properties (described later). It is not recommended that a derived class implement a
`constructor`, but instead take advantage of the `ctor` method.

`Base` also defines a `destroy` method that is used to cleanup any resources that the GC
(garbage collector) won't handle. It is also not recommended that derived classes override
the `destroy` method but instead implement a `dtor` method.

These methods ensure the following:

 - The `constructing` and `configuring` properties track construction.
 - The `destroying` and `destroyed` properties track destruction.
 - The `lifecycle` property tracks construction and destruction.
 - The `destroy` method is harmless to call after it has been called.

#### ctor

The `ctor` method is like a `constructor` in that it is only called once as the instance
is being created.

    class MyClass extends Base {
        ctor () {
            // do constructor-like things
        }
    }

The major difference between a `ctor` and a standard `constructor` is how `ctor` methods
are called. `Base` ensures that all `ctor` implementations in the class hierarchy are
called once and in the proper order.

For example:

    class MyClass extends Base {
        ctor () {
            // do constructor-like things
            console.log('MyClass ctor');
        }
    }

    class MyDerived extends MyClass {
        ctor () {
            // NOTE: no super.ctor() call
            // do more constructor-like things
            console.log('MyDerived ctor');
        }
    }
    
    let inst = new MyDerived();
    
    > MyClass ctor
    > MyDerived ctor

The `ctor` implementations are called "top down" from the `Base` class to the derived-most
class.

#### dtor

As with `ctor` calls, the `Base` class ensures that the proper `dtor` calls are made. This
saves derived classes from overriding `destroy` and remembering to call `super.destroy()`
at the proper time.

For example:

    class MyClass extends Base {
        dtor () {
            console.log('MyClass dtor');
        }
    }

    class MyDerived extends MyClass {
        dtor () {
            console.log('MyDerived dtor');
        }
    }
    
    let inst = new MyDerived();
    
    inst.destroy();
    
    > MyDerived dtor
    > MyClass dtor

The `dtor` implementations are called "bottom up" from the derived-most class upwards to
the `Base` class.

#### construct / destruct

There are times when some manual involvement in the life-cycle is needed. In these cases
there are the `construct` and `destruct` methods. The implementations of these methods in
`Base` invoke the `ctor` and `dtor` methods, respectively.

    class MyClass extends Base {
        ctor () {
            console.log('MyClass ctor');
        }

        dtor () {
            console.log('MyClass dtor');
        }
    }

    class MyDerived extends MyClass {
        ctor () {
            console.log('MyDerived ctor');
        }
        
        dtor () {
            console.log('MyDerived dtor');
        }
        
        construct (config) {
            console.log('My Derived before construct');
            super.construct(config);
            console.log('My Derived after construct');
        }
        
        destruct () {
            console.log('My Derived before destruct');
            super.destruct();
            console.log('My Derived after destruct');
        }
    }
    
    let inst = new MyDerived();
    
    > MyDerived before construct    
    > MyClass ctor
    > MyDerived ctor
    > MyDerived after construct    

    inst.destroy();

    > MyDerived before destruct    
    > MyDerived dtor
    > MyClass dtor
    > MyDerived after destruct    

## Mixins

The concept of mixins has been [explored](https://www.npmjs.com/package/core-decorators)
in various ways, but the approach Configly takes is to treat mixins like alternative base
classes as much as possible.

All mixin strategies basically reduce to copying properties from the mixin class to the
target class. Since Configly defines mixins as actual classes, this includes `static` as
well as `prototype` properties.

    import { Base, define } from '@epiphanysoft/configly';
    
    class MyClass extends Base {
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

    class MyMixin extends Base {
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

### The `@define` Decorator

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

#### Why Not Use Multiple Decorators?

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

### Managing Mixin Collisions

When properties are copied from a mixin, only properties that have no prior definition
are included. If the target class has or inherits a property by the same name as one defined
in a mixin, that property is ignored.

The first step to managing overlapping mixins is to assign id's to them. The simplest way
is to assign one to the mixin class:

    @define({
        mixinId: 'mymixin'
    })
    class MyMixin extends Base {
        //...
    }

Now when `MyMixin` is mixed into another class, it is added to the `mixins` object on the
class constructor and its prototype is added to a `mixins` object on the class prototype.
These object allow a class to directly access their mixins. In code:

    MyDerived.mixins['mymixin'] = MyMixin;
    MyDerived.prototype.mixins['mymixin'] = MyMixin.prototype;

For example:

    import { Base, define } from '@epiphanysoft/configly';
    
    class MyClass extends Base {
        foo () {
            console.log('MyClass foo');
        }
    }

    @define({
        mixinId: 'mymixin'
    })
    class MyMixin extends Base {
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

### Alternative Forms of `mixins`

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

The fact that a `mixins` array is mixed in sequentially makes the result more predictable,
however, in some cases another form may be needed: the object form.

    @define({
        mixins: {
            mymix: MyMixin,
            othermix: MyOtherMixin
        }
    })
    class MyOtherDerived extends MyClass {
        //
    }

In this case, the mixin id is the object key. This form may be needed if the mixin class
did not define an id or if perhaps the mixin classes came from different authors and had
conflicting id's. In this case, the mixins are applied in `sort()` order.

### Method Junctions

When methods collide it is often desirable to treat the mixin methods as normal `super`
methods. This can be accomplished by declaring the colliding method as a `@junction`.

    import { Base, define, junction } from '@epiphanysoft/configly';
    
    class MyClass extends Base {
        foo () {
            console.log('MyClass foo');
        }
    }

    class MyMixin extends Base {
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
            super.foo();
            console.log('MyDerived foo');
        }
    }
    
    let inst = new MyDerived();
    
    inst.foo();
    
    > MyClass foo
    > MyMixin foo
    > MyDerived foo

#### Behind The Curtain

In order to achieve the above simplicity of using `super.foo()` and having that call reach
both the proper super class as well as `MyMixin`, the `@junction` decorator inserts the
junction method in the class prototype between `MyDerived` and `MyClass`. This extra link
in the prototype chain is added by the first `@junction` method only (all other junctions
reuse it).

## Method Chains

In some cases (like `ctor` and `dtor`) it is important for methods in a class hierarchy to
be called only once, even if there are multiple paths to a common base class (a.k.a., the
["dreaded diamond"](https://en.wikipedia.org/wiki/Multiple_inheritance)). This behavior is
available for other methods using `chains`:

    import { Base, define } from '@epiphanysoft/configly';
    
    @define({
        chains: ['init']
    })
    class MyClass extends Base {
        initialize (x, y) {
            this.callChain('init', x, y);
        }
        
        init (x, y) {
            console.log('MyClass init', x, y);
        }
    }

    class MyMixin extends Base {
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
target classes. This is because if they were copied, the `callChain()` would ultimately
call those methods one time for each class onto which they were copied.

While most such methods are `ctor`-like methods, there is also `callChainRev()` for those
cases where the `dtor` call order is needed.

## Class Processors

TODO

# Using `Meta` Without `Base`

TODO
