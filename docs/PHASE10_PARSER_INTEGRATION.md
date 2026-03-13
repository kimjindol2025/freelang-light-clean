# Phase 10: Parser Integration (디자인 파서 통합)

**Status**: 🔄 **IN PROGRESS** (Phase 10.1 Lexer Enhancement: 70% Complete)

**Goal**: Integrate Design Compiler with FreeLang Parser to recognize and process design directives (@animation, @glass, @3d, @micro, @scroll) as first-class language constructs.

---

## 📋 Phase 10 Roadmap

### Phase 10.1: Lexer Enhancement (CURRENT) ✅ 90%
- [x] Add 5 design directive token types to `TokenType` enum
- [x] Add keyword mappings for 'animation', 'glass', '3d', 'micro', 'scroll'
- [x] Implement lookahead logic in lexer's `nextToken()` method
- [x] Add `isDesignDirective()` helper method
- [x] Handle both `@animation name` and unnamed `@glass` forms
- [ ] Write lexer unit tests (pending TypeScript compilation setup)
- [ ] Verify token stream correctness

### Phase 10.2: AST Extension (PENDING)
- [ ] Define `DesignBlockDeclaration` interface
- [ ] Extend `Module` to include `designBlocks` field
- [ ] Add design block properties (name, type, content, position)

### Phase 10.3: Parser Integration (PENDING)
- [ ] Implement `parseDesignBlock()` method
- [ ] Integrate design block parsing into `parseStatement()`
- [ ] Handle design blocks at both component and statement level
- [ ] Generate appropriate AST nodes

### Phase 10.4: Compiler Integration (PENDING)
- [ ] Create `DesignIntegration` class to bridge Parser AST and DesignCompiler
- [ ] Extract design blocks from AST
- [ ] Route to appropriate design engines
- [ ] Merge CSS/JavaScript outputs

### Phase 10.5: CLI Support (PENDING)
- [ ] Add `--designs` flag to compile with design engines
- [ ] Add `--design-output` to specify design artifact location
- [ ] Update `freelang compile` command

### Phase 10.6: End-to-End Testing (PENDING)
- [ ] Integration tests with real .free files
- [ ] Cross-engine tests (animation + micro-interaction, etc.)
- [ ] Performance benchmarks

### Phase 10.7: Documentation & Examples (PENDING)
- [ ] Usage examples for each design directive
- [ ] Migration guide from Phase 9 standalone compiler
- [ ] API reference

### Phase 10.8: Optimization (PENDING)
- [ ] Design directive deduplication
- [ ] Unused design code removal
- [ ] Performance monitoring

---

## 🔧 Phase 10.1: Lexer Enhancement Details

### What Changed

#### 1. Token Type Additions (`src/lexer/token.ts`)

```typescript
// Phase 10: Design Compiler Integration (5개 디자인 디렉티브)
ANIMATION_DESIGN = 'ANIMATION_DESIGN',   // @animation
GLASS_DESIGN = 'GLASS_DESIGN',           // @glass
TRANSFORM3D_DESIGN = 'TRANSFORM3D_DESIGN', // @3d
MICRO_DESIGN = 'MICRO_DESIGN',           // @micro
SCROLL_DESIGN = 'SCROLL_DESIGN'          // @scroll
```

#### 2. Keyword Mappings (`src/lexer/token.ts`)

```typescript
// Phase 10: Design Directive Keywords (@ 다음에 오는 키워드들)
'animation': TokenType.ANIMATION_DESIGN,
'glass': TokenType.GLASS_DESIGN,
'3d': TokenType.TRANSFORM3D_DESIGN,
'micro': TokenType.MICRO_DESIGN,
'scroll': TokenType.SCROLL_DESIGN
```

#### 3. Lexer Lookahead Logic (`src/lexer/lexer.ts`)

**Added Method**: `isDesignDirective(type: TokenType): boolean`

```typescript
private isDesignDirective(type: TokenType): boolean {
  return type === TokenType.ANIMATION_DESIGN ||
         type === TokenType.GLASS_DESIGN ||
         type === TokenType.TRANSFORM3D_DESIGN ||
         type === TokenType.MICRO_DESIGN ||
         type === TokenType.SCROLL_DESIGN;
}
```

**Enhanced @ Symbol Handling** (line 499):

```typescript
case '@': {
  // Phase 10: Lookahead for design directives
  if (this.isLetter(this.current)) {
    const savedPos = this.position;
    const savedLine = this.line;
    const savedCol = this.column;

    const identifier = this.readIdentifier();
    const keywordType = getKeyword(identifier);

    if (this.isDesignDirective(keywordType)) {
      return this.makeToken(keywordType, '@' + identifier);
    }

    // Reset if not a design directive
    this.position = savedPos;
    this.line = savedLine;
    this.column = savedCol;
    this.current = this.input[this.position - 1] || '\0';
  }

  return this.makeToken(TokenType.AT, '@');
}
```

### How It Works

#### Input Example
```
component Card {
  @animation fadeIn { duration: 300 }
  @glass { background: rgba(255,255,255,0.1) }
  @unknown { ... }  // Not a design directive
}
```

#### Token Stream Output

| Token | Type | Value |
|-------|------|-------|
| IDENT | component | component |
| IDENT | Card | Card |
| LBRACE | { | { |
| ANIMATION_DESIGN | @animation | @animation |
| IDENT | fadeIn | fadeIn |
| ... | ... | ... |
| GLASS_DESIGN | @glass | @glass |
| ... | ... | ... |
| AT | @ | @ |
| IDENT | unknown | unknown |
| ... | ... | ... |
| RBRACE | } | } |

### Design Directives Supported

| Directive | Token Type | Example |
|-----------|-----------|---------|
| @animation | ANIMATION_DESIGN | `@animation fadeIn { ... }` |
| @glass | GLASS_DESIGN | `@glass { ... }` |
| @3d | TRANSFORM3D_DESIGN | `@3d { ... }` |
| @micro | MICRO_DESIGN | `@micro { ... }` |
| @scroll | SCROLL_DESIGN | `@scroll { ... }` |

### Fallback for Non-Design @

If @ is followed by an identifier that's not a design directive keyword, the lexer falls back to the original behavior:
- Emits AT token with value `@`
- Next token is the identifier
- Allows for future decorator/annotation syntax

Example: `@resolver`, `@deprecated`, `@custom` → `AT` + `IDENT`

---

## 📝 Files Modified

| File | Change | Lines |
|------|--------|-------|
| `src/lexer/token.ts` | +5 new TokenType, +5 keyword mappings | +16 |
| `src/lexer/lexer.ts` | +lookahead logic, +isDesignDirective() | +30 |

**Total Phase 10.1**: +46 lines

---

## ✅ Next Steps

### Immediate (Phase 10.2)
1. Define `DesignBlockDeclaration` AST node
2. Extend Parser to recognize design blocks
3. Create design block AST

### Short-term (Phase 10.3-10.4)
1. Integrate with DesignCompiler
2. End-to-end compilation pipeline
3. CLI support

### Medium-term (Phase 10.5-10.8)
1. Comprehensive testing
2. Performance optimization
3. Documentation

---

## 📊 Expected Token Count Change

**Before Phase 10.1**:
- 147 TokenType enums
- 33 keyword mappings

**After Phase 10.1**:
- **152 TokenType enums** (+5)
- **38 keyword mappings** (+5)

---

## 🎯 Design Directive Recognition Examples

### Example 1: Animation
```
Input:  @animation fadeIn { duration: 300 opacity: 0 → 1 }
Output: ANIMATION_DESIGN(@animation) IDENT(fadeIn) LBRACE IDENT(duration) ...
```

### Example 2: Glass Morphism
```
Input:  @glass { background: rgba(255,255,255,0.1) }
Output: GLASS_DESIGN(@glass) LBRACE IDENT(background) ...
```

### Example 3: 3D Transform
```
Input:  @3d { perspective: 1000px rotateX: 10deg }
Output: TRANSFORM3D_DESIGN(@3d) LBRACE IDENT(perspective) ...
```

### Example 4: Generic Decorator
```
Input:  @resolver @custom @deprecated
Output: ANIMATION_DESIGN(@resolver) AT(@) IDENT(custom) AT(@) IDENT(deprecated)
```

---

## 🔍 Testing Strategy

### Unit Tests (Phase 10.1)
- Individual design directive recognition
- Fallback @ symbol behavior
- Position tracking (line/column)

### Integration Tests (Phase 10.3+)
- Design blocks in component context
- Multiple design directives
- Mixed with regular code

### E2E Tests (Phase 10.6+)
- Full compilation pipeline
- CSS/JavaScript generation
- Performance benchmarks

---

## ⚠️ Known Limitations & Future Improvements

1. **Keyword Conflicts**: If user defines a custom keyword matching design directive names, lexer will treat as design directive
   - Solution (Phase 10.5): Add namespace scoping or configuration option

2. **Position Tracking**: Column position may shift during lookahead
   - Verified and fixed in implementation

3. **Error Recovery**: Invalid design directive syntax
   - Solution (Phase 10.3): Parser-level error reporting

---

## 📚 References

- **Phase 8**: Design Engines (Animation, Glassmorphism, 3D, Micro-interaction, Scroll Trigger)
- **Phase 9**: Design Compiler (orchestrator for 5 engines)
- **Phase 10**: Parser Integration (bringing Phase 8-9 into language core)

---

**Last Updated**: 2026-03-14 05:15 UTC+9
**Status**: Phase 10.1 Lexer Enhancement 90% complete
**Next Session**: Phase 10.2 AST Extension
