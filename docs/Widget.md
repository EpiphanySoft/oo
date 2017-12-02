# Widget

```javascript
    import { Widget } from '@epiphanysoft/oo';
    
    class MyWidget extends Widget {
        //
    }
```

In addition to what has already been [described](../Readme.md), the `Widget` class sets
several (readonly) instance properties as well as provides a handful of methods.

## Instance Properties

`Widget` maintains the following properties to describe an instance's current life cycle
state. These are:

 - `constructing` Starts as `true` and is cleared by the `constructor`.
 - `configuring` Set to `true` prior to calling `configure` and cleared afterward.
 - `destroying` Set to `true` on entry to `destroy()` (never cleared).
 - `destroyed` Set to `true` on exit from `destroy()`.
 - `meta` A readonly [reference](#_meta) to the class's [Meta](./Meta.md) class.

## Instance Methods

`Widget` defines the following life cycle methods:

 - [construct](#_construct)
 - [destruct](#_construct)
 - [destroy](#_lifecycle)

In addition, `Widget` defines these methods:

 - [callChain](./Processors.md#_chains)
 - [callChainRev](./Processors.md#_chains)
 - [configure](#_configure)

<a name="_lifecycle"></a>

## Life-cycle

It is recommended that derived classes not implement a `constructor`, but instead take
advantage of the `ctor` [method chain](./Mixins.md#_chains). To facilitate this, the
`constructor` of `Widget` takes a single `Object` parameter or "config object". Prior to
invoking the `ctor` method chain, the config object's properties are used to set the
widget's [configuration properties](../Readme.md#_configs) using the [configure](#_configure)
method.

`Widget` also defines a `destroy` method that is used to cleanup any resources that the GC
(garbage collector) won't handle. It is also recommended that derived classes not override
the `destroy` method, but instead implement a `dtor` method.

These methods ensure the following:

 - The `constructing` and `configuring` properties track construction.
 - The `destroying` and `destroyed` properties track destruction.
 - The `destroy` method is harmless to call after it has been called.

### `ctor`

The `ctor` method is like a `constructor` in that it is only called once as the instance
is being created.

```javascript
    class MyClass extends Widget {
        ctor () {
            // do constructor-like things
        }
    }
```

The major difference between a `ctor` and a standard `constructor` is how `ctor` methods
are called. `Widget` ensures that all `ctor` implementations in the class hierarchy are
called once and in the proper order.

For example:

```javascript
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
```
    
    > MyClass ctor
    > MyDerived ctor

The `ctor` implementations are called "top down" from the `Widget` class to the
derived-most class.

### `dtor`

As with `ctor` calls, the `Widget` class ensures that the proper `dtor` calls are made.
This saves derived classes from overriding `destroy` and remembering to call
`super.destroy()` at the proper time.

For example:

```javascript
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
```
    
    > MyDerived dtor
    > MyClass dtor

The `dtor` implementations are called "bottom up" from the derived-most class upwards to
the `Widget` class.

<a name="_construct"></a>

### `construct()` and `destruct()`

There are times when some manual involvement in the life cycle is needed. In these cases
there are the `construct` and `destruct` methods.

The `construct` method is called by the `constructor`, passing along all of its arguments.
The `construct` method in `Widget` invokes the `ctor` [method chain](./Mixins.md#_chains).
Conversely, the `destruct` method is called by the `destroy` method in `Widget`. The `dtor`
method chain is invoked by `Widget`'s implementation of `destruct`.

```javascript
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
    console.log('---');
    inst.destroy();
```

Produces:

    > MyDerived before construct
    > MyClass ctor
    > MyDerived ctor
    > MyDerived after construct
    > ---
    > MyDerived before destruct
    > MyDerived dtor
    > MyClass dtor
    > MyDerived after destruct

<a name="_configure"></a>

## `configure()`

This method applies the properties of a config object to the corresponding
[config properties](../Readme.md#_configs). This method is internally called by `construct`
in `Widget`.

To ensure that config property ordering is transparent, this process is not as simple as
calling `Object.assign()`. For example:

```javascript
    @define({
        config: {
            host: null,
            port: null
        }
    })
    class MyWidget extends Widget {
        hostUpdate (value) {
            this.connection.address = value + ':' + this.port;
        }
    }
    
    let inst = new MyWidget({
        host: '127.0.0.1',
        port: 123
    });
```

In the code above, the `hostUpdate` method consumes not only the new value for the `host`
config property but also the `port` config property. It is therefore important that the
`port` config property be the correct value.

The same solution to the above also applies when setting config properties after object
creation:

```javascript
    inst.configure({
        host: '192.168.1.10',
        port: 321
    })
```

See [here](./Configs.md) for more information on this process.

<a name="_meta"></a>

## `meta`

There is a static and non-static version of this property. It holds the [Meta](./Meta.md)
class instance for the corresponding `Widget`-derived class.
