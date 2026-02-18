# Type System API

## Overview

The Type System module provides static type checking, inference, and validation for FreeLang. It enforces type safety at compile-time and supports advanced features like generics, union types, and type constraints.

**Version**: v2.0.0
**Module**: `src/analyzer`, `src/type-checker`, `src/types`
**Key Features**:
- Static type checking with compile-time validation
- Generic type support (Phase 3+)
- Type inference and constraint solving
- Union types and type guards (Phase 8+)
- Cached type checking for 3-5x performance (Phase 14)

---

## Core Concepts

### Basic Types

FreeLang supports the following primitive types:

| Type | Example | Purpose |
|------|---------|---------|
| `number` | `42`, `3.14` | Integers and floats |
| `string` | `"hello"` | Text |
| `bool` | `true`, `false` | Boolean values |
| `char` | `'a'` | Single characters |

### Composite Types

| Type | Syntax | Example | Purpose |
|------|--------|---------|---------|
| Array | `array<T>` | `array<number>`, `array<string>` | Homogeneous sequences |
| Function | `fn(T, U) -> V` | `fn(number, string) -> bool` | Function signatures |
| Map | `map<K, V>` | `map<string, number>` | Key-value pairs |
| Union | `T \| U` | `number \| string` | Multiple possible types |
| Struct | Custom | `Point { x: number, y: number }` | Named structures |

### Generic Types

Generic types use type variables to represent polymorphic behavior:

```typescript
// Generic function type
fn(T, T) -> bool           // Equality function
fn(array<T>) -> T          // Array head function
fn(array<T>) -> array<T>   // Array map/filter
```

---

## Classes

### FunctionTypeChecker

Validates function call compatibility and tracks type errors.

#### Constructor

```typescript
constructor()
```

#### Methods

##### `checkFunctionCall(funcName, argTypes, expectedParams, expectedParamNames): TypeCheckResult`

Validates that arguments match function parameter types.

**Parameters**:
- `funcName` (string): Name of the function being called
- `argTypes` (string[]): Types of provided arguments
- `expectedParams` (Record<string, string>): Map of parameter names to types
- `expectedParamNames` (string[]): Ordered list of parameter names

**Returns**: `TypeCheckResult`

**Features**:
- LRU caching for 3-5x performance on repeated checks (Phase 14-2)
- Generic type constraint resolution
- Union type compatibility checking
- Detailed error messages with parameter mismatch info

**Example**:
```typescript
const checker = new FunctionTypeChecker();

const result = checker.checkFunctionCall(
  'add',
  ['number', 'number'],
  { a: 'number', b: 'number' },
  ['a', 'b']
);

if (result.compatible) {
  console.log('Type check passed');
} else {
  console.error(result.message);
  console.error(result.details);
}
```

---

##### `checkArrayMethod(methodName, arrayElementType, args): ArrayMethodResult`

Validates array method calls.

**Example**:
```typescript
const result = checker.checkArrayMethod(
  'map',
  'number',
  [{ type: 'lambda', paramType: 'number', returnType: 'string' }]
);
// Result: { compatible: true, resultType: 'array<string>' }
```

---

##### `checkLambdaExpression(params, body, context): LambdaExpressionResult`

Validates lambda expression types and infers signatures.

**Example**:
```typescript
const result = checker.checkLambdaExpression(
  [{ name: 'x', type: 'number' }],
  { type: 'binary', operator: '+', left: 'x', right: 5 },
  { variables: { x: 'number' } }
);
// Result: {
//   compatible: true,
//   functionType: 'fn(number) -> number',
//   returnType: 'number'
// }
```

---

##### `getErrors(): Array<TypeCheckError>`

Returns all accumulated type errors.

**Example**:
```typescript
const errors = checker.getErrors();
errors.forEach(error => {
  console.log(`${error.functionName}: ${error.error.message}`);
});
```

---

### TypeParser

Parses and validates type signatures.

#### Static Methods

##### `parseType(typeString): ParsedType`

Parses a type string into a structured representation.

**Parameters**:
- `typeString` (string): Type signature like `"array<number>"`, `"fn(T) -> U"`

**Returns**: `ParsedType` - Structured type representation

**Example**:
```typescript
const parsed = TypeParser.parseType('array<number>');
// Result: { base: 'array', params: ['number'] }

const generic = TypeParser.parseType('fn(T, T) -> bool');
// Result: { base: 'fn', params: ['T', 'T'], returnType: 'bool' }
```

---

##### `areTypesCompatible(expected, received): boolean`

Checks if two types are compatible.

**Parameters**:
- `expected` (string): Expected type
- `received` (string): Received type

**Returns**: `boolean`

**Features**:
- Handles generic type constraints
- Checks union type membership
- Validates function signatures
- Coercion rules for numeric types

**Example**:
```typescript
TypeParser.areTypesCompatible('number', 'number');           // true
TypeParser.areTypesCompatible('number | string', 'string'); // true
TypeParser.areTypesCompatible('array<T>', 'array<number>'); // true
TypeParser.areTypesCompatible('number', 'string');          // false
```

---

##### `unifyTypes(constraints): Map<string, string>`

Solves type variable constraints.

**Parameters**:
- `constraints` (TypeConstraint[]): Array of type constraints

**Returns**: `Map<string, string>` - Variable name → concrete type

**Use Case**: Resolves generic type variables when calling generic functions

**Example**:
```typescript
const constraints = [
  { typeVar: 'T', constrainedType: 'number', source: 'arg0' },
  { typeVar: 'T', constrainedType: 'number', source: 'arg1' }
];
const solution = TypeParser.unifyTypes(constraints);
// Result: Map { 'T' => 'number' }
```

---

## Interfaces

### TypeCheckResult

Result of a type check operation.

```typescript
interface TypeCheckResult {
  compatible: boolean;           // Type check passed
  message: string;               // Human-readable message
  details?: {
    expected?: string;           // Expected type
    received?: string;           // Received type
    paramName?: string;          // Parameter name (if applicable)
    paramIndex?: number;         // Parameter index (if applicable)
  };
}
```

**Example**:
```typescript
const result: TypeCheckResult = {
  compatible: false,
  message: "Parameter 'count' expects 'number', got 'string'",
  details: {
    expected: 'number',
    received: 'string',
    paramName: 'count',
    paramIndex: 0
  }
};
```

---

### FunctionTypes

Type information for a function.

```typescript
interface FunctionTypes {
  params: Record<string, string>;    // Parameter name → type
  returnType?: string;                // Return type (optional)
}
```

**Example**:
```typescript
const funcType: FunctionTypes = {
  params: {
    'a': 'number',
    'b': 'number'
  },
  returnType: 'number'
};
```

---

### GenericFunctionType

Type information for generic functions.

```typescript
interface GenericFunctionType {
  typeVars: string[];                // Type variables: ['T', 'U', 'V']
  params: Record<string, string>;    // param name → type (may use type vars)
  returnType?: string;               // Return type (may use type vars)
}
```

**Example**:
```typescript
const genericFunc: GenericFunctionType = {
  typeVars: ['T'],
  params: {
    'arr': 'array<T>',
    'fn': 'fn(T) -> U'
  },
  returnType: 'array<U>'
};
```

---

### TypeConstraint

Constraint from a function call (Phase 3).

```typescript
interface TypeConstraint {
  typeVar: string;                   // Variable name: 'T', 'U'
  constrainedType: string;           // Concrete or variable type
  source: string;                    // Where constraint came from
}
```

**Example**:
```typescript
const constraint: TypeConstraint = {
  typeVar: 'T',
  constrainedType: 'number',
  source: 'first argument to map'
};
```

---

### ArrayMethodResult

Result of array method type checking.

```typescript
interface ArrayMethodResult {
  compatible: boolean;              // Type check passed
  resultType?: string;              // Result type of method
  error?: TypeCheckResult;          // Error if incompatible
}
```

**Example**:
```typescript
const result: ArrayMethodResult = {
  compatible: true,
  resultType: 'array<string>'
};
```

---

### LambdaExpressionResult

Result of lambda expression type checking.

```typescript
interface LambdaExpressionResult {
  compatible: boolean;              // Type check passed
  functionType?: string;            // Inferred type: 'fn(T, U) -> V'
  paramTypes?: string[];            // Inferred parameter types
  returnType?: string;              // Inferred return type
  capturedVars?: string[];          // Closure-captured variables
  error?: TypeCheckResult;          // Error if incompatible
}
```

**Example**:
```typescript
const result: LambdaExpressionResult = {
  compatible: true,
  functionType: 'fn(number) -> number',
  paramTypes: ['number'],
  returnType: 'number',
  capturedVars: ['multiplier']
};
```

---

## Usage Examples

### Type Checking a Function Call

```typescript
import { FunctionTypeChecker } from './type-checker';

const checker = new FunctionTypeChecker();

// Define function signature
const funcType = {
  params: {
    'arr': 'array<number>',
    'initial': 'number'
  },
  returnType: 'number'
};

// Check function call
const result = checker.checkFunctionCall(
  'reduce',
  ['array<number>', 'number'],
  funcType.params,
  ['arr', 'initial']
);

if (!result.compatible) {
  console.error(`Type error: ${result.message}`);
  console.error(JSON.stringify(result.details, null, 2));
}
```

---

### Generic Type Constraint Resolution

```typescript
import { TypeParser, TypeConstraint } from './type-parser';

// Generic function: fn(array<T>, fn(T) -> U) -> array<U>
// Call: sort([1, 2, 3], |x| x * 2)
const constraints: TypeConstraint[] = [
  { typeVar: 'T', constrainedType: 'number', source: 'array element type' },
  { typeVar: 'U', constrainedType: 'number', source: 'lambda return type' }
];

const solution = TypeParser.unifyTypes(constraints);
console.log(solution); // Map { T => 'number', U => 'number' }
```

---

### Type Compatibility Checking

```typescript
import { TypeParser } from './type-parser';

// Check various type compatibility scenarios
console.log(TypeParser.areTypesCompatible('number', 'number'));           // true
console.log(TypeParser.areTypesCompatible('number | string', 'string')); // true
console.log(TypeParser.areTypesCompatible('array<number>', 'array<T>')); // true (with T=number)
console.log(TypeParser.areTypesCompatible('number', 'string'));          // false
console.log(TypeParser.areTypesCompatible('array<number>', 'array<string>')); // false
```

---

### Lambda Expression Type Inference

```typescript
import { FunctionTypeChecker } from './type-checker';

const checker = new FunctionTypeChecker();

// Lambda: |x: number| x + 1
const result = checker.checkLambdaExpression(
  [{ name: 'x', type: 'number' }],
  { type: 'binary', operator: '+', left: 'x', right: 1 },
  { variables: { x: 'number' } }
);

if (result.compatible) {
  console.log(`Lambda type: ${result.functionType}`);    // fn(number) -> number
  console.log(`Return type: ${result.returnType}`);      // number
}
```

---

## Performance Optimizations

### Type Check Caching (Phase 14-2)

Type checks are cached for frequently-used functions:

```typescript
// First call: full type check (~1ms)
const result1 = checker.checkFunctionCall('add', ['number', 'number'], ...);

// Second call: from cache (~0.2ms) - 5x faster
const result2 = checker.checkFunctionCall('add', ['number', 'number'], ...);
```

**Cache Statistics**:
- Hit rate: 80%+ on typical programs
- Memory overhead: <1MB for average project
- Automatic invalidation: When function signatures change

---

### Type Variable Substitution

When a generic function is called, type variables are substituted:

```
Generic: fn(T, T) -> bool
Call:    equals(5, 10)
Result:  T = number, returns bool
```

---

## Type Rules

### Subtyping

```
number     ≤ number | string    (union)
array<T>  ≤ array<T>           (exact match)
```

### Function Compatibility

```
fn(number) -> string  ≤  fn(number | bool) -> string | null
(contravariant parameters, covariant return)
```

### Generic Unification

```
array<T>  with  array<number>   →   T = number
fn(T) -> T  with  fn(string) -> string  →  T = string
```

---

## Error Scenarios

| Error | Cause | Example |
|-------|-------|---------|
| Type mismatch | Wrong argument type | `add("x", 5)` |
| Argument count | Wrong number of args | `add(5)` |
| Generic constraint | Type variable conflicts | `fn(T, T)` called with `fn(number, string)` |
| Union type | Not a member of union | `str + num` when `str` is `string \| null` |
| Constraint unsolvable | No type satisfies all constraints | Type variable impossible to resolve |

---

## Best Practices

1. **Annotate generic parameters**: Use explicit type annotations for generic functions
2. **Cache type checkers**: Reuse `FunctionTypeChecker` instances
3. **Check before execution**: Validate types at compile-time, not runtime
4. **Use union types for flexibility**: `number | string` better than multiple overloads
5. **Enable type inference**: Let the system infer types for locals when possible

---

## Related Documentation

- [Lexer API](./lexer.md) - Token generation
- [Parser API](./parser.md) - AST generation
- [Semantic Analyzer](./semantic-analyzer.md) - Context and scope analysis
- [Compiler Pipeline](../COMPILER-PIPELINE.md) - Full compilation flow

---

**Last Updated**: 2026-02-18
**Status**: Production Ready (Phase 1-3+)
**Test Coverage**: 1,942+ tests passing ✅
