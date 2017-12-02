# oo
[![Build Status](https://travis-ci.org/EpiphanySoft/oo.svg?branch=master)](https://travis-ci.org/EpiphanySoft/oo)
[![Coverage Status](https://coveralls.io/repos/github/EpiphanySoft/oo/badge.svg?branch=master)](https://coveralls.io/github/EpiphanySoft/oo?branch=master)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)

`oo` is a class-based, object-oriented (OO) library. It's primary exports are its `Widget`
base class and `@define` decorator.

Widgets are just "interesting" objects. Interesting objects are those that have behaviors
such as a managed life-cycle (not just garbage collected) or properties with side-effects,
or perhaps belong to class hierarchies.

The `Widget` base class provides patterns and features that allow your code to focus on
its goal rather than all of the mechanical pieces that burden such "interesting" classes.

A simple example is the `destroy()` method. This common pattern for cleaning up resources
has the equally common task of ensuring that multiple (possibly accidental) calls to
`destroy()` don't result in an exception:

```javascript
    class Foo {
        constructor () {
            this.resource = new Resource();
        }
        
        destroy () {
            this.resource.destroy();  // exception here on 2nd call
            this.resource = null;
        }
    }
```

While this is typically easy to handle (when it is detected), "paranoia code" just makes
the overall codebase that much more complex. Using `Widget`, the `destroy()` method ensures
that secondary calls are ignored.

This example is just the start of what [Widget](./docs/Widget.md) provides:

 - [Common life-cycle](#_lifecycle)
 - [Mixins](#_mixins) (or multiple inheritance) ([more](./docs/Mixins.md))
 - [Configuration properties](#_configs)
 - [Method Junctions](./docs/Mixins.md#_junctions)
 - [Method Chains](./docs/Mixins.md#_chains)
 - [Extensible Processors](#_processors)

Only a few features are provided directly by `Widget`, so most of these can be applied to
other class hierarchies. This is because most important capabilities are implemented by
the helper class [Meta](./docs/Meta.md) (for "meta-class").

<a name="_lifecycle">

# Life-cycle

The `Widget` class defines two [method chains](./docs/Mixins.md#_chains) (`ctor` and `dtor`)
to manage object life-cycle. Method chains are a powerful construct that are explained in
general elsewhere, but their role in object life-cycle should make their value clear.

The `ctor` method is called during object instantiation while `dtor` is called during
destruction (initiated by `destroy()`).

Consider:

```javascript
    import { Widget } from '@epiphanysoft/oo';
    
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
    }
    
    let inst = new MyDerived();
    console.log('----');
    inst.destroy();
```

When the above code executes, the output will look like this:
    
    > MyClass ctor
    > MyDerived ctor
    > ----
    > MyDerived dtor
    > MyClass dtor

In general, methods in a method chain are tied to their defining class and are called in
either "top down" (forward) or "bottom up" (reverse) order. For life-cycle methods such as
these, `ctor` is called in forward order and `dtor` in reverse as can be seen by the order
of their `log()` statements.

See [here](./docs/Widget.md#_lifeCycle) for more on the `Widget` life-cycle.

<a name="_mixins">

# Mixins

Mixins provide a form of multiple-inheritance that allows behavior reuse beyond JavaScript's
standard, single-inheritance model.

Unlike other approaches to mixins, in `oo` mixins are widgets. In other words, mixins are
just like any other widget class. In particular, they can participate in the common object
life-cycle:

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

        foo () {
            console.log('MyMixin foo');
        }
    }

    @define({
        mixins: MyMixin
    })
    class MyDerived extends MyClass {
        ctor () {
            console.log('MyDerived ctor');
        }
        
        dtor () {
            console.log('MyDerived dtor');
        }

        foo () {
            super.foo();

            console.log('MyDerived foo');

            MyMixin.prototype.foo.call(this);
        }
    }
    
    let inst = new MyDerived();
    console.log('---');
    inst.foo();
    console.log('---');
    inst.destroy();
```

The above snippet generates the following output:

    > MyClass ctor
    > MyMixin ctor
    > MyDerived ctor
    > ---
    > MyClass foo
    > MyDerived foo
    > MyMixin foo
    > ---
    > MyDerived dtor
    > MyMixin dtor
    > MyClass dtor

A cleaner solution to the above, especially if multiple mixins collide, is to use a method
[junction](./docs/Mixins.md#_junctions).

See [here](./docs/Mixins.md) for more about mixins.

<a name="_configs">

# Configuration Properties

<a name="_processors">

# Extensible Processors

# Next Steps

Above are some of the highlights. For more details see:
 
 - [Classes](./docs/Classes.md)
 - [Mixins](./docs/Mixins.md)
 - [Instances](./docs/Instances.md)
 - [Processors](./docs/Processors.md)
 - [Hacking](./docs/dev.md)
