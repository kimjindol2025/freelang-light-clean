# Design Directives Troubleshooting Guide

Solutions to common issues when working with FreeLang design directives.

## Table of Contents

1. [Parsing Issues](#parsing-issues)
2. [Compilation Issues](#compilation-issues)
3. [Output Quality Issues](#output-quality-issues)
4. [Performance Issues](#performance-issues)
5. [CLI Issues](#cli-issues)
6. [Common Mistakes](#common-mistakes)

---

## Parsing Issues

### Design Directive Not Recognized

**Symptom**: Design block appears in statements instead of designBlocks

**Causes**:
- Missing `@` symbol
- Misspelled directive name
- Syntax errors in block content

**Solutions**:

```freelang
// ❌ WRONG - Missing @ symbol
animation fadeIn {
  duration: 300
}

// ✅ CORRECT
@animation fadeIn {
  duration: 300
}
```

**Check spelling**:
```
✓ @animation    ✓ @glass    ✓ @3d
✓ @micro        ✓ @scroll

❌ @animate    ❌ @glassmorphism    ❌ @3dTransform
```

### Empty Design Block Error

**Symptom**: Parser error with empty design blocks

**Causes**:
- No content between braces
- Only whitespace inside block

**Solutions**:

```freelang
// ❌ WRONG - Empty block
@animation fadeIn {
}

// ✅ CORRECT - At least one property
@animation fadeIn {
  duration: 300
}
```

### Nested Brace Errors

**Symptom**: Parsing stops unexpectedly with nested content

**Causes**:
- Unbalanced braces in block content
- Missing closing braces

**Solutions**:

```freelang
// ❌ WRONG - Unbalanced braces
@animation complex {
  duration: 300
  keyframes: {
    0%: { opacity: 0
    100%: { opacity: 1 }
  }
}

// ✅ CORRECT - Properly balanced
@animation complex {
  duration: 300
  keyframes: {
    0%: { opacity: 0 }
    100%: { opacity: 1 }
  }
}
```

---

## Compilation Issues

### No CSS/JS Generated

**Symptom**: Artifact files are empty or missing

**Debug Steps**:

1. **Verify design blocks exist**:
   ```bash
   grep -n "@animation\|@glass\|@3d\|@micro\|@scroll" component.free
   ```

2. **Check verbose output**:
   ```bash
   freelang build component.free --designs -v
   ```

3. **Verify output directory**:
   ```bash
   ls -la ./design-artifacts/
   ```

4. **Check file permissions**:
   ```bash
   chmod 755 ./design-artifacts/
   ```

### Invalid Generated CSS

**Symptom**: CSS contains syntax errors or invalid properties

**Causes**:
- Incorrect property syntax in design block
- Invalid values
- CSS engine limitations

**Solutions**:

```freelang
// ❌ WRONG - Invalid CSS property
@glass {
  background-color: rgba(255, 255, 255, 0.1)  // ❌ Wrong syntax
  backdropFilter: blur(10px)
}

// ✅ CORRECT
@glass {
  background: rgba(255, 255, 255, 0.1)
  backdropFilter: blur(10px)
}
```

**Validate generated CSS**:
```bash
npx postcss ./design-artifacts/*.design.css --no-map > /dev/null
echo "CSS is valid"
```

### Invalid Generated JavaScript

**Symptom**: JavaScript has syntax errors

**Solutions**:

1. **Validate with Node.js**:
   ```bash
   node -c ./design-artifacts/*.design.js
   ```

2. **Check for syntax errors**:
   ```bash
   npx eslint ./design-artifacts/*.design.js
   ```

3. **Test in browser console**:
   ```javascript
   // Check for errors when loaded
   console.log('Scripts loaded successfully');
   ```

---

## Output Quality Issues

### CSS Not Applying to Elements

**Symptom**: Generated CSS doesn't affect page elements

**Causes**:
- Incorrect CSS selectors
- Specificity issues
- CSS not imported in HTML

**Solutions**:

1. **Ensure CSS is imported**:
   ```html
   <link rel="stylesheet" href="./component.design.css">
   ```

2. **Check selector specificity**:
   ```bash
   # View generated selectors
   grep -o '\.[a-zA-Z0-9_-]*' ./component.design.css | sort | uniq
   ```

3. **Verify element has correct class**:
   ```html
   <div class="animated-button">Click me</div>
   ```

### Animation Not Running

**Symptom**: CSS animation is defined but doesn't run

**Causes**:
- Element not visible
- Animation not triggered
- Duration set to 0
- Wrong easing function

**Solutions**:

```freelang
// ❌ WRONG - No duration specified
@animation fadeIn {
  opacity: 0 → 1
}

// ✅ CORRECT - Duration required
@animation fadeIn {
  duration: 300
  opacity: 0 → 1
}
```

**Test animation**:
```html
<div class="fade-in" style="animation: fadeIn 0.3s ease-out;">
  This should fade in
</div>
```

### Glass Effect Not Visible

**Symptom**: Glassmorphism block compiles but effect isn't visible

**Causes**:
- Missing `backdropFilter` property
- Browser doesn't support backdrop filter
- Background not transparent enough
- Element not positioned correctly

**Solutions**:

```freelang
// ❌ WRONG - Missing backdropFilter
@glass {
  background: rgba(255, 255, 255, 0.1)
}

// ✅ CORRECT - Both required
@glass {
  background: rgba(255, 255, 255, 0.1)
  backdropFilter: blur(10px)
}
```

**Check browser support**:
```javascript
// Feature detection
const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
console.log('Backdrop filter supported:', supportsBackdropFilter);
```

### 3D Transform Not Working

**Symptom**: 3D transformations don't appear in 3D space

**Causes**:
- Missing perspective
- Browser doesn't support 3D transforms
- Transform origin not set
- Animation not triggered

**Solutions**:

```freelang
// ❌ WRONG - No perspective
@3d {
  rotateX: 45deg
}

// ✅ CORRECT - Perspective required
@3d {
  perspective: 1000px
  rotateX: 45deg
}
```

---

## Performance Issues

### Slow Compilation

**Symptoms**:
- Compilation takes >1000ms for single component
- CPU usage high during build

**Solutions**:

1. **Enable caching**:
   ```bash
   # Caching is enabled by default
   freelang build component.free --designs
   ```

2. **Profile compilation**:
   ```bash
   time freelang build component.free --designs -v
   ```

3. **Check for large files**:
   ```bash
   wc -l src/components/*.free | sort -n
   ```

### Large Output Files

**Symptoms**:
- Generated CSS > 100KB
- Generated JS > 100KB

**Solutions**:

1. **Enable minification** (when available):
   ```javascript
   const compiler = new ParallelDesignCompiler();
   const result = await compiler.compileMultiple(blocks, { minify: true });
   ```

2. **Compress artifacts**:
   ```bash
   gzip -9 ./design-artifacts/*.design.css
   gzip -9 ./design-artifacts/*.design.js
   ```

3. **Check for redundant blocks**:
   ```bash
   grep -n "@animation\|@glass" component.free | head -20
   ```

---

## CLI Issues

### Command Not Found

**Symptom**: `freelang: command not found`

**Solutions**:

1. **Check installation**:
   ```bash
   npm list -g freelang
   ```

2. **Reinstall**:
   ```bash
   npm install -g freelang
   ```

3. **Check PATH**:
   ```bash
   echo $PATH
   ```

### Wrong Output Directory

**Symptom**: Artifacts not in expected location

**Solutions**:

```bash
# Default: ./design-artifacts/
freelang build component.free --designs

# Custom path
freelang build component.free --designs --design-output ./dist/styles

# Absolute path
freelang build component.free --designs --design-output /absolute/path/to/artifacts
```

### Permission Denied

**Symptom**: Cannot write to output directory

**Solutions**:

```bash
# Check permissions
ls -la design-artifacts/

# Fix permissions
chmod 755 design-artifacts/
chmod 644 design-artifacts/*.design.css
chmod 644 design-artifacts/*.design.js
```

---

## Common Mistakes

### Mistake 1: Using Arrow in Property Values

❌ **WRONG**:
```freelang
@animation fadeIn {
  duration: 300
  values: 0 → 1 → 0.5 → 1
}
```

✅ **CORRECT**:
```freelang
@animation fadeIn {
  duration: 300
  opacity: 0 → 1
}
```

**Explanation**: Arrow syntax (`→`) is for animation interpolation, not for listing multiple values.

### Mistake 2: Forgetting to Escape CSS Values

❌ **WRONG**:
```freelang
@glass {
  background: rgba(255,255,255,0.1)
  backdropFilter: blur(10px)
}
```

✅ **CORRECT** (same, but shown for reference):
```freelang
@glass {
  background: rgba(255, 255, 255, 0.1)
  backdropFilter: blur(10px)
}
```

**Explanation**: Use standard CSS syntax with proper spacing.

### Mistake 3: Multiple Root-Level Design Blocks

❌ **WRONG**:
```freelang
@animation fade1 { duration: 300; opacity: 0 → 1; }
@animation fade2 { duration: 300; opacity: 0 → 1; }  // Outside component
```

✅ **CORRECT**:
```freelang
component MyComponent {
  @animation fade1 {
    duration: 300
    opacity: 0 → 1
  }

  @animation fade2 {
    duration: 300
    opacity: 0 → 1
  }
}
```

### Mistake 4: Not Importing Artifacts

❌ **WRONG**:
```html
<html>
  <body>
    <!-- Design artifacts not imported -->
    <div class="animated">Animation won't work</div>
  </body>
</html>
```

✅ **CORRECT**:
```html
<html>
  <head>
    <link rel="stylesheet" href="./component.design.css">
  </head>
  <body>
    <div class="animated">Animation will work!</div>
    <script src="./component.design.js"></script>
  </body>
</html>
```

---

## Getting Help

### Debug Information

When reporting issues, collect this information:

```bash
# FreeLang version
freelang version

# Component file
cat component.free

# Verbose compilation output
freelang build component.free --designs -v

# Generated artifacts
ls -la ./design-artifacts/
head -20 ./design-artifacts/*.design.css
head -20 ./design-artifacts/*.design.js

# System information
node --version
npm --version
uname -a
```

### Common Debug Commands

```bash
# Validate FreeLang syntax
freelang build component.free --designs -v

# Check generated CSS validity
npx stylelint ./design-artifacts/*.design.css

# Check generated JS validity
npx eslint ./design-artifacts/*.design.js

# Measure compilation time
time freelang build component.free --designs

# Check file sizes
du -h ./design-artifacts/

# Monitor for changes (using watchman)
watchman-make -p 'src/**/*.free' --run 'freelang build {0} --designs'
```

---

**Last Updated**: 2026-03-14 (Phase 10.7)
**Status**: Complete Troubleshooting Guide
