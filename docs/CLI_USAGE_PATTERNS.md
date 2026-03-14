# FreeLang CLI Usage Patterns

Practical patterns and best practices for compiling design directives with FreeLang CLI.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Project Workflows](#project-workflows)
3. [Batch Processing](#batch-processing)
4. [CI/CD Integration](#cicd-integration)
5. [Development Tips](#development-tips)

---

## Basic Usage

### Compile Single Component

```bash
freelang build my-component.free --designs
```

**Output**:
```
[design] ✅ Successfully compiled 2 design blocks
  CSS:  ./design-artifacts/my-component.design.css (1,234 bytes)
  JS:   ./design-artifacts/my-component.design.js (956 bytes)
  Time: 28ms
```

### Custom Output Directory

```bash
freelang build my-component.free --designs --design-output ./dist/design
```

### Verbose Output

```bash
freelang build my-component.free --designs -v
```

Shows detailed statistics and compilation process.

---

## Project Workflows

### Pattern 1: Single Output Directory

Structure your project to collect all design artifacts in one place:

```
project/
├─ src/
│  ├─ components/
│  │  ├─ Button.free
│  │  ├─ Card.free
│  │  └─ Header.free
│  └─ ...
├─ design-artifacts/
│  ├─ Button.design.css
│  ├─ Button.design.js
│  ├─ Card.design.css
│  ├─ Card.design.js
│  ├─ Header.design.css
│  └─ Header.design.js
└─ freelang.config.json
```

**Build commands**:
```bash
# Compile individual components
freelang build src/components/Button.free --designs --design-output ./design-artifacts
freelang build src/components/Card.free --designs --design-output ./design-artifacts
freelang build src/components/Header.free --designs --design-output ./design-artifacts
```

### Pattern 2: Component-Scoped Artifacts

Keep design artifacts alongside components:

```
project/
├─ src/
│  ├─ components/
│  │  ├─ Button/
│  │  │  ├─ Button.free
│  │  │  ├─ Button.design.css
│  │  │  └─ Button.design.js
│  │  ├─ Card/
│  │  │  ├─ Card.free
│  │  │  ├─ Card.design.css
│  │  │  └─ Card.design.js
│  │  └─ Header/
│  │     ├─ Header.free
│  │     ├─ Header.design.css
│  │     └─ Header.design.js
└─ ...
```

**Build commands**:
```bash
freelang build src/components/Button/Button.free --designs --design-output ./src/components/Button
freelang build src/components/Card/Card.free --designs --design-output ./src/components/Card
```

### Pattern 3: Separate Build Step

Use a build script to compile all components:

**build-designs.sh**:
```bash
#!/bin/bash

# Compile all design directives
freelang build src/components/Button.free --designs --design-output ./dist/design -v
freelang build src/components/Card.free --designs --design-output ./dist/design -v
freelang build src/components/Modal.free --designs --design-output ./dist/design -v

echo "✅ All design artifacts compiled"
```

**package.json**:
```json
{
  "scripts": {
    "build:designs": "bash build-designs.sh",
    "build": "npm run build:designs && npm run build:app"
  }
}
```

---

## Batch Processing

### Compile All .free Files in Directory

```bash
#!/bin/bash

SOURCE_DIR="src/components"
OUTPUT_DIR="dist/design-artifacts"

for file in "$SOURCE_DIR"/*.free; do
  echo "Compiling $(basename "$file")..."
  freelang build "$file" --designs --design-output "$OUTPUT_DIR" -v
done

echo "✅ Batch compilation complete"
```

### Conditional Compilation

Only compile components with design directives:

```bash
#!/bin/bash

SOURCE_DIR="src/components"
OUTPUT_DIR="dist/design-artifacts"

for file in "$SOURCE_DIR"/*.free; do
  # Check if file contains design directives
  if grep -q "@animation\|@glass\|@3d\|@micro\|@scroll" "$file"; then
    echo "Compiling $(basename "$file")..."
    freelang build "$file" --designs --design-output "$OUTPUT_DIR"
  fi
done
```

### Parallel Compilation

Compile multiple files in parallel (xargs):

```bash
#!/bin/bash

SOURCE_DIR="src/components"
OUTPUT_DIR="dist/design-artifacts"

find "$SOURCE_DIR" -name "*.free" | xargs -P 4 -I {} \
  freelang build {} --designs --design-output "$OUTPUT_DIR"
```

Compiles up to 4 files simultaneously.

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Compile Design Directives

on:
  push:
    paths:
      - 'src/components/**/*.free'
  pull_request:
    paths:
      - 'src/components/**/*.free'

jobs:
  compile-designs:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Install FreeLang
        run: npm install -g freelang

      - name: Compile designs
        run: |
          mkdir -p dist/design-artifacts
          for file in src/components/*.free; do
            freelang build "$file" --designs --design-output ./dist/design-artifacts -v
          done

      - name: Verify artifacts
        run: |
          if [ -z "$(ls -A dist/design-artifacts)" ]; then
            echo "No design artifacts generated!"
            exit 1
          fi

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: design-artifacts
          path: dist/design-artifacts
```

### GitLab CI/CD Pipeline

```yaml
stages:
  - build

compile_designs:
  stage: build
  script:
    - mkdir -p dist/design-artifacts
    - for file in src/components/*.free; do
        freelang build "$file" --designs --design-output ./dist/design-artifacts -v;
      done
  artifacts:
    paths:
      - dist/design-artifacts/
    expire_in: 1 week
  only:
    changes:
      - 'src/components/**/*.free'
```

### Jenkins Pipeline

```groovy
pipeline {
  agent any

  stages {
    stage('Compile Designs') {
      steps {
        sh '''
          mkdir -p dist/design-artifacts
          for file in src/components/*.free; do
            freelang build "$file" --designs --design-output ./dist/design-artifacts -v
          done
        '''
      }
    }

    stage('Verify Artifacts') {
      steps {
        sh '''
          if [ -z "$(ls -A dist/design-artifacts)" ]; then
            echo "No design artifacts generated!"
            exit 1
          fi
        '''
      }
    }

    stage('Archive') {
      steps {
        archiveArtifacts artifacts: 'dist/design-artifacts/**',
                         fingerprint: true
      }
    }
  }
}
```

---

## Development Tips

### Watch Mode (Recommended)

While working on design directives, use a file watcher:

```bash
#!/bin/bash

# Install watchman or fswatch
# brew install watchman  # macOS
# apt-get install fswatch  # Linux

SOURCE_DIR="src/components"
OUTPUT_DIR="dist/design-artifacts"

fswatch -r "$SOURCE_DIR" *.free | xargs -I {} \
  freelang build {} --designs --design-output "$OUTPUT_DIR" -v
```

### VS Code Task

Create a VS Code task for quick compilation:

**.vscode/tasks.json**:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Compile Design Directive",
      "type": "shell",
      "command": "freelang",
      "args": [
        "build",
        "${file}",
        "--designs",
        "--design-output",
        "./dist/design-artifacts",
        "-v"
      ],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    }
  ]
}
```

**Usage**: Press `Ctrl+Shift+B` to compile current file.

### NPM Scripts

```json
{
  "scripts": {
    "design:compile": "freelang build src/components/index.free --designs --design-output ./dist/design -v",
    "design:watch": "nodemon -w src/components -e free --exec 'npm run design:compile'",
    "design:verify": "test -d ./dist/design && echo '✅ Design artifacts exist'",
    "build": "npm run design:compile && npm run build:app"
  }
}
```

### Debug Mode

Check if design directives are being parsed correctly:

```bash
# Verbose output shows parsing details
freelang build component.free --designs -v

# Check output file sizes to ensure CSS/JS were generated
ls -lh dist/design-artifacts/
```

### Validate Output

Check generated artifacts:

```bash
#!/bin/bash

CSS_FILE="$1.design.css"
JS_FILE="$1.design.js"

# Check if files exist
[ -f "$CSS_FILE" ] && echo "✅ CSS generated ($(wc -c < "$CSS_FILE") bytes)"
[ -f "$JS_FILE" ] && echo "✅ JS generated ($(wc -c < "$JS_FILE") bytes)"

# Quick syntax check
npx postcss "$CSS_FILE" --no-map > /dev/null && echo "✅ CSS valid"
node -c "$JS_FILE" > /dev/null && echo "✅ JS valid"
```

---

## Performance Optimization

### Incremental Compilation

Only recompile changed files:

```bash
#!/bin/bash

SOURCE_DIR="src/components"
OUTPUT_DIR="dist/design-artifacts"
TIMESTAMP_FILE=".last-compile"

# Get files modified since last compile
find "$SOURCE_DIR" -name "*.free" -newer "$TIMESTAMP_FILE" | while read file; do
  echo "Compiling $(basename "$file")..."
  freelang build "$file" --designs --design-output "$OUTPUT_DIR"
done

# Update timestamp
touch "$TIMESTAMP_FILE"
```

### Cache Design Artifacts

Store compiled artifacts in a cache directory:

```bash
# Cache key: file hash + content
CACHE_DIR=".design-cache"
FILE_HASH=$(md5sum component.free | cut -d' ' -f1)
CACHE_FILE="$CACHE_DIR/$FILE_HASH.tar.gz"

if [ -f "$CACHE_FILE" ]; then
  echo "Using cached artifacts..."
  tar -xzf "$CACHE_FILE"
else
  echo "Compiling new artifacts..."
  freelang build component.free --designs --design-output ./dist
  tar -czf "$CACHE_FILE" dist/
fi
```

---

## Troubleshooting

### No Artifacts Generated

1. Verify design directives exist:
   ```bash
   grep -n "@animation\|@glass\|@3d\|@micro\|@scroll" component.free
   ```

2. Check compilation with verbose flag:
   ```bash
   freelang build component.free --designs -v
   ```

3. Verify syntax of design blocks

### Output Directory Issues

1. Ensure directory exists or use `--design-output`:
   ```bash
   mkdir -p ./dist/design-artifacts
   freelang build component.free --designs --design-output ./dist/design-artifacts
   ```

2. Check file permissions:
   ```bash
   ls -la dist/design-artifacts/
   ```

### Invalid CSS/JS Generated

1. Validate the component file syntax
2. Check design directive properties are correct
3. Review generated artifacts manually

---

**Last Updated**: 2026-03-14 (Phase 10.7)
**Status**: Complete Usage Guide
