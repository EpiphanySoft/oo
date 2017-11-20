# Classes

As the name implies, the goal of Configly is to make classes (and their
[instances](./Instances.md)) configurable. To recap, Configly provides:

 - Mixins (multiple inheritance)
 - Method Junctions
 - Method Chains
 - Extensible Processors

While most of these features are provided by the `Meta` class (which can be applied to
any class), standard usage is simplified by extending [Widget](./Widget.md).

## The `@define` Decorator

The `@define` decorator was used in [mixins](./Mixins.md) and [instances](./Instances.md),
but there are some additional features it provides:

 - prototype
 - static
 - processors

These features are called "processors". The `processors` processor is used to define new
processors (see below).

## The `prototype` Processor

The `prototype` processor is used to put non-method properties on the class prototype. This
is an easy way to share objects but also can help to provide a more constant object
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
    
    // same as:
    Object.assign(Something.prototype, {
        foo: 0,
        bar: true
    });
```

## The `static` Processor

Similar to the `prototype` processor, the `static` processor is used to place non-methods
on the class constructor:

```javascript
    @define({
        static: {
            all: new Map()
        }
    })
    class Something extends Widget {
    }
    
    // same as:
    Object.assign(Something, {
        all: new Map()
    });
```

## Custom Processors

Processors are class mutation directives. The `processors` processor allows class authors
to add new processors to the `@define` mechanism. The primary reason to write processors
instead of decorators is to ensure proper order of operations.

By default, inherited processors (such as `prototype`) will be applied before derived class
processors so this order is not typically a concern. When defining two processors, however,
it is worth considering their order:

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
    
    > applyBar: 2
    > applyFoo: 1

The name of the applier method is computed from the processor name:

    appierName = 'apply' + name[0].toUpperCase() + name.substr(1);

### Advanced Processor Options

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
    class CustomProcessor extends Widget {
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
    processors: {
        foo: {
            after: 'bar'  // "foo" requires "bar" to run first
        },
        bar: true  // the value "true" is ignored
    }
```

# Next Steps

See [here](./Processors.md) for a complete list of class processors.
