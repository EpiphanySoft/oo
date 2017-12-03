# oo
[![Build Status](https://travis-ci.org/EpiphanySoft/oo.svg?branch=master)](https://travis-ci.org/EpiphanySoft/oo)
[![Coverage Status](https://coveralls.io/repos/github/EpiphanySoft/oo/badge.svg?branch=master)](https://coveralls.io/github/EpiphanySoft/oo?branch=master)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)

`oo` is a library that gives its users new, object-oriented (OO) super powers. These come
primarily through its `Widget` base class and `@define`
[decorator](https://github.com/tc39/proposal-decorators#decorators).

Widgets are what you might call "interesting" objects. Interesting in the sense that they
have behaviors such as responsive properties (where changes have side-effects), or managed
life cycle (not just garbage collected) or are perhaps part of a rich class hierarchy.

The `Widget` base class provides patterns and features that allow you to avoid mechanical
details often required by such interesting classes.

A simple example would be the `destroy()` method. This common pattern for cleaning up
resources has the equally common burden of ensuring that multiple (probably accidental)
calls to `destroy()` don't result in an exception:

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

While this is typically easy to handle (when it is detected), paranoia code just makes
your codebase that much more complex. Using `Widget`, the `destroy()` method ensures that
subsequent calls are ignored.

This example is just the start of what [Widget](./docs/Widget.md) provides:

 - [Common life cycle](#_lifecycle)
 - [Class decoration](#_define)
 - [Mixins](#_mixins) (or multiple inheritance) ([more](./docs/Mixins.md))
 - [Configuration properties](#_configs)
 - [Method Junctions](./docs/Mixins.md#_junctions)
 - [Method Chains](./docs/Mixins.md#_chains)

Only a few features are provided directly by `Widget`, so most of these can be applied to
other class hierarchies. These transplantable capabilities are implemented by the helper
class [Meta](./docs/Meta.md) (for "meta-class").

<a name="_lifecycle"></a>

# Life cycle

The `Widget` class defines two method chains (`ctor` and `dtor`) to manage object life
cycle. Method chains are a powerful construct (explained [here](./docs/Mixins.md#_chains)),
but their role in object life cycle should make their value clear.

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

Methods in a method chain are tied to their defining class and are called in either
forward ("top down") or reverse ("bottom up") order. For life cycle methods such as these,
`ctor` is called in forward order and `dtor` in reverse, as can be seen by their `log()`
statements.

The key benefits of method chains are two-fold: first, there is no need for `super` calls
sprinkled all over, or worse, forgotten; second, these calls are always made in the correct
order without requiring assistance in application code.

See [here](./docs/Widget.md#_lifecycle) for more on the `Widget` life cycle.

<a name="_define"></a>

# Class Decoration

Beyond the `Widget` base class, the `@define` decorator is the primary means to access the
functionality provided by `oo`: 

```javascript
    import { Widget, define } from '@epiphanysoft/oo';

    @define({
        //...
    })
    class MyWidget extends Widget {
        //...
    }
```

Because [decorators](https://github.com/tc39/proposal-decorators#decorators) are not yet
standardized, they require the `transform-decorators-legacy` Babel plugin to use. This
will change as the standard evolves, though that will not likely impact user code.

You can avoid transpiling by using the `define` static method instead of `@define`:

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

<a name="_mixins"></a>

# Mixins

Mixins bring multiple-inheritance to classes. Unlike other approaches to mixins, in `oo`
mixins are also `Widget`'s. When a class is mixed into another, any properties that it has
defined or inherited are copied to the target class unless the target class has already
defined that property. Because the mixin and its target share (at least) the common base
class of `Widget`, that is the furthest up the class hierarchy that the mixin processor
must climb to copy inherited properties.

Mixins are otherwise just like any other `Widget` class. In particular, they participate
in the common object life cycle.

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

In addition to life cycle, the above example illustrates how to invoke methods in mixins
when there is a name collision. In this case, the method is not copied from the mixin so
the target class simply calls the method directly. An alternative approach is to use a
[method junction](./docs/Mixins.md#_junctions). Junctions are even more compelling when
multiple mixins are involved.

See [here](./docs/Mixins.md) for more about mixins.

<a name="_configs"></a>

# Configuration Properties

The key to the simple `Widget` [life cycle](#_lifecycle) is the standardized means of
instance configuration.

The `Widget` constructor accepts a "configuration object" (also called "config object").
The properties of the config object are used to initialize special properties on the class
called "config properties" (or simply "configs").

Config properties are like normal properties in many ways and look identical in the use
of the widget. Internally, config properties provide a simple framework for implementing
intelligent properties that have one or more of the following characteristics:

 - Side-effects on value change
 - Ignore being set to the current value
 - Ordering of side-effects between related properties
 - Similar ordering when reconfiguring (bulk property change)

The following example illustrates the basic form of a config property:

```javascript
    import { Widget, define } from '@epiphanysoft/oo';

    @define({
        // use the config processor
        config: {
            // Define the "address" config with default value of null
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

For efficiency reasons, the `addressUpdate` method is not called to set an initial value
of `null`. It is assumed that this is effectively represented in widget's initial state.

See [here](./docs/Configs.md) to learn more about config properties. 

# Next Steps

Above are some of the highlights. For more details see:
 
 - [Widgets](./docs/Widget.md)
 - [Mixins](./docs/Mixins.md)
 - [Configs](./docs/Configs.md)
 - [Processors](./docs/Processors.md)
 - [Hacking](./docs/dev.md)
