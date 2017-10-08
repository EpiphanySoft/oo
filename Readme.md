# Configly

Configly is a class-based, object-orient (OO) library for ES6+. Configly embraces the
embattled JavaScript `class` keyword and ES.next decorators to bring powerful capabilities
to classes.

## Classes

As the name implies, the goal of Configly is to make classes (and their instances, as
described below) configurable. This starts at the class-level by allowing classes to be
augmented in several ways:

 - Mixins (multiple inheritance)
 - Method junctions
 - Method chains
 - Extensible processors

The `@define` decorator (or `static` method) provides a consistent way to accomplish the
above. It is perhaps tempting to view each of these goals as their own decorators (say
`@mixin` for example). While this can work, using multiple decorators does not ensure a
consistent order. Instead that order is lexically determined.

For example, consider these two classes:

    @foo
    @bar
    class FooBar {
    }

    @bar
    @foo
    class BarFoo {
    }

In many cases these classes will be equivalent, but if the `@foo` and `@bar` decorators
intersect in some way, their order can be important.

### Mixins

#### Method Junctions

#### Method Chains

### Class Processors
