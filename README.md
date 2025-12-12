# @trmnl/picker

A lightweight JavaScript library for managing TRMNL device model and palette selection.

This was extracted from our Core web app for [BYOS](https://docs.usetrmnl.com/go/diy/byos) (Bring Your Own Server) and other applications to take advantage of.

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

The library expects a form with specific element IDs. Apply your favorite CSS styling framework as desired.

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

You have two options: provide your own data, or let the library fetch from the TRMNL API automatically.

#### Option A: Automatic API Fetching (Recommended)

The library can automatically fetch models and palettes from the TRMNL API:

```javascript
// Browser usage
const picker = await TRMNLPicker.create('picker-form')

// NPM module usage
import TRMNLPicker from '@trmnl/picker'
const picker = await TRMNLPicker.create('picker-form')
```

Data is fetched from these API endpoints:

- `https://usetrmnl.com/api/models`
- `https://usetrmnl.com/api/palettes`

See https://usetrmnl.com/api-docs/ for complete API documentation.

#### Option B: Provide Your Own Data

If you already have the data or need to customize it:

```javascript
// Browser usage
const models = [
  {
    name: 'og_plus',
    label: 'TRMNL OG (2-bit)',
    size: 'md',
    width: 800,
    height: 480,
    palette_ids: ['bw', 'gray-4']
  }
]

const palettes = [
  { id: 'bw', name: 'Black & White', framework_class: 'screen--1bit' },
  { id: 'gray-4', name: '4 Grays (2-bit)', framework_class: 'screen--2bit' },
]

const picker = new TRMNLPicker('picker-form', { models, palettes })
```

```javascript
// NPM module usage
import TRMNLPicker from '@trmnl/picker'

const models = await fetch('/api/models').then(r => r.json())
const palettes = await fetch('/api/palettes').then(r => r.json())

const picker = new TRMNLPicker('picker-form', { models, palettes })
```

#### With localStorage Persistence

Save user selections across page reloads:

```javascript
// With API fetching and localStorage
const picker = await TRMNLPicker.create('picker-form', {
  localStorageKey: 'my-trmnl-picker-state'
})
```

The picker will automatically:
- Load the last selected preferences from localStorage on initialization
- Save any changes to localStorage whenever the user makes a selection
- Fall back to defaults if no saved state exists

### 3. Listen for Changes

```javascript
document.getElementById('picker-form').addEventListener('changed', (event) => {
  const { screenClasses, state } = event.detail

  console.log('Screen classes:', screenClasses)
  // ['screen--1bit', 'screen--trmnl_original', 'screen--2.9', 'screen--landscape', 'screen--1x']

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

### Static Methods

#### `TRMNLPicker.create(formId, options)`

Create a picker instance with automatic API data fetching (async).

```javascript
// Fetch both models and palettes from TRMNL API
const picker = await TRMNLPicker.create('picker-form')

// Provide models, fetch palettes
const picker = await TRMNLPicker.create('picker-form', { models })

// Fetch models, provide palettes
const picker = await TRMNLPicker.create('picker-form', { palettes })

// Provide both (same as using constructor)
const picker = await TRMNLPicker.create('picker-form', { models, palettes })
```

**Parameters:**
- `formId` (string, required): ID of the form element
- `options` (object, optional): Configuration options
  - `options.models` (array, optional): Array of model objects. If not provided, fetches from `https://usetrmnl.com/api/models`
  - `options.palettes` (array, optional): Array of palette objects. If not provided, fetches from `https://usetrmnl.com/api/palettes`
  - `options.localStorageKey` (string, optional): localStorage key for persisting picker state across page reloads

**Returns:** `Promise<TRMNLPicker>` - Promise that resolves to the picker instance

**Throws:** Error if API fetch fails or data is invalid

### Constructor

```javascript
new TRMNLPicker(formId, options)
```

Direct constructor for synchronous initialization with data already available.

**Parameters:**

- `formId` (string, required): ID of the form element containing picker controls
- `options` (object, optional): Configuration options
  - `options.models` (array, optional): Array of model objects from the `/api/models` endpoint
  - `options.palettes` (array, optional): Array of palette objects
  - `options.localStorageKey` (string, optional): localStorage key for persisting picker state across page reloads

**Note:** If models and palettes are not provided to the constructor, the picker will be created but not initialized. Use `TRMNLPicker.create()` instead for automatic data fetching.

**Model Object Structure:**
```javascript
{
  name: 'trmnl_original',       // Unique identifier
  label: 'TRMNL Original',      // Display name
  size: 'md',                   // Screen size class
  width: 800,                   // Width in pixels
  height: 480,                  // Height in pixels
  palette_ids: ['bw', 'gray-4'] // Available palettes for this model
}
```

**Palette Object Structure:**
```javascript
{
  id: 'bw',                          // Palette identifier
  name: 'Black & White',             // Display name
  framework_class: 'screen--1bit'      // CSS class for styling (required)
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
    size: 'md',
    width: 800,
    height: 480
  },
  palette: {
    id: 'bw',
    name: 'Black & White',
    framework_class: 'screen--1bit'
  },
  isPortrait: false,
  isDarkMode: false,
  screenClasses: [
    'screen--1bit',
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

Emitted when:
- User changes any selection (model, palette, orientation, or dark mode)
- **On initialization** - allows you to get the initial state immediately

```javascript
document.getElementById('picker-form').addEventListener('changed', (event) => {
  const { screenClasses, state } = event.detail
  // Handle the change
})
```

**Important:** The event is emitted immediately after initialization, so you can apply initial screen classes without waiting for user interaction.

**Event Detail Structure:**
```javascript
{
  screenClasses: [
    'screen--1bit',
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

1. **Palette class**: From `palette.framework_class` (e.g., `screen--1bit`)
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
- `#reset-button` - Button to reset to defaults (first palette, landscape orientation, light mode)
- `[data-orientation-text]` - Text element showing current orientation
- `[data-dark-mode-text]` - Text element showing current mode

## Examples

### Complete Working Example

See [example/index.html](example/index.html) for a complete working example with styling.

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
