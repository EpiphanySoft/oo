# Widget

`oo` exports a recommended `Widget` base class:

    import { Widget } from '@epiphanysoft/oo';
    
    class MyClass extends Widget {
        //
    }

`Widget` defines a standard object life-cycle as well as descriptive properties and helper
methods. 

## Instance Properties

`Widget` maintains the following properties to describe an instance's current life-cycle
state. These are:

 - `constructing` Starts as `true` and is cleared by the `constructor`.
 - `configuring` Set to `true` prior to calling `configure` and cleared afterward.
 - `destroying` Set to `true` on entry to `destroy()` (never cleared).
 - `destroyed` Set to `true` on exit from `destroy()`.
 - `$meta` A readonly reference to the class's [Meta](./Meta.md) class.

## Instance Methods

`Widget` defines the following methods:

 - callChain
 - callChainRev
 - configure
 - getMeta
 - reconfigure

## Life-cycle

The `constructor` of `Widget` expects a single `Object` parameter that holds configuration
properties (described later). It is not recommended that a derived class implement a
`constructor`, but instead take advantage of the `ctor` method.

`Widget` also defines a `destroy` method that is used to cleanup any resources that the GC
(garbage collector) won't handle. It is also not recommended that derived classes override
the `destroy` method but instead implement a `dtor` method.

These methods ensure the following:

 - The `constructing` and `configuring` properties track construction.
 - The `destroying` and `destroyed` properties track destruction.
 - The `destroy` method is harmless to call after it has been called.

### ctor

The `ctor` method is like a `constructor` in that it is only called once as the instance
is being created.

    class MyClass extends Widget {
        ctor () {
            // do constructor-like things
        }
    }

The major difference between a `ctor` and a standard `constructor` is how `ctor` methods
are called. `Widget` ensures that all `ctor` implementations in the class hierarchy are
called once and in the proper order.

For example:

    class MyClass extends Widget {
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

The `ctor` implementations are called "top down" from the `Widget` class to the
derived-most class.

### dtor

As with `ctor` calls, the `Widget` class ensures that the proper `dtor` calls are made.
This saves derived classes from overriding `destroy` and remembering to call
`super.destroy()` at the proper time.

For example:

    class MyClass extends Widget {
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
the `Widget` class.

### construct / destruct

There are times when some manual involvement in the life-cycle is needed. In these cases
there are the `construct` and `destruct` methods. The implementations of these methods in
`Widget` invoke the `ctor` and `dtor` methods, respectively.

    class MyClass extends Widget {
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
