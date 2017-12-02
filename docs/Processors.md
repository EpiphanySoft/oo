# Processors

The single object parameter passed to the `@define` decorator (or `define` static method)
contains properties named for a processor. The values of these properties are pased to the
processor to achieve the desired outcome:

```javascript
    import { Widget, define } from '@epiphanysoft/oo';

    @define({
        //... processors go here
    })
    class MyWidget extends Widget {
        //...
    }
```

The following processors are built-in:

 - [chains](#_chains)
 - [config](#_config)
 - [mixins](#_mixins)
 - [processors](#_processors)
 - [properties](#_properties)
 - [prototype](#_prototype)
 - [static](#_static)

Each processor maps to a static method on the class the name of which is derived from the
processor name.

For example, the following code:

```javascript
    import { Widget, define } from '@epiphanysoft/oo';

    @define({
        mixins: MyMixin
    })
    class MyWidget extends Widget {
        //...
    }
```

Is equivalent to:

```javascript
    import { Widget } from '@epiphanysoft/oo';

    class MyWidget extends Widget {
        //...
    }

    MyWidget.define({
        mixins: MyMixin
    });
```

And also equivalent to:

```javascript
    import { Widget } from '@epiphanysoft/oo';

    class MyWidget extends Widget {
        //...
    }

    MyWidget.applyMixins(MyMixin);
```

## Why Not Use Multiple Decorators?

It is perhaps tempting to view each of these processors as their own decorators (for
example, `@mixin`). While this can work in many cases, using multiple decorators does not
ensure a consistent order.

Instead that order is lexically determined. For example, consider these classes:

```javascript
    @foo @bar
    class FooBar {
    }

    @bar @foo
    class BarFoo {
    }
```

The different order of the above decorators results in different execution order. In many
cases this difference will not matter, but if the `@foo` and `@bar` decorators intersect
in some way, their order can be important.

<a name="_chains"></a>

# `chains`

Indicates that the specified methods should be managed as a chain. Unlike normal methods
that derived classes implement and use `super.method()` calls to invoke inherited methods,
method chains are invoked across the class hierarchy.

Consider these classes:

```javascript
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

The base `MyClass` defines a method chain on the `init` method. The goal is to enable
derived classes and mixins to implement `init` methods without orchestrating the exact
call sequence. Instead the `initialize()` method calls all of the `init()` implementations
in the various classes and mixins using `callChain()`. This ensures that all `init()`
methods are called and in the correct, top-down order.

<a name="_config"></a>

# `config`

WIP

<a name="_mixins"></a>

# `mixins`

Mixins are similar to a base class in that they are a way to inherit functionality from
one class to another.

```javascript
    @define({
        mixins: [ MyMixin, MyOtherMixin ]
    })
    class MyDerived extends MyClass {
        //
    }
```

Because JavaScript only truly understands single-inheritance via its prototype chain, the
properties (both `static` and on the mixin's prototype) are copied from `MyMixin` and
`MyOtherMixin` onto `MyDerived`. This is only performed if there is no collision on the
name of the property. In other words, properties already defined on `MyDerived` or inherited
from `MyClass` are not overridden by the mixins.

See [here](./Mixins.md) for more information on mixins.

<a name="_processors"></a>

# `processors`

This processor allows a class to define and order custom processors for use in derived
classes.

```javascript
    @define({
        processors: {
            foo: 'bar',   // "foo" requires "bar" to run first
            bar: true
        }
    })
    class FooBar extends Widget {
        static applyFoo (foo) {
            console.log('applyFoo: ', foo);
        }
        
        static applyBar (bar) {
            console.log('applyBar: ', bar);
        }
    }
```

In the above, `FooBar` adds a `foo` and `bar` processor and implements their logic in the
`applyFoo` and `applyBar` static methods. The order of these processors is also indicated
so that `applyBar` will run before `applyFoo`.

See [below](#_custom) for more information on custom processors.

<a name="_properties"></a>

# `properties`

Defines properties on the class prototype. This is primarily useful for controlling the
property options as opposed to `prototype`.

```javascript
    @define({
        properties: {
            foo: {
                value: 42
            }
        }
    })
    class Something extends Widget {
    }
```

The above is equivalent to the following:    

```javascript
    Object.defineProperties(Something.prototype, {
        foo: {
            value: 42
        }
    });
```

<a name="_prototype"></a>

# `prototype`

Copies properties to the class prototype. This is an easy way to provide a constant object
[shape](https://draft.li/blog/2016/12/22/javascript-engines-hidden-classes/).

```javascript
    @define({
        prototype: {
            foo: 0,
            bar: true
        }
    })
    class Something extends Widget {
    }
```
    
The above is equivalent to the following:    

```javascript
    Object.assign(Something.prototype, {
        foo: 0,
        bar: true
    });
```

<a name="_static"></a>

# `static`

Copies properties to the class constructor.

```javascript
    @define({
        static: {
            all: new Map()
        }
    })
    class Something extends Widget {
    }
```
    
The above is equivalent to the following:    

```javascript
    Object.assign(Something, {
        all: new Map()
    });
```

<a name="_custom"></a>

# Custom Processors

Processors are class mutation directives. The `processors` processor allows class authors
to add new processors to the `@define` mechanism. The primary reason to write processors
instead of decorators is, as statd, to ensure proper order of operations.

By default, inherited processors (such as `prototype`) will be applied before derived class
processors so this order is not typically a concern. When defining two processors, however,
it is worth considering their order:

```javascript
    @define({
        processors: {
            foo: true,
            bar: 'foo'   // "bar" requires "foo" to run first
        }
    })
    class FooBar extends Widget {
        static applyFoo (foo) {
            console.log('applyFoo: ', foo);
        }
        
        static applyBar (bar) {
            console.log('applyBar: ', bar);
        }
    }
```

This class adds a `foo` and `bar` processor and specifies their order of operation. When
processors are registered for a class, `@define` runs their static applier methods in the
specified order.

For example:

```javascript
    @define({
        foo: 1,
        bar: 2
    })
    class FooBarUser extends FooBar {
        //
    }
```
    
    > applyFoo: 1
    > applyBar: 2

The name of the applier method is computed from the processor name:

    appierName = 'apply' + name[0].toUpperCase() + name.substr(1);

## Advanced Processor Options

Let's now consider a processor that defines properties on the class prototype. Since the
`prototype` processor also places properties on the class prototype, there is room for
these processors to conflict.

Assume that the new processor should be executed before `prototype`:

```javascript
    @define({
        processors: {
            foo: {
                before: 'prototype'
            }
        }
    })
    class WidgetWithCustomProcessor extends Widget {
        static applyFoo (foo) {
            // runs before prototype processor...
        }
    }
```

When the value of a key in the object given to the `processors` processor is an object,
it can use two properties to configure its behavior:

 - `after`: The processors that this processor must execute after.
 - `before`: The processors that this processor must execute before.

Any value other than an object or string for a processor is ignored. This is also true of
any properties other than `before` and `after` in an object value.

In the first example, the `processors` could have be expressed as:

```javascript
    @define({
        processors: {
            foo: {
                after: 'bar'  // "foo" requires "bar" to run first
            },
            bar: true  // the value "true" is ignored
        }
    })
```
