/**
 * FreeLang Binder — Phase between Parser and IR Generator
 *
 * Builds symbol tables and validates variable/function references
 * at compile time, catching undef_var errors before runtime.
 *
 * Pipeline: Lexer → Parser → BINDER → IR Generator → VM
 *
 * Inspired by TypeScript compiler's binder phase.
 */

// ── Symbol & Scope Types ──

export type SymbolKind = 'variable' | 'function' | 'parameter' | 'builtin';

export interface BindSymbol {
  name: string;
  kind: SymbolKind;
  declNode?: any;  // AST node where declared
}

export interface Scope {
  kind: 'module' | 'function' | 'block';
  parent: Scope | null;
  symbols: Map<string, BindSymbol>;
  functionName?: string;  // for function scopes
}

export interface BindError {
  message: string;
  name: string;
  line?: number;
  column?: number;
}

export interface BindResult {
  ok: boolean;
  errors: BindError[];
  warnings: BindError[];
  symbolCount: number;
  scopeCount: number;
}

// ── Built-in function names (always available) ──
const BUILTIN_FUNCTIONS = new Set([
  // Phase A: Core
  'println', 'print', 'str', 'int', 'float', 'bool', 'typeof',
  'length', 'push', 'pop', 'shift', 'unshift', 'splice',
  'slice', 'concat', 'join', 'reverse', 'sort',
  'indexOf', 'lastIndexOf', 'includes', 'find',
  'map', 'filter', 'reduce', 'forEach', 'some', 'every',
  // Math
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'sqrt', 'abs', 'ceil', 'floor', 'round', 'min', 'max',
  'pow', 'exp', 'log', 'log10', 'log2', 'random',
  // String
  'strlen', 'toupper', 'tolower', 'trim', 'split', 'replace',
  'substring', 'startsWith', 'endsWith', 'charAt', 'charCodeAt',
  // I/O
  'file_read', 'file_write', 'file_exists', 'file_delete', 'file_append',
  // System
  'os_platform', 'os_arch', 'os_time', 'os_env', 'os_exit',
  // JSON
  'json_parse', 'json_stringify', 'json_pretty',
  // Regex
  'regex_test', 'regex_match', 'regex_replace', 'regex_split',
  // Misc
  'random', 'uuid', 'sleep',
  'base64_encode', 'base64_decode', 'url_encode', 'url_decode',
  // Map
  'map_new', 'map_set', 'map_get', 'map_has', 'map_delete', 'map_keys', 'map_values', 'map_size',
  // keys/values/entries
  'keys', 'values', 'entries',
  // HTTP
  'http_get', 'http_post', 'http_put', 'http_delete', 'fetch_json',
  // Date
  'date_format', 'date_parse',
  // Testing
  'assert', 'assert_eq', 'assert_ne', 'assert_true', 'assert_false',
  'test_report',
  // DB
  'db_open', 'db_query', 'db_execute', 'db_close',
  'sqlite_open', 'sqlite_query', 'sqlite_execute', 'sqlite_close',
  // Throttle/debounce
  'throttle', 'debounce',
  // WS
  'ws_send', 'ws_close',
  // Crypto
  'hash_sha256', 'hash_md5', 'hmac_sha256',
  // Array helpers
  'range', 'zip', 'flatten',
  // CLI
  'cli_parse', 'cli_help', 'cli_print', 'cli_println', 'cli_err',
  // Native call
  'native_call',
  // DASH stdlib
  'dt_now', 'dt_format', 'dt_parse', 'dt_diff',
  'text_upper', 'text_lower', 'text_trim', 'text_split', 'text_join',
  'text_replace', 'text_contains', 'text_starts_with', 'text_ends_with',
  'text_pad_left', 'text_pad_right', 'text_repeat', 'text_reverse',
  'text_char_at', 'text_length', 'text_substring',
  'io_read', 'io_write', 'io_exists', 'io_delete', 'io_list', 'io_mkdir',
  'math_sin', 'math_cos', 'math_sqrt', 'math_pow', 'math_abs',
  'math_floor', 'math_ceil', 'math_round', 'math_random', 'math_pi',
  'col_sort', 'col_reverse', 'col_unique', 'col_flatten',
  'col_group_by', 'col_chunk', 'col_zip', 'col_range',
]);

// ── Binder Class ──

export class Binder {
  private errors: BindError[] = [];
  private warnings: BindError[] = [];
  private symbolCount = 0;
  private scopeCount = 0;
  private moduleScope!: Scope;

  /**
   * Bind a parsed module — build symbol table, validate references
   */
  bind(module: any): BindResult {
    this.errors = [];
    this.warnings = [];
    this.symbolCount = 0;
    this.scopeCount = 0;

    // Create module scope with builtins
    this.moduleScope = this.createScope('module', null);

    // Register built-in functions
    for (const name of BUILTIN_FUNCTIONS) {
      this.declareSymbol(this.moduleScope, name, 'builtin');
    }

    // Phase 1: Collect all top-level declarations (hoisting)
    if (module.statements) {
      for (const stmt of module.statements) {
        if (stmt?.type === 'function') {
          this.declareSymbol(this.moduleScope, stmt.name, 'function', stmt);
        }
      }
    }

    // Phase 2: Bind all statements (validate references)
    if (module.statements) {
      for (const stmt of module.statements) {
        this.bindNode(stmt, this.moduleScope);
      }
    }

    return {
      ok: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      symbolCount: this.symbolCount,
      scopeCount: this.scopeCount,
    };
  }

  // ── Scope Management ──

  private createScope(kind: Scope['kind'], parent: Scope | null, functionName?: string): Scope {
    this.scopeCount++;
    return {
      kind,
      parent,
      symbols: new Map(),
      functionName,
    };
  }

  private declareSymbol(scope: Scope, name: string, kind: SymbolKind, declNode?: any): void {
    if (!name) return;
    scope.symbols.set(name, { name, kind, declNode });
    this.symbolCount++;
  }

  private resolveSymbol(scope: Scope, name: string): BindSymbol | null {
    let current: Scope | null = scope;
    while (current) {
      const sym = current.symbols.get(name);
      if (sym) return sym;
      current = current.parent;
    }
    return null;
  }

  // ── Error Reporting ──

  private addError(name: string, message: string, node?: any): void {
    this.errors.push({
      name,
      message,
      line: node?.line || node?.loc?.line,
      column: node?.column || node?.loc?.column,
    });
  }

  private addWarning(name: string, message: string, node?: any): void {
    this.warnings.push({
      name,
      message,
      line: node?.line,
      column: node?.column,
    });
  }

  // ── Node Binding (recursive AST walk) ──

  private bindNode(node: any, scope: Scope): void {
    if (!node || typeof node !== 'object') return;

    const type = node.type;
    if (!type) return;

    switch (type) {
      // ── Declarations ──
      case 'function': {
        // Function already declared in Phase 1 (hoisting)
        const fnScope = this.createScope('function', scope, node.name);
        // Register parameters
        if (node.params) {
          for (const param of node.params) {
            const paramName = typeof param === 'string' ? param : param?.name;
            if (paramName) {
              this.declareSymbol(fnScope, paramName, 'parameter', param);
            }
          }
        }
        // Bind function body
        if (node.body) {
          this.bindBlock(node.body, fnScope);
        }
        break;
      }

      case 'variable': {
        // Bind initializer first (before declaring variable)
        if (node.value) {
          this.bindNode(node.value, scope);
        }
        // Declare variable in current scope
        this.declareSymbol(scope, node.name, 'variable', node);
        break;
      }

      // ── Statements ──
      case 'if':
      case 'IfStatement': {
        this.bindNode(node.condition, scope);
        if (node.consequent) this.bindBlock(node.consequent, scope);
        if (node.alternate) this.bindNode(node.alternate, scope);
        break;
      }

      case 'while':
      case 'WhileStatement': {
        this.bindNode(node.condition, scope);
        if (node.body) this.bindBlock(node.body, scope);
        break;
      }

      case 'for':
      case 'ForStatement':
      case 'forOf':
      case 'ForOfStatement': {
        const forScope = this.createScope('block', scope);
        // Loop variable
        if (node.variable) {
          this.declareSymbol(forScope, node.variable, 'variable', node);
        }
        if (node.init) this.bindNode(node.init, forScope);
        if (node.iterable) this.bindNode(node.iterable, scope);  // iterable in outer scope
        if (node.condition) this.bindNode(node.condition, forScope);
        if (node.update) this.bindNode(node.update, forScope);
        if (node.body) this.bindBlock(node.body, forScope);
        break;
      }

      case 'return':
      case 'ReturnStatement': {
        if (node.value) this.bindNode(node.value, scope);
        if (node.argument) this.bindNode(node.argument, scope);
        break;
      }

      case 'break':
      case 'continue':
        break;  // No symbols to bind

      case 'throw':
      case 'ThrowStatement': {
        if (node.argument) this.bindNode(node.argument, scope);
        break;
      }

      case 'try':
      case 'TryStatement': {
        if (node.block) this.bindBlock(node.block, scope);
        if (node.handler) {
          const catchScope = this.createScope('block', scope);
          if (node.handler.param) {
            this.declareSymbol(catchScope, node.handler.param, 'variable');
          }
          if (node.handler.body) this.bindBlock(node.handler.body, catchScope);
        }
        if (node.finalizer) this.bindBlock(node.finalizer, scope);
        break;
      }

      // ── Expressions ──
      case 'identifier':
      case 'Identifier': {
        const name = node.name || node.value;
        if (name && !this.resolveSymbol(scope, name)) {
          this.addError(name, `Undefined variable: '${name}'`, node);
        }
        break;
      }

      case 'assignment': {
        this.bindNode(node.value, scope);
        // Target might be identifier, member, or index
        if (node.target?.type === 'identifier' || node.target?.type === 'Identifier') {
          const name = node.target.name || node.target.value;
          if (name && !this.resolveSymbol(scope, name)) {
            this.addError(name, `Undefined variable: '${name}'`, node.target);
          }
        } else {
          this.bindNode(node.target, scope);
        }
        break;
      }

      case 'binary':
      case 'BinaryOp': {
        this.bindNode(node.left, scope);
        this.bindNode(node.right, scope);
        break;
      }

      case 'unary':
      case 'UnaryOp': {
        this.bindNode(node.operand || node.argument || node.expr, scope);
        break;
      }

      case 'call':
      case 'CallExpression': {
        const calleeName = node.callee?.name || node.name;
        // Check function existence (but allow dynamic calls)
        if (calleeName && typeof calleeName === 'string') {
          if (!this.resolveSymbol(scope, calleeName)) {
            this.addWarning(calleeName, `Possibly undefined function: '${calleeName}'`, node);
          }
        }
        // Bind arguments
        const args = node.arguments || node.args;
        if (args) {
          for (const arg of args) {
            this.bindNode(arg, scope);
          }
        }
        // Bind callee (for method calls)
        if (node.callee && node.callee.type !== 'identifier') {
          this.bindNode(node.callee, scope);
        }
        break;
      }

      case 'member':
      case 'MemberExpression': {
        this.bindNode(node.object || node.obj, scope);
        // Don't validate property names (dynamic)
        break;
      }

      case 'index':
      case 'IndexAccess': {
        this.bindNode(node.object || node.obj || node.array, scope);
        this.bindNode(node.index || node.idx || node.property, scope);
        break;
      }

      case 'array':
      case 'ArrayLiteral': {
        const elems = node.elements || node.elems;
        if (elems) {
          for (const elem of elems) {
            this.bindNode(elem, scope);
          }
        }
        break;
      }

      case 'object':
      case 'ObjectLiteral': {
        const props = node.properties || node.props;
        if (props) {
          for (const prop of props) {
            this.bindNode(prop.value || prop.val, scope);
          }
        }
        break;
      }

      case 'lambda': {
        const lambdaScope = this.createScope('function', scope);
        if (node.params) {
          for (const param of node.params) {
            const pName = typeof param === 'string' ? param : param?.name;
            if (pName) this.declareSymbol(lambdaScope, pName, 'parameter');
          }
        }
        this.bindNode(node.body, lambdaScope);
        break;
      }

      case 'ternary':
      case 'ConditionalExpression': {
        this.bindNode(node.condition || node.test, scope);
        this.bindNode(node.consequent, scope);
        this.bindNode(node.alternate, scope);
        break;
      }

      case 'literal':
      case 'NumberLiteral':
      case 'StringLiteral':
      case 'BoolLiteral':
      case 'number':
      case 'string':
      case 'boolean':
      case 'null':
        break;  // No symbols to bind

      case 'expression': {
        this.bindNode(node.expression, scope);
        break;
      }

      case 'match':
      case 'MatchExpression': {
        this.bindNode(node.subject || node.expression, scope);
        if (node.arms || node.cases) {
          for (const arm of (node.arms || node.cases)) {
            // Pattern may introduce bindings
            if (arm.body) this.bindNode(arm.body, scope);
            if (arm.expression) this.bindNode(arm.expression, scope);
          }
        }
        break;
      }

      // ── Module-level ──
      case 'import':
      case 'ImportStatement': {
        // Register imported symbols
        if (node.specifiers) {
          for (const spec of node.specifiers) {
            const importName = spec.local || spec.imported || spec.name;
            if (importName) {
              this.declareSymbol(scope, importName, 'variable', spec);
            }
          }
        }
        break;
      }

      case 'export':
      case 'ExportStatement': {
        if (node.declaration) this.bindNode(node.declaration, scope);
        break;
      }

      case 'struct':
      case 'StructDeclaration': {
        // Declare struct as a variable (constructor)
        if (node.name) {
          this.declareSymbol(scope, node.name, 'variable', node);
        }
        break;
      }

      case 'enum':
      case 'EnumDeclaration': {
        if (node.name) {
          this.declareSymbol(scope, node.name, 'variable', node);
        }
        break;
      }

      // ── Block wrapper ──
      case 'block':
      case 'Block':
      case 'BlockStatement': {
        this.bindBlock(node, scope);
        break;
      }

      default: {
        // Walk all properties for unknown node types
        this.walkUnknown(node, scope);
        break;
      }
    }
  }

  private bindBlock(block: any, parentScope: Scope): void {
    if (!block) return;
    const blockScope = this.createScope('block', parentScope);
    const stmts = block.statements || block.body || block.stmts;
    if (Array.isArray(stmts)) {
      for (const stmt of stmts) {
        this.bindNode(stmt, blockScope);
      }
    } else if (block.type && block.type !== 'block' && block.type !== 'Block') {
      // Single statement (not a block)
      this.bindNode(block, parentScope);
    }
  }

  private walkUnknown(node: any, scope: Scope): void {
    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'loc' || key === 'line' || key === 'column') continue;
      const val = node[key];
      if (Array.isArray(val)) {
        for (const item of val) {
          if (item && typeof item === 'object' && item.type) {
            this.bindNode(item, scope);
          }
        }
      } else if (val && typeof val === 'object' && val.type) {
        this.bindNode(val, scope);
      }
    }
  }
}
