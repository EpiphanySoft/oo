# Processors

The `@define` decorator understands the following built-in processors:

 - [chains](#chains)
 - [config](#config)
 - [mixinId](#mixinId)
 - [mixins](#mixins)
 - [processors](#processors)
 - [properties](#properties)
 - [prototype](#prototype)
 - [static](#static)

While all processors operate upon [classes](./Classes.md), the `config` processor is
ultimately concerned with the [instances](./Instances.md) of the classes.

## `chains`
<a name="chains">

Indicates that the specified methods should be managed as a chain. Unlike normal methods
that derived classes implement and use `super.method()` calls to invoke inherited methods,
method chains are invoked across the class hierarchy.

Consider these classes:

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

The base `MyClass` defines a method chain on the `init` method. The goal is to enable
derived classes and mixins to implement `init` methods without orchestrating the exact
call sequence. Instead the `initialize()` method calls all of the `init()` implementations
in the various classes and mixins using `callChain()`. This ensures that all `init()`
methods are called and in the correct, top-down order.

## `config`
<a name="config">

WIP

## `mixinId`
<a name="mixinId">

Sets the identity for a class when it is used as a mixin. This is used as the key in the
`mixins` object maintained for classes using mixins.

Consider a simple mixin:

    import { Base, define } from '@epiphanysoft/configly';
    
    class MyClass extends Base {
        foo () {
            console.log('MyClass foo');
        }
    }

    @define({
        mixinId: 'mymixin'  // the name of this mixin
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
            
            // "this.mixins" is maintained so that we can call into our mixin:
            this.mixins.mymixin.foo.call(this);
        }
    }

The `mixins` object is maintained on the class constructor and prototype:

    MyDerived.mixins['mymixin'] = MyMixin;
    MyDerived.prototype.mixins['mymixin'] = MyMixin.prototype;

## `mixins`
<a name="mixins">

Mixins are similar to a base class in that they are a way to inherit functionality from
one class to another.

    import { Base, define } from '@epiphanysoft/configly';
    
    @define({
        mixins: [ MyMixin, MyOtherMixin ]
    })
    class MyDerived extends MyClass {
        //
    }

Because JavaScript only truly understands single-inheritance via its prototype chain, the
properties (both `static` and on the mixin's prototype) are copied from `MyMixin` and
`MyOtherMixin` onto `MyDerived`. This is only performed if there is no collision on the
name of the property. In other words, properties already defined on `MyDerived` or inherited
from `MyClass` are not overridden by the mixins.

See [here](./Mixins.md) for more information on mixins.

<a name="processors">
## `processors`

This processor allows a class to define and order custom processors for use in derived
classes.

    @define({
        processors: {
            foo: 'bar',   // "foo" requires "bar" to run first
            bar: true
        }
    })
    class FooBar extends Base {
        static applyFoo (foo) {
            console.log('applyFoo: ', foo);
        }
        
        static applyBar (bar) {
            console.log('applyBar: ', bar);
        }
    }

In the above, `FooBar` adds a `foo` and `bar` processor and implements their logic in the
`applyFoo` and `applyBar` static methods. The order of these processors is also indicated
so that `applyBar` will run before `applyFoo`.

See [here](./Classes.md) for more information on custom processors.

## `properties`
<a name="properties">

Defines properties on the class prototype. This is primarily useful for controlling the
property options as opposed to `prototype`.

    @define({
        properties: {
            foo: {
                value: 42
            }
        }
    })
    class Something extends Base {
    }
    
    // same as:
    Object.defineProperties(Something.prototype, {
        foo: {
            value: 42
        }
    });

## `prototype`
<a name="prototype">

Copies properties to the class prototype. This is an easy way to provide a constant object
[shape](https://draft.li/blog/2016/12/22/javascript-engines-hidden-classes/).

    @define({
        prototype: {
            foo: 0,
            bar: true
        }
    })
    class Something extends Base {
    }
    
    // same as:
    Object.assign(Something.prototype, {
        foo: 0,
        bar: true
    });

## `static`
<a name="static">

Copies properties to the class constructor.

    import { Base, define } from '@epiphanysoft/configly';
    
    @define({
        static: {
            all: new Map()
        }
    })
    class Something extends Base {
    }
    
    // same as:
    Object.assign(Something, {
        all: new Map()
    });
