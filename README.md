# @trmnl/picker

A lightweight, framework-agnostic JavaScript library for managing TRMNL device model and palette selection.

## Features

- Zero dependencies
- Vanilla JavaScript (ES6+)
- Event-driven architecture
- Support for both NPM and browser usage
- Minimal API surface
- TypeScript-friendly

## Installation

### NPM
```bash
npm install @trmnl/picker
```

### Browser (CDN)
```html
<script src="https://unpkg.com/@trmnl/picker@latest/dist/trmnl-picker.min.js"></script>
```

### Browser (Local)
```html
<script src="dist/trmnl-picker.min.js"></script>
```

## Quick Start

### 1. Create HTML Structure

The library expects a form with specific element IDs:

```html
<form id="picker-form">
  <!-- Required: Model selector -->
  <select id="model-select"></select>

  <!-- Required: Palette selector -->
  <select id="palette-select"></select>

  <!-- Optional: Orientation toggle -->
  <button type="button" id="orientation-toggle">
    <span data-orientation-text>Landscape</span>
  </button>

  <!-- Optional: Dark mode toggle -->
  <button type="button" id="dark-mode-toggle">
    <span data-dark-mode-text>Light Mode</span>
  </button>

  <!-- Optional: Reset button -->
  <button type="button" id="reset-button">Reset</button>
</form>
```

### 2. Initialize Picker

#### Browser Usage
```html
<script src="dist/trmnl-picker.min.js"></script>
<script>
  // Get data from your API or define locally
  const models = [
    {
      name: 'trmnl_original',
      label: 'TRMNL Original',
      size: '2.9',
      width: 800,
      height: 480,
      palette_ids: ['bw', '4c', '7c']
    }
  ]

  const palettes = [
    { id: 'bw', name: 'Black & White', framework_class: 'palette-bw' },
    { id: '4c', name: '4-Color', framework_class: 'palette-4c' },
    { id: '7c', name: '7-Color', framework_class: 'palette-7c' }
  ]

  // Initialize (TRMNLPicker is available globally)
  const picker = new TRMNLPicker('picker-form', models, palettes)
</script>
```

#### NPM Module Usage
```javascript
import TRMNLPicker from '@trmnl/picker'

// Fetch data from API
const modelsResponse = await fetch('/api/models')
const modelsData = await modelsResponse.json()
const models = modelsData.data // Adjust based on your API response structure

const palettes = [
  { id: 'bw', name: 'Black & White', framework_class: 'palette-bw' },
  { id: '4c', name: '4-Color', framework_class: 'palette-4c' }
]

// Initialize
const picker = new TRMNLPicker('picker-form', models, palettes)
```

### 3. Listen for Changes

```javascript
document.getElementById('picker-form').addEventListener('changed', (event) => {
  const { screenClasses, state } = event.detail

  console.log('Screen classes:', screenClasses)
  // ['palette-bw', 'screen--trmnl_original', 'screen--2.9', 'screen--landscape', 'screen--1x']

  console.log('State:', state)
  // { model: {...}, palette: {...}, isPortrait: false, isDarkMode: false }

  // Apply classes to your screen elements
  document.querySelectorAll('.screen').forEach(screen => {
    const filtered = screen.className.split(' ')
      .filter(c => !c.startsWith('screen--') || c.startsWith('screen--scale-'))
    screen.className = [...filtered, ...screenClasses].join(' ')
  })
})
```

## API Reference

### Constructor

```javascript
new TRMNLPicker(formId, models, palettes)
```

**Parameters:**

- `formId` (string, required): ID of the form element containing picker controls
- `models` (array, required): Array of model objects from the `/api/models` endpoint
- `palettes` (array, required): Array of palette objects

**Model Object Structure:**
```javascript
{
  name: 'trmnl_original',      // Unique identifier
  label: 'TRMNL Original',     // Display name
  size: '2.9',                 // Screen size
  width: 800,                  // Width in pixels
  height: 480,                 // Height in pixels
  palette_ids: ['bw', '4c']    // Available palettes for this model
}
```

**Palette Object Structure:**
```javascript
{
  id: 'bw',                          // Palette identifier
  name: 'Black & White',             // Display name
  framework_class: 'palette-bw'      // CSS class for styling
}
```

### Methods

#### `update(config)`

Programmatically update picker state.

```javascript
picker.update({
  modelName: 'trmnl_original',  // Model name to select
  paletteId: 'bw',              // Palette ID to select
  isPortrait: true,             // Set portrait orientation
  isDarkMode: false             // Set dark mode
})
```

**Parameters:**
- `config.modelName` (string, optional): Model name to select
- `config.paletteId` (string, optional): Palette ID to select
- `config.isPortrait` (boolean, optional): Set portrait orientation
- `config.isDarkMode` (boolean, optional): Enable/disable dark mode

#### `getState()`

Get current picker state.

```javascript
const state = picker.getState()
```

**Returns:**
```javascript
{
  model: {
    name: 'trmnl_original',
    label: 'TRMNL Original',
    size: '2.9',
    width: 800,
    height: 480
  },
  palette: {
    id: 'bw',
    name: 'Black & White',
    framework_class: 'palette-bw'
  },
  isPortrait: false,
  isDarkMode: false,
  screenClasses: [
    'palette-bw',
    'screen--trmnl_original',
    'screen--2.9',
    'screen--landscape',
    'screen--1x'
  ]
}
```

#### `destroy()`

Clean up event listeners and references. Call this when removing the picker.

```javascript
picker.destroy()
```

### Events

#### `changed` Event

Emitted when user changes any selection (model, palette, orientation, or dark mode).

```javascript
document.getElementById('picker-form').addEventListener('changed', (event) => {
  const { screenClasses, state } = event.detail
  // Handle the change
})
```

**Event Detail Structure:**
```javascript
{
  screenClasses: [
    'palette-bw',
    'screen--trmnl_original',
    'screen--2.9',
    'screen--landscape',
    'screen--1x'
  ],
  state: {
    model: { name, label, size, width, height },
    palette: { id, name, framework_class },
    isPortrait: false,
    isDarkMode: false
  }
}
```

## Screen Class Generation

The library generates CSS classes in the following order:

1. **Palette class**: From `palette.framework_class` (e.g., `palette-bw`)
2. **Model name**: `screen--{model.name}` (e.g., `screen--trmnl_original`)
3. **Model size**: `screen--{model.size}` (e.g., `screen--2.9`)
4. **Orientation**: `screen--portrait` or `screen--landscape`
5. **Scale**: Always `screen--1x`
6. **Dark mode** (conditional): `screen--dark-mode` (when enabled)

## Form Elements

The library expects the following elements within the form:

### Required Elements
- `#model-select` - Model dropdown
- `#palette-select` - Palette dropdown

### Optional Elements
- `#orientation-toggle` - Button to toggle portrait/landscape
- `#dark-mode-toggle` - Button to toggle dark mode
- `#reset-button` - Button to reset palette to model's default
- `[data-orientation-text]` - Text element showing current orientation
- `[data-dark-mode-text]` - Text element showing current mode

## Examples

### Complete Working Example

See `example/index.html` for a complete working example with styling.

### Applying Classes to Screen Elements

```javascript
document.getElementById('picker-form').addEventListener('changed', (event) => {
  const { screenClasses } = event.detail

  // Apply to all elements with class 'screen'
  document.querySelectorAll('.screen').forEach(screen => {
    // Remove old screen-- classes (except scale and no-bleed)
    const currentClasses = screen.className.split(' ')
    const filteredClasses = currentClasses.filter(c => {
      if (!c.startsWith('screen--')) return true
      if (c.startsWith('screen--scale-')) return true
      if (c === 'screen--no-bleed') return true
      return false
    })

    // Add new screen classes
    filteredClasses.push(...screenClasses)
    screen.className = filteredClasses.join(' ')
  })
})
```

### Using with React

```jsx
import { useEffect, useRef } from 'react'
import TRMNLPicker from '@trmnl/picker'

function ScreenPicker({ models, palettes, onChange }) {
  const pickerRef = useRef(null)

  useEffect(() => {
    const picker = new TRMNLPicker('picker-form', models, palettes)

    const handleChange = (event) => {
      onChange(event.detail)
    }

    document.getElementById('picker-form').addEventListener('changed', handleChange)

    pickerRef.current = picker

    return () => {
      picker.destroy()
      document.getElementById('picker-form').removeEventListener('changed', handleChange)
    }
  }, [models, palettes, onChange])

  return (
    <form id="picker-form">
      <select id="model-select"></select>
      <select id="palette-select"></select>
      <button type="button" id="orientation-toggle">
        <span data-orientation-text>Landscape</span>
      </button>
      <button type="button" id="dark-mode-toggle">
        <span data-dark-mode-text>Light Mode</span>
      </button>
      <button type="button" id="reset-button">Reset</button>
    </form>
  )
}
```

## Migration from Stimulus Version

If you're migrating from the Stimulus-based controller:

### Key Differences

**Removed Features:**
- No localStorage persistence (implement in your app if needed)
- No BroadcastChannel synchronization
- No automatic DOM manipulation of `.screen` elements
- No automatic page reload

**Data Model Changes:**
- Use `model.name` instead of `model.keyname`
- API response field `name` maps directly (e.g., `"trmnl_original"`)

### Migration Steps

1. Remove Stimulus controller and data attributes
2. Add standard HTML form with required element IDs
3. Include `@trmnl/picker` library
4. Initialize picker with `new TRMNLPicker()`
5. Listen to `changed` event and apply classes manually
6. Implement localStorage persistence if needed (application concern)

**Before (Stimulus):**
```erb
<div data-controller="screen-picker"
     data-screen-picker-models-value="<%= models.to_json %>"
     data-screen-picker-palettes-value="<%= palettes.to_json %>">
  <select data-screen-picker-target="modelSelect"></select>
</div>
```

**After (Vanilla):**
```html
<form id="picker-form">
  <select id="model-select"></select>
</form>

<script type="module">
  import TRMNLPicker from '@trmnl/picker'
  const picker = new TRMNLPicker('picker-form', models, palettes)
</script>
```

## Browser Support

- Modern browsers with ES6+ support
- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 15+

## Development

```bash
# Install dependencies
npm install

# Build all formats
npm run build

# Build and watch for changes
npm run watch

# Build specific formats
npm run build:esm        # ES module
npm run build:browser    # IIFE browser bundle
npm run build:browser:min # Minified browser bundle
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please use the [GitHub issue tracker](https://github.com/trmnl/trmnl-picker/issues).
