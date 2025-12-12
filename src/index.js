/**
 * TRMNLPicker - Vanilla JS library for TRMNL device and palette selection
 *
 * @class TRMNLPicker
 * @param {string} formId - ID of the form element containing picker controls
 * @param {Array<Object>} models - Array of model objects from API
 * @param {Array<Object>} palettes - Array of palette objects
 */
class TRMNLPicker {
  constructor(formId, models, palettes) {
    // Validate inputs
    if (!formId || typeof formId !== 'string') {
      throw new Error('TRMNLPicker: formId must be a non-empty string')
    }

    if (!Array.isArray(models) || models.length === 0) {
      throw new Error('TRMNLPicker: models must be a non-empty array')
    }

    if (!Array.isArray(palettes) || palettes.length === 0) {
      throw new Error('TRMNLPicker: palettes must be a non-empty array')
    }

    // Store references
    this.formElement = document.getElementById(formId)
    if (!this.formElement) {
      throw new Error(`TRMNLPicker: Form element with id "${formId}" not found`)
    }

    this.models = models
    this.palettes = palettes

    // Initialize state
    this.state = {
      selectedModel: null,
      selectedPalette: null,
      isPortrait: false,
      isDarkMode: false
    }

    // Initialize DOM elements and bind events
    this._initializeElements()
    this._bindEvents()

    // Set initial state
    this._setInitialState()
  }

  /**
   * Find and store references to form elements
   * @private
   */
  _initializeElements() {
    this.elements = {
      modelSelect: this.formElement.querySelector('#model-select'),
      paletteSelect: this.formElement.querySelector('#palette-select'),
      orientationToggle: this.formElement.querySelector('#orientation-toggle'),
      darkModeToggle: this.formElement.querySelector('#dark-mode-toggle'),
      resetButton: this.formElement.querySelector('#reset-button'),

      // Optional: UI indicator elements
      orientationText: this.formElement.querySelector('[data-orientation-text]'),
      darkModeText: this.formElement.querySelector('[data-dark-mode-text]')
    }

    // Validate required elements
    const required = ['modelSelect', 'paletteSelect']
    for (const key of required) {
      if (!this.elements[key]) {
        throw new Error(`TRMNLPicker: Required element "${key}" not found in form`)
      }
    }
  }

  /**
   * Bind event listeners to form elements
   * @private
   */
  _bindEvents() {
    // Store bound handlers for cleanup
    this.handlers = {
      modelChange: this._handleModelChange.bind(this),
      paletteChange: this._handlePaletteChange.bind(this),
      orientationToggle: this._toggleOrientation.bind(this),
      darkModeToggle: this._toggleDarkMode.bind(this),
      reset: this._resetToDefaults.bind(this)
    }

    // Attach event listeners
    this.elements.modelSelect.addEventListener('change', this.handlers.modelChange)
    this.elements.paletteSelect.addEventListener('change', this.handlers.paletteChange)

    if (this.elements.orientationToggle) {
      this.elements.orientationToggle.addEventListener('click', this.handlers.orientationToggle)
    }

    if (this.elements.darkModeToggle) {
      this.elements.darkModeToggle.addEventListener('click', this.handlers.darkModeToggle)
    }

    if (this.elements.resetButton) {
      this.elements.resetButton.addEventListener('click', this.handlers.reset)
    }
  }

  /**
   * Set initial state and populate form
   * @private
   */
  _setInitialState() {
    // Populate model select with all models
    this.elements.modelSelect.innerHTML = ''
    this.models.forEach(model => {
      const option = document.createElement('option')
      option.value = model.name
      option.textContent = model.label || model.name
      this.elements.modelSelect.appendChild(option)
    })

    // Set default model (first model or specific default)
    const defaultModel = this.models[0]
    this.elements.modelSelect.value = defaultModel.name
    this.state.selectedModel = defaultModel

    // Populate palettes based on selected model
    this._populatePalettes()

    // Set first palette as default
    const firstPaletteId = defaultModel.palette_ids[0]
    this.elements.paletteSelect.value = firstPaletteId
    this.state.selectedPalette = this.palettes.find(p => p.id === firstPaletteId)

    // Update UI
    this._updateResetButton()
  }

  /**
   * Populate palette dropdown based on selected model
   * @private
   */
  _populatePalettes() {
    const modelName = this.elements.modelSelect.value
    const model = this.models.find(m => m.name === modelName)

    if (!model) return

    // Clear existing options
    this.elements.paletteSelect.innerHTML = ''

    // Add options for each palette_id in the model
    model.palette_ids.forEach(paletteId => {
      const palette = this.palettes.find(p => p.id === paletteId)
      if (palette) {
        const option = document.createElement('option')
        option.value = palette.id
        option.textContent = palette.name
        this.elements.paletteSelect.appendChild(option)
      }
    })
  }

  /**
   * Calculate screen classes based on current state
   * @private
   * @returns {Array<string>} Array of CSS class names
   */
  _calculateScreenClasses() {
    const model = this.state.selectedModel
    const palette = this.state.selectedPalette

    if (!model) {
      throw new Error('No model selected')
    }

    const classes = []

    // 1. Palette framework class
    if (palette && palette.framework_class) {
      classes.push(palette.framework_class)
    }

    // 2. Model name
    classes.push(`screen--${model.name}`)

    // 3. Model size
    if (model.size) {
      classes.push(`screen--${model.size}`)
    }

    // 4. Orientation
    classes.push(`screen--${this.state.isPortrait ? 'portrait' : 'landscape'}`)

    // 5. Scale (always 1x)
    classes.push('screen--1x')

    // 6. Dark mode (conditional)
    if (this.state.isDarkMode) {
      classes.push('screen--dark-mode')
    }

    return classes
  }

  /**
   * Emit 'changed' event with current state and screen classes
   * @private
   */
  _emitChangeEvent() {
    const model = this.state.selectedModel
    const palette = this.state.selectedPalette

    const event = new CustomEvent('changed', {
      detail: {
        screenClasses: this._calculateScreenClasses(),
        state: {
          model: model ? {
            name: model.name,
            label: model.label,
            size: model.size,
            width: model.width,
            height: model.height
          } : null,
          palette: palette ? {
            id: palette.id,
            name: palette.name,
            framework_class: palette.framework_class
          } : null,
          isPortrait: this.state.isPortrait,
          isDarkMode: this.state.isDarkMode
        }
      },
      bubbles: true
    })

    this.formElement.dispatchEvent(event)
  }

  /**
   * Handle model selection change
   * @private
   */
  _handleModelChange(event) {
    const modelName = event.target.value
    const model = this.models.find(m => m.name === modelName)

    if (!model) return

    // Update state
    this.state.selectedModel = model

    // Repopulate palettes for new model
    this._populatePalettes()

    // Select first palette of new model
    const firstPaletteId = model.palette_ids[0]
    this.elements.paletteSelect.value = firstPaletteId
    this.state.selectedPalette = this.palettes.find(p => p.id === firstPaletteId)

    // Update UI
    this._updateResetButton()

    // Emit change event
    this._emitChangeEvent()
  }

  /**
   * Handle palette selection change
   * @private
   */
  _handlePaletteChange(event) {
    const paletteId = event.target.value
    const palette = this.palettes.find(p => p.id === paletteId)

    this.state.selectedPalette = palette

    // Update UI
    this._updateResetButton()

    // Emit change event
    this._emitChangeEvent()
  }

  /**
   * Toggle orientation between portrait and landscape
   * @private
   */
  _toggleOrientation() {
    this.state.isPortrait = !this.state.isPortrait

    // Update optional UI elements
    if (this.elements.orientationText) {
      this.elements.orientationText.textContent = this.state.isPortrait ? 'Portrait' : 'Landscape'
    }

    // Emit change event
    this._emitChangeEvent()
  }

  /**
   * Toggle dark mode on/off
   * @private
   */
  _toggleDarkMode() {
    this.state.isDarkMode = !this.state.isDarkMode

    // Update optional UI elements
    if (this.elements.darkModeText) {
      this.elements.darkModeText.textContent = this.state.isDarkMode ? 'Dark Mode' : 'Light Mode'
    }

    // Emit change event
    this._emitChangeEvent()
  }

  /**
   * Reset palette to model's default (first palette)
   * @private
   */
  _resetToDefaults() {
    const model = this.state.selectedModel
    if (!model) return

    // Reset to first palette of current model
    const firstPaletteId = model.palette_ids[0]
    this.elements.paletteSelect.value = firstPaletteId
    this.state.selectedPalette = this.palettes.find(p => p.id === firstPaletteId)

    // Update UI
    this._updateResetButton()

    // Emit change event
    this._emitChangeEvent()
  }

  /**
   * Update reset button enabled/disabled state
   * @private
   */
  _updateResetButton() {
    if (!this.elements.resetButton) return

    const model = this.state.selectedModel
    if (!model) return

    const isAtDefaults = this.elements.paletteSelect.value === String(model.palette_ids[0])

    this.elements.resetButton.disabled = isAtDefaults

    if (isAtDefaults) {
      this.elements.resetButton.classList.add('opacity-50', 'cursor-default')
      this.elements.resetButton.setAttribute('aria-disabled', 'true')
    } else {
      this.elements.resetButton.classList.remove('opacity-50', 'cursor-default')
      this.elements.resetButton.removeAttribute('aria-disabled')
    }
  }

  /**
   * Update picker with new configuration
   * @public
   * @param {Object} config - Configuration object
   * @param {string} config.modelName - Model name to select
   * @param {string} config.paletteId - Palette ID to select
   * @param {boolean} config.isPortrait - Portrait orientation
   * @param {boolean} config.isDarkMode - Dark mode enabled
   */
  update(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('TRMNLPicker.update: config must be an object')
    }

    let changed = false

    // Update model if provided
    if (config.modelName) {
      const model = this.models.find(m => m.name === config.modelName)
      if (model) {
        this.elements.modelSelect.value = model.name
        this.state.selectedModel = model
        this._populatePalettes()
        changed = true
      }
    }

    // Update palette if provided
    if (config.paletteId) {
      const palette = this.palettes.find(p => p.id === config.paletteId)
      if (palette) {
        this.elements.paletteSelect.value = palette.id
        this.state.selectedPalette = palette
        changed = true
      }
    }

    // Update orientation if provided
    if (typeof config.isPortrait === 'boolean') {
      this.state.isPortrait = config.isPortrait
      if (this.elements.orientationText) {
        this.elements.orientationText.textContent = this.state.isPortrait ? 'Portrait' : 'Landscape'
      }
      changed = true
    }

    // Update dark mode if provided
    if (typeof config.isDarkMode === 'boolean') {
      this.state.isDarkMode = config.isDarkMode
      if (this.elements.darkModeText) {
        this.elements.darkModeText.textContent = this.state.isDarkMode ? 'Dark Mode' : 'Light Mode'
      }
      changed = true
    }

    if (changed) {
      this._updateResetButton()
      this._emitChangeEvent()
    }
  }

  /**
   * Get current picker state
   * @public
   * @returns {Object} Current state including model, palette, flags, and screen classes
   */
  getState() {
    return {
      model: this.state.selectedModel,
      palette: this.state.selectedPalette,
      isPortrait: this.state.isPortrait,
      isDarkMode: this.state.isDarkMode,
      screenClasses: this._calculateScreenClasses()
    }
  }

  /**
   * Clean up event listeners and references
   * @public
   */
  destroy() {
    // Remove event listeners
    this.elements.modelSelect.removeEventListener('change', this.handlers.modelChange)
    this.elements.paletteSelect.removeEventListener('change', this.handlers.paletteChange)

    if (this.elements.orientationToggle) {
      this.elements.orientationToggle.removeEventListener('click', this.handlers.orientationToggle)
    }

    if (this.elements.darkModeToggle) {
      this.elements.darkModeToggle.removeEventListener('click', this.handlers.darkModeToggle)
    }

    if (this.elements.resetButton) {
      this.elements.resetButton.removeEventListener('click', this.handlers.reset)
    }

    // Clear references
    this.formElement = null
    this.elements = null
    this.handlers = null
    this.models = null
    this.palettes = null
    this.state = null
  }
}

export default TRMNLPicker
