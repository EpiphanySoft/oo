# oo
[![Build Status](https://travis-ci.org/EpiphanySoft/oo.svg?branch=master)](https://travis-ci.org/EpiphanySoft/oo)
[![Coverage Status](https://coveralls.io/repos/github/EpiphanySoft/oo/badge.svg?branch=master)](https://coveralls.io/github/EpiphanySoft/oo?branch=master)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)

`oo` is an object-oriented (OO) library. It's primary exports are the `Widget` base class
and `@define` [decorator](https://github.com/tc39/proposal-decorators#decorators).

Widgets are just "interesting" objects. Interesting objects are those that have behaviors
such as a managed life-cycle (not just garbage collected) or properties with side-effects,
or perhaps belong to class hierarchies.

The `Widget` base class provides patterns and features that allow you to not implement the
mechanics required by such "interesting" classes.

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
 - [Class decoration](#_define)
 - [Mixins](#_mixins) (or multiple inheritance) ([more](./docs/Mixins.md))
 - [Configuration properties](#_configs)
 - [Method Junctions](./docs/Mixins.md#_junctions)
 - [Method Chains](./docs/Mixins.md#_chains)

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

The key benefits of method chains are two-fold: first, there is no need for `super` calls
sprinkled all over, or worse, accidentally forgotten; second, the calls are always made
in the correct order.

See [here](./docs/Widget.md#_lifecycle) for more on the `Widget` life-cycle.

<a name="_define">

# Class Decoration

The `@define` [decorator](https://github.com/tc39/proposal-decorators#decorators) is the 
primary means to access the functionality in `oo` beyond that of the `Widget` class.

```javascript
    import { Widget, define } from '@epiphanysoft/oo';

    @define({
        //...
    })
    class MyWidget extends Widget {
        //...
    }
```

Because decorators are not yet standardized, they require the `transform-decorators-legacy`
Babel plugin to use. This may change as `oo` updates to track the evolving standard, though
that will not likely impact user code.

You can avoid this by instead using the `define` static method:

```javascript
    import { Widget } from '@epiphanysoft/oo';

    class MyWidget extends Widget {
        //...
    }
    
    MyWidget.define({
        //...
    })
```

The object parameter passed to either form of `define` contains one or more properties
that map to [processors](./docs/Processors.md). The next section illustrates the use of
the `mixins` processor.

<a name="_mixins">

# Mixins

Mixins add multiple-inheritance as a means of behavior reuse beyond JavaScript's
single-inheritance model. Unlike other approaches to mixins, in `oo` mixins are also
`Widget`'s. When a class is mixed into another, any properties that it has defined or
inherited are copied to the target class assuming the target class does not already define
that property. Because the mixin and its target share (at least) the common base class of
`Widget`, that is the furthest up the class hierarchy that the mixin processor must climb
to copy inherited properties.

Mixins are otherwise just like any other `Widget` class. In particular, they participate
in the common object life-cycle.

Consider:

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

In addition to life-cycle, the above example illustrates how to invoke methods in mixins
when those methods are not copied into the class due to a name collision. An alternative
approach is to use a [method junction](./docs/Mixins.md#_junctions). Junctions are even
more compelling when multiple mixins are involved.

See [here](./docs/Mixins.md) for more about mixins.

<a name="_configs">

# Configuration Properties

The key to the simple `Widget` [lifecycle](#_lifecycle) is the standardized means of
instance configuration.

The `Widget` constructor accepts a "configuration object" (also called "config object").
The properties of the config object are matched to special properties on the class called
"config properties" (or simply "configs").

Config properties are like normal properties in many ways and look identical in the use
of the widget. Internally, config properties provide a simple framework for implementing
smart properties that have one or more of the following characteristics:

 - Side-effects on value change
 - Squelch side-effect processing when set to the current value
 - Ordering of side-effects between related properties
 - Similar ordering when reconfiguring (bulk property change)

The following example illustrates the basic usage of a config property:

```javascript
    import { Widget, define } from '@epiphanysoft/oo';

    @define({
        // declare the class config properties
        config: {
            // An "address" config with default value of null
            address: null
        }
    })
    class Connection extends Widget {
        // this method is only called when "address" is updated:
        addressUpdate (value, was) {
            console.log(`connect(${value}${was ? ' was ' + was : ''})`);
        }
    }
    
    let conn = new Connection({
        address: '127.0.0.1:8080'
    });
    
    console.log('---');
    
    conn.address = '127.0.0.1:8080';  // same value; not an update
    
    console.log('---');
    
    conn.address = '192.168.1.10:80';
```

The above snippet will produce the following output:

    > connect(127.0.0.1:8080)
    > ---
    > ---
    > connect(192.168.1.10:80 was 127.0.0.1:8080)

See [here](./docs/Configs.md) to learn more about config properties. 

# Next Steps

Above are some of the highlights. For more details see:
 
 - [Mixins](./docs/Mixins.md)
 - [Configs](./docs/Configs.md)
 - [Processors](./docs/Processors.md)
 - [Hacking](./docs/dev.md)
