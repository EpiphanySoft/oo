# Configly

Configly is a class-based, object-orient (OO) library for ES6+. Configly expands on the
embattled JavaScript `class` keyword using ES.next decorators to add powerful capabilities
to classes.

# Classes

As the name implies, the goal of Configly is to make classes (and their instances, see
below) configurable. This starts at the class-level by allowing classes to be augmented
in several ways:

 - Mixins (multiple inheritance)
 - Method junctions
 - Method chains
 - Extensible processors

The `@define` decorator (or `static` method) provides a consistent way to accomplish the
above.

    import { define, Base } from '@epiphanysoft/configly';
    
    @define( ... )
    class MyClass extends Base {
        //
    }

## Why Not Use Multiple Decorators?

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

## Base

Before exploring `@define`, consider the `Base` class used in the first example. Configly
exports a recommended `Base` class:

    import { Base } from '@epiphanysoft/configly';
    
    class MyClass extends Base {
        //
    }

### Life-cycle

The main feature of `Base` is its standard object life-cycle. 

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

It is different the standard `constructor` in two ways. First, a `ctor` method does not
call the `super` method. Second, the `Base` class ensures that all `ctor` implementations
in the class hierarchy are called once and in the proper order.

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

A `dtor` method is like `destroy` but with the same differences the `ctor` has in relation
to the `constructor`: no `super` calls, and `Base` is responsible for calling the `dtor`
implementations.

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

    import { define, Base } from '@epiphanysoft/configly';
    
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

### Collisions

### Method Junctions

## Method Chains

## Class Processors

# Instance Configuration
