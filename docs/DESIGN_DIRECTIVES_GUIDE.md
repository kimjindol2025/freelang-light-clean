# Design Directives Guide

Complete reference for using design directives in FreeLang.

## Overview

Design directives are first-class language constructs in FreeLang that enable you to define animations, visual effects, and interactions directly in your component files.

### Supported Directives

| Directive | Purpose | Engine |
|-----------|---------|--------|
| `@animation` | Define CSS animations | AnimationEngine |
| `@glass` | Glassmorphism effects | GlassmorphismEngine |
| `@3d` | 3D transforms | Transform3DEngine |
| `@micro` | Micro-interactions | MicroInteractionHandler |
| `@scroll` | Scroll-triggered effects | ScrollTriggerSystem |

---

## 1. @animation Directive

### Syntax

```freelang
@animation [name] {
  duration: <milliseconds>
  [easing: <easing-function>]
  [delay: <milliseconds>]
  [iteration: <count>]
  <property>: <from> → <to>
  ...
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `duration` | Number (ms) | Required | Animation duration |
| `easing` | String | `ease` | Animation timing function |
| `delay` | Number (ms) | 0 | Animation delay before start |
| `iteration` | Number | 1 | Number of iterations |

### Supported Transform Properties

- `opacity: <0-1> → <0-1>` - Fade in/out
- `transform: <from> → <to>` - CSS transforms (translate, scale, rotate, skew)
- `color: <color1> → <color2>` - Color transition
- `background: <color1> → <color2>` - Background color transition

### Examples

**Simple Fade-In**:
```freelang
@animation fadeIn {
  duration: 300
  opacity: 0 → 1
}
```

**Slide from Left**:
```freelang
@animation slideInLeft {
  duration: 500
  delay: 100
  easing: cubic-bezier(0.4, 0, 0.2, 1)
  transform: translateX(-100px) → translateX(0)
}
```

**Bounce Scale**:
```freelang
@animation bounceIn {
  duration: 600
  easing: cubic-bezier(0.68, -0.55, 0.265, 1.55)
  transform: scale(0) → scale(1)
}
```

### Easing Functions

Common easing functions:
- `linear` - Constant speed
- `ease` - Slow start, fast middle, slow end
- `ease-in` - Slow start
- `ease-out` - Slow end
- `ease-in-out` - Slow start and end
- `cubic-bezier(x1, y1, x2, y2)` - Custom curve

---

## 2. @glass Directive

### Syntax

```freelang
@glass [name] {
  background: <color with alpha>
  backdropFilter: <blur(amount)>
  [borderRadius: <value>]
  [border: <value>]
  [padding: <value>]
  ...
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `background` | RGBA Color | Required | Background color with transparency |
| `backdropFilter` | CSS filter | Required | Blur effect (blur, brightness, etc.) |
| `borderRadius` | Length | 0 | Rounded corners |
| `border` | Border value | none | Border style |

### Examples

**Light Glass**:
```freelang
@glass light {
  background: rgba(255, 255, 255, 0.1)
  backdropFilter: blur(10px)
  borderRadius: 12px
}
```

**Dark Glass**:
```freelang
@glass dark {
  background: rgba(0, 0, 0, 0.3)
  backdropFilter: blur(15px)
  border: 1px solid rgba(255, 255, 255, 0.1)
}
```

**Card Preset**:
```freelang
@glass cardEffect {
  background: rgba(255, 255, 255, 0.05)
  backdropFilter: blur(20px)
  borderRadius: 16px
  padding: 20px
  border: 1px solid rgba(255, 255, 255, 0.2)
}
```

### Hover States

Define state-specific glass effects:
```freelang
@glass hoverState {
  background: rgba(255, 255, 255, 0.15)
  backdropFilter: blur(20px)
}
```

---

## 3. @3d Directive

### Syntax

```freelang
@3d [name] {
  [perspective: <value>]
  [rotateX: <angle>]
  [rotateY: <angle>]
  [rotateZ: <angle>]
  [translateZ: <distance>]
  [scale: <factor>]
  ...
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `perspective` | Length | 1000px | Perspective depth |
| `rotateX` | Angle | 0deg | Rotation around X axis |
| `rotateY` | Angle | 0deg | Rotation around Y axis |
| `rotateZ` | Angle | 0deg | Rotation around Z axis |
| `translateZ` | Length | 0 | Translation along Z axis |
| `scale` | Number | 1 | Scale factor |

### Examples

**Flip Card**:
```freelang
@3d flipCard {
  perspective: 1000px
  rotateX: 0deg
  rotateY: 0deg
}

@3d flipCardHover {
  rotateY: 180deg
}
```

**Tilt on Hover**:
```freelang
@3d tiltEffect {
  perspective: 1200px
  rotateX: -5deg
  rotateY: 5deg
  scale: 1.05
}
```

**3D Depth**:
```freelang
@3d depthEffect {
  perspective: 800px
  rotateX: -15deg
  translateZ: 50px
  scale: 1.1
}
```

---

## 4. @micro Directive

### Syntax

```freelang
@micro [name] {
  [onHover: <transform>]
  [onActive: <transform>]
  [onFocus: <transform>]
  [transition: <duration> <timing>]
  [effect: <effect-type>]
  ...
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `onHover` | Transform | none | Transform on hover |
| `onActive` | Transform | none | Transform on active/click |
| `onFocus` | Transform | none | Transform on focus |
| `transition` | Duration + Timing | 150ms ease | Transition duration and timing |
| `effect` | String | none | Special effect (ripple, glow, etc.) |

### Transform Values

- `scale(factor)` - Scale element
- `translate(x, y)` - Move element
- `rotate(angle)` - Rotate element
- `brightness(percent)` - Change brightness
- `blur(px)` - Apply blur

### Examples

**Button Hover Effect**:
```freelang
@micro buttonEffect {
  onHover: scale(1.1)
  onActive: scale(0.95)
  transition: 200ms cubic-bezier(0.4, 0, 0.2, 1)
}
```

**Ripple Effect**:
```freelang
@micro rippleButton {
  effect: ripple
  transition: 600ms
}
```

**Glow Effect**:
```freelang
@micro glowEffect {
  onHover: scale(1.05)
  effect: glow
  transition: 300ms ease-out
}
```

---

## 5. @scroll Directive

### Syntax

```freelang
@scroll [name] {
  [trigger: <selector>]
  [start: <position> <offset>]
  [end: <position> <offset>]
  [scrub: <boolean | number>]
  [animation: <animation-name>]
  ...
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `trigger` | CSS Selector | window | Element that triggers scroll |
| `start` | Position + Offset | top center | Animation start position |
| `end` | Position + Offset | bottom center | Animation end position |
| `scrub` | Boolean / Number | false | Smooth scrubbing (true or seconds) |
| `animation` | String | none | Animation to trigger |

### Position Values

- `top` - Top of element
- `bottom` - Bottom of element
- `center` - Center of viewport

### Examples

**Reveal on Scroll**:
```freelang
@scroll revealOnScroll {
  trigger: .reveal-item
  start: top 80%
  end: top 20%
}
```

**Parallax Effect**:
```freelang
@scroll parallaxLayer {
  trigger: .parallax-section
  start: top bottom
  end: bottom top
  scrub: 1
}
```

**Timeline Scrub**:
```freelang
@scroll timelineScrub {
  trigger: .timeline
  scrub: true
  animation: timeline-progress
}
```

---

## 6. Combining Directives

### Multiple Blocks of Same Type

```freelang
component SequencedAnimations {
  @animation fadeIn {
    duration: 300
    opacity: 0 → 1
  }

  @animation slideIn {
    duration: 500
    delay: 300
    transform: translateX(-50px) → translateX(0)
  }

  @animation scaleIn {
    duration: 400
    delay: 800
    transform: scale(0.8) → scale(1)
  }
}
```

### Multiple Different Types

```freelang
component CompleteDesign {
  @animation fadeIn {
    duration: 300
    opacity: 0 → 1
  }

  @glass {
    background: rgba(255, 255, 255, 0.1)
    backdropFilter: blur(10px)
  }

  @3d {
    perspective: 1000px
    rotateX: -5deg
  }

  @micro {
    onHover: scale(1.05)
    transition: 200ms
  }

  @scroll {
    trigger: .section
    start: top 80%
  }
}
```

---

## 7. Best Practices

### Performance

✅ **DO**:
- Use `will-change` for animated properties
- Keep animation durations reasonable (200-800ms)
- Use GPU-accelerated properties (transform, opacity)
- Batch similar animations together

❌ **DON'T**:
- Animate layout properties (width, height, position)
- Use too many simultaneous animations
- Set very long animation durations without reason
- Animate expensive properties (box-shadow, blur)

### Accessibility

✅ **DO**:
- Respect `prefers-reduced-motion` media query
- Provide non-animated fallbacks
- Test with screen readers
- Ensure animations don't obscure content

❌ **DON'T**:
- Use seizure-inducing animations (flashing >3Hz)
- Animate auto-playing content without pause button
- Rely solely on animation for important information
- Use animations that block user interaction

### Browser Support

- **@animation**: All modern browsers
- **@glass**: Chrome 76+, Safari 9+, Firefox 103+
- **@3d**: All modern browsers (Chrome, Safari, Firefox, Edge)
- **@micro**: All modern browsers with CSS transitions
- **@scroll**: Modern browsers with Intersection Observer API

---

## 8. Troubleshooting

### Animation Not Playing

```freelang
// ❌ Missing duration
@animation broken {
  opacity: 0 → 1
}

// ✅ Correct
@animation correct {
  duration: 300
  opacity: 0 → 1
}
```

### Glass Effect Not Visible

```freelang
// ❌ Missing backdropFilter
@glass incomplete {
  background: rgba(255, 255, 255, 0.1)
}

// ✅ Correct
@glass complete {
  background: rgba(255, 255, 255, 0.1)
  backdropFilter: blur(10px)
}
```

### 3D Transform Not Working

```freelang
// ❌ Missing perspective
@3d broken {
  rotateX: 45deg
}

// ✅ Correct
@3d correct {
  perspective: 1000px
  rotateX: 45deg
}
```

---

## 9. CLI Compilation

### Compile Design Blocks

```bash
freelang build component.free --designs --design-output ./artifacts
```

### Verbose Output

```bash
freelang build component.free --designs -v
```

### Output Structure

```
artifacts/
├─ component.design.css  (Compiled CSS)
└─ component.design.js   (Compiled JavaScript)
```

---

**Last Updated**: 2026-03-14 (Phase 10.7)
**Status**: Complete Reference Guide
