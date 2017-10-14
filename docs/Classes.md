# Classes

As the name implies, the goal of Configly is to make classes (and their
[instances](./Instances.md)) configurable. To recap, Configly provides:

 - Mixins (multiple inheritance)
 - Method Junctions
 - Method Chains
 - Extensible Processors

While most of these features are provided by Configly's `Meta` class (which can be applied
to any class), standard usage is simplified by extending Configly's [Base](./Base.md) class.

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

## The `static` Processor

Similar to the `prototype` processor, the `static` processor is used to place non-methods
on the class constructor:

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

## Custom Processors

Processors are class mutation directives. The `processors` processor allows class authors
to add new processors to the `@define` mechanism. The primary reason to write processors
instead of decorators is to ensure proper order of operations.

For example, consider a processor that defines properties on the class prototype. Since
the `prototype` processor also places properties on the class prototype, there is room for
these processors to conflict. Normally, inherited processors (such as `prototype`) will be
applied before derived class processors. For this example, assume our new processor 
TODO
