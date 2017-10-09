# Configly

Configly is a class-based, object-orient (OO) library for ES6+. Configly expands on the
embattled JavaScript `class` keyword using ES.next decorators to add powerful capabilities
to [classes](./docs/Classes.md) and their [instances](./docs/Instances.md).

The primary entry points for Configly are its `Base` class and `@define` decorator. While
other base classes can be used, `Base` defines some  of useful behaviors:

 - Common life-cycle
 - Configuration property management

Other features provided by `Base` can be applied to other class hierarchies because they
are implemented by a helper class called `Meta` (for "meta-class"). These include:

 - Mixins (or multiple inheritance)
 - Method Junctions
 - Method Chains
 - Extensible Processors

# Life-cycle

The `Base` class defines two method chains (`ctor` and `dtor`) to manage life-cycle. The
`ctor` method is called "top down" during object instantiation while `dtor` is called
"bottom up" when `destroy()` is called.

    import { Base } from '@epiphanysoft/configly';
    
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
    }
    
    let inst = new MyDerived();
    
    > MyClass ctor
    > MyDerived ctor
    
    inst.destroy();

    > MyDerived dtor
    > MyClass dtor

In general, method chains are tied to their defining class and can be called in either
"top down" (forward) or "bottom up" (reverse) order. In the case of `ctor` and `dtor`,
these chains are automatically called by the `constructor` and `destroy` methods,
respectively.

# Mixins

Mixins provide a form of multiple-inheritance that allows behavior reuse beyond JavaScript's
standard, single-inheritance inheritance model.

    import { Base, define } from '@epiphanysoft/configly';
    
    class MyClass extends Base {
        ctor () {
            console.log('MyClass ctor');
        }
        
        dtor () {
            console.log('MyClass dtor');
        }
    }

    class MyMixin extends Base {
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
    
    > MyClass foo
    > MyDerived foo
    > MyMixin foo

For cases where mixins manage non-GC-able resources, the `ctor` and `dtor` life-cycle
methods also apply properly. 

    let inst = new MyDerived();
    
    > MyClass ctor
    > MyMixin ctor
    > MyDerived ctor

    inst.destroy();
    
    > MyDerived dtor
    > MyMixin dtor
    > MyClass dtor

# Next Steps

Above are some of the highlights. For more details see:
 
 - [Classes](./docs/Classes.md)
 - [Instances](./docs/Instances.md)
