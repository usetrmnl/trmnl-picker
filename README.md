# @trmnl/picker

A lightweight JavaScript library for managing TRMNL device model and palette selection.

This was extracted from our Core web app for [BYOS](https://docs.usetrmnl.com/go/diy/byos) (Bring Your Own Server) and other applications to take advantage of.

## Live Demo

Try the interactive demo: [https://usetrmnl.github.io/trmnl-picker/example/](https://usetrmnl.github.io/trmnl-picker/example/)

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

You have two options: let the library fetch from the TRMNL API automatically, or provide your own data.

#### Option A: Automatic API Fetching (Recommended)

The library can automatically fetch models and palettes from the TRMNL API:

```javascript
const picker = await TRMNLPicker.create('picker-form')
```

Data is fetched from these API endpoints:

- `https://usetrmnl.com/api/models`
- `https://usetrmnl.com/api/palettes`

See https://usetrmnl.com/api-docs/ for complete API documentation.

#### Option B: Provide Your Own Data

If you already have the data, or need to customize it, you can pass `models` and/or `palettes` as options to the constructor:

```javascript
const models = [...]
const palettes = [...]

const picker = await TRMNLPicker.create('picker-form', { models, palettes })
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
  const { source, screenClasses, state } = event.detail

  document.querySelectorAll('.screen').forEach(screen => {
    screen.className = screenClasses.join(' ')
    executeTerminalize() // if Framework plugins.js has been included
  })
})
```

## API Reference

### Static Constructor Method

#### `TRMNLPicker.create(formIdOrElement, options)`

```javascript
// Fetch both models and palettes from TRMNL API
const picker = await TRMNLPicker.create('picker-form')

// Or pass a DOM element directly
const formElement = document.getElementById('picker-form')
const picker = await TRMNLPicker.create(formElement)

// Or provide custom data
const picker = await TRMNLPicker.create('picker-form', { models, palettes })
```

**Parameters:**
- `formIdOrElement` (string | Element, required): Form element ID or DOM element itself
- `options` (object, optional): Configuration options
  - `options.models` (array, optional): Array of model objects. If not provided, fetches from `https://usetrmnl.com/api/models`
    - See the [TRMNL API docs](https://usetrmnl.com/api-docs/index.html) for model object schema 
  - `options.palettes` (array, optional): Array of palette objects. If not provided, fetches from `https://usetrmnl.com/api/palettes`
    - See the [TRMNL API docs](https://usetrmnl.com/api-docs/index.html) for palette object schema
  - `options.localStorageKey` (string, optional): localStorage key for persisting picker state across page reloads

**Returns:** `Promise<TRMNLPicker>` - Promise that resolves to the picker instance

**Throws:** Error if API fetch fails or data is invalid

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
    'screen',
    'screen--1bit',
    'screen--v2',
    'screen--md',
    'screen--1x'
  ]
}
```

#### `getScreenClasses()`

Get just the current screen classes array.

```javascript
const screenClasses = picker.getScreenClasses()
// ['screen', 'screen--1bit', 'screen--v2', 'screen--md', 'screen--1x']
```

**Returns:** `Array<string>` - Array of CSS class names

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
  const { source, screenClasses, state } = event.detail
  // Handle the change
})
```

**Important:** The event is emitted immediately after initialization, so you can apply initial screen classes without waiting for user interaction.

**Event Detail Structure:**
```javascript
{
  source: 'initial' | 'form' | 'update',
  screenClasses: [...],
  state: {
    model: { name, label, width, height, kind, css: {...} },
    palette: { id, name, framework_class },
    isPortrait: false,
    isDarkMode: false
  }
}
```

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

See [example/index.html](example/index.html) for a complete working example with styling.

### Applying Classes to Screen Elements

```javascript
document.getElementById('picker-form').addEventListener('changed', (event) => {
  const { screenClasses } = event.detail

  // Apply to all elements with class 'screen'
  document.querySelectorAll('.screen').forEach(screen => {
    screen.className = screenClasses.join(' ')
  })
})
```

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

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please use the [GitHub issue tracker](https://github.com/usetrmnl/trmnl-picker/issues).
