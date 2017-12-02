# oo
[![Build Status](https://travis-ci.org/EpiphanySoft/oo.svg?branch=master)](https://travis-ci.org/EpiphanySoft/oo)
[![Coverage Status](https://coveralls.io/repos/github/EpiphanySoft/oo/badge.svg?branch=master)](https://coveralls.io/github/EpiphanySoft/oo?branch=master)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)

`oo` is a class-based, object-oriented (OO) library for ES6+. `oo` expands on JavaScript
`class` to add powerful capabilities to [classes](./docs/Classes.md) and their
[instances](./docs/Instances.md).

The primary entry points for `oo` are `Widget` and `@define`. Widgets are just "interesting"
objects. Interesting objects are those that have features such as a managed life-cycle (not
just garbarge collected), properties with side-effects or belong to class hierarchies that
have

The `Widget` base class provides patterns and features that allow your code to focus on
its goal rather than all of the mechanical pieces that burden most classes. One simple
example is the `destroy()` method. This common pattern for cleaning up resources has the
equally common task of ensuring that multiple (possibly accidental) calls to `destroy()`
don't result in an exception:

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
the overall codebase that much more complex. Using `Widget`, the `destroy()` method is
guarded to ensure that secondary calls are ignored.

This is just the start of what `Widget` offers to make classes easier to get right.

The core features of [Widget](./docs/Widget.md) are:

 - [Common life-cycle](#_lifecycle)
 - [Mixins](#_mixins) (or multiple inheritance) ([more](./docs/Mixins.md))
 - [Configuration properties](#_configs)
 - [Method Junctions](#_junctions)
 - [Method Chains](#_chains)
 - [Extensible Processors](#_processors)

Only a few features are provided directly by `Widget`, so most of these can be applied to
other class hierarchies. This is because most important capabilities are implemented by
the helper class [Meta](./docs/Meta.md) (for "meta-class").

<a name="_lifecycle">

# Life-cycle

The `Widget` class defines two method chains (`ctor` and `dtor`) to manage life-cycle. The
`ctor` method is called "top down" during object instantiation while `dtor` is called
"bottom up" when `destroy()` is called.

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
```
    
    > MyClass ctor
    > MyDerived ctor
    
```javascript
    inst.destroy();
```

    > MyDerived dtor
    > MyClass dtor

In general, method chains are tied to their defining class and can be called in either
"top down" (forward) or "bottom up" (reverse) order. In the case of `ctor` and `dtor`,
these chains are automatically called by the `constructor` and `destroy` methods of
`Widget`, respectively.

<a name="_mixins">

# Mixins

Mixins provide a form of multiple-inheritance that allows behavior reuse beyond JavaScript's
standard, single-inheritance model.

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

            this.mixins.myMixin.foo.call(this);
        }
    }
    
    let inst = new MyDerived();
    
    inst.foo();
```
    
    > MyClass foo
    > MyDerived foo
    > MyMixin foo

Alternatively, classes can use a `@junction` method for such cases:

```javascript
    @define({
        mixins: MyMixin
    })
    class MyDerived extends MyClass {
        //...
        
        @junction
        foo () {
            super.foo(); // calls all inherited foo's (starting w/MyClass)

            console.log('MyDerived foo');
        }
    }
    
    //...
```
    
    > MyClass foo
    > MyMixin foo
    > MyDerived foo

For cases where mixins manage non-GC-able resources, the `ctor` and `dtor` life-cycle
methods also apply properly. 

```javascript
    let inst = new MyDerived();
```
    
    > MyClass ctor
    > MyMixin ctor
    > MyDerived ctor

```javascript
    inst.destroy();
```
    
    > MyDerived dtor
    > MyMixin dtor
    > MyClass dtor

<a name="_configs">

# Configuration Properties

<a name="_junctions">

# Method Junctions

<a name="_chains">

# Method Chains

<a name="_processors">

# Extensible Processors

# Next Steps

Above are some of the highlights. For more details see:
 
 - [Classes](./docs/Classes.md)
 - [Mixins](./docs/Mixins.md)
 - [Instances](./docs/Instances.md)
 - [Processors](./docs/Processors.md)
 - [Hacking](./docs/dev.md)
