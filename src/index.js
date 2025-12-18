const DEFAULT_MODEL_NAME = 'og_plus'

/**
 * TRMNLPicker - Vanilla JS library for TRMNL device and palette selection
 *
 * @class TRMNLPicker
 * @param {string} formId - ID of the form element containing picker controls
 * @param {Object} options - Configuration options
 * @param {Array<Object>} options.models - Optional array of model objects from API
 * @param {Array<Object>} options.palettes - Optional array of palette objects
 */
class TRMNLPicker {
  static API_BASE_URL = 'https://usetrmnl.com'

  /**
   * Create a TRMNLPicker instance, fetching data from TRMNL API if not provided
   * @static
   * @param {string} formId - ID of the form element
   * @param {Object} options - Configuration options
   * @param {Array<Object>} options.models - Optional models array
   * @param {Array<Object>} options.palettes - Optional palettes array
   * @returns {Promise<TRMNLPicker>} Promise resolving to picker instance
   */
  static async create(formId, options = {}) {
    let { models, palettes, localStorageKey } = options

    // Fetch models if not provided
    if (!models) {
      try {
        const response = await fetch(`${TRMNLPicker.API_BASE_URL}/api/models`)
        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        models = data.data || data
      } catch (error) {
        throw new Error(`TRMNLPicker: Failed to fetch models from API: ${error.message}`)
      }
    }

    // Fetch palettes if not provided
    if (!palettes) {
      try {
        const response = await fetch(`${TRMNLPicker.API_BASE_URL}/api/palettes`)
        if (!response.ok) {
          throw new Error(`Failed to fetch palettes: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        palettes = data.data || data
      } catch (error) {
        throw new Error(`TRMNLPicker: Failed to fetch palettes from API: ${error.message}`)
      }
    }

    return new TRMNLPicker(formId, { models, palettes, localStorageKey })
  }

  constructor(formIdOrElement, options = {}) {
    // Validate inputs
    if (!formIdOrElement) {
      throw new Error('TRMNLPicker: formIdOrElement is required')
    }

    // Store references - accept either string ID or DOM element
    if (typeof formIdOrElement === 'string') {
      this.formElement = document.getElementById(formIdOrElement)
      if (!this.formElement) {
        throw new Error(`TRMNLPicker: Form element with id "${formIdOrElement}" not found`)
      }
    } else if (formIdOrElement instanceof Element) {
      this.formElement = formIdOrElement
    } else {
      throw new Error('TRMNLPicker: formIdOrElement must be a string ID or DOM element')
    }

    const { models, palettes, localStorageKey } = options

    this.models = models
    this.palettes = palettes
    this.localStorageKey = localStorageKey

    // Only initialize if we have data
    if (this.models && this.palettes) {
      if (!Array.isArray(this.models) || this.models.length === 0) {
        throw new Error('TRMNLPicker: models must be a non-empty array')
      }

      if (!Array.isArray(this.palettes) || this.palettes.length === 0) {
        throw new Error('TRMNLPicker: palettes must be a non-empty array')
      }

      // Filter out models where all palettes have empty framework_class
      this.models = this._filterValidModels()

      if (this.models.length === 0) {
        throw new Error('TRMNLPicker: no valid models found (all models have palettes with empty framework_class)')
      }

      // Initialize DOM elements and bind events
      this._initializeElements()
      this._bindEvents()

      // Set initial state (will load from localStorage if available)
      this._setInitialState()
    }
  }

  /**
   * Filter out models where all their palettes have empty framework_class
   * @private
   * @returns {Array<Object>} Filtered models array
   */
  _filterValidModels() {
    return this.models.filter(model => {
      // Check if at least one palette for this model has a non-empty framework_class
      return model.palette_ids.some(paletteId => {
        const palette = this.palettes.find(p => p.id === paletteId)
        return palette && palette.framework_class && palette.framework_class.trim() !== ''
      })
    })
  }

  /**
   * Get the first valid palette ID for a model (one with non-empty framework_class)
   * @private
   * @param {Object} model - Model object
   * @returns {string|null} First valid palette ID or null
   */
  _getFirstValidPaletteId(model) {
    if (!model) return null

    for (const paletteId of model.palette_ids) {
      const palette = this.palettes.find(p => p.id === paletteId)
      if (palette && palette.framework_class && palette.framework_class.trim() !== '') {
        return paletteId
      }
    }

    return null
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
      reset: this._resetToModelDefaults.bind(this)
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
    // Separate models into TRMNL and BYOD groups
    const trmnlModels = this.models.filter(m => m.kind === 'trmnl')
    const byodModels = this.models.filter(m => m.kind !== 'trmnl')

    // Sort each group alphabetically by label
    const sortTRMNL = [...trmnlModels].sort((a, b) => {
      const labelA = (a.label || a.name).toLowerCase()
      const labelB = (b.label || b.name).toLowerCase()
      return labelA.localeCompare(labelB)
    })

    const sortBYOD = [...byodModels].sort((a, b) => {
      const labelA = (a.label || a.name).toLowerCase()
      const labelB = (b.label || b.name).toLowerCase()
      return labelA.localeCompare(labelB)
    })

    // Populate model select with grouped models
    this.elements.modelSelect.innerHTML = ''

    // Add TRMNL group
    if (sortTRMNL.length > 0) {
      const trmnlGroup = document.createElement('optgroup')
      trmnlGroup.label = 'TRMNL'
      sortTRMNL.forEach(model => {
        const option = document.createElement('option')
        option.value = model.name
        option.textContent = model.label || model.name
        trmnlGroup.appendChild(option)
      })
      this.elements.modelSelect.appendChild(trmnlGroup)
    }

    // Add BYOD group
    if (sortBYOD.length > 0) {
      const byodGroup = document.createElement('optgroup')
      byodGroup.label = 'BYOD'
      sortBYOD.forEach(model => {
        const option = document.createElement('option')
        option.value = model.name
        option.textContent = model.label || model.name
        byodGroup.appendChild(option)
      })
      this.elements.modelSelect.appendChild(byodGroup)
    }

    // Keep combined sorted list for default selection logic
    const sortedModels = [...sortTRMNL, ...sortBYOD]

    // Initialize state
    this._state = {}

    const savedParams = this._loadFromLocalStorage()
    if (savedParams) {
      this._setParams('constructor', savedParams)
    } else {
      const defaultModel = sortedModels.find(m => m.name === DEFAULT_MODEL_NAME) || sortedModels[0]
      const defaultPaletteId = this._getFirstValidPaletteId(defaultModel)

      this._setParams('constructor', {
        modelName: defaultModel.name,
        paletteId: defaultPaletteId,
        isPortrait: false,
        isDarkMode: false
      })
    }
  }

  /**
   * Populate palette dropdown based on selected model
   * @private
   */
  _populateModelPalettes() {
    const modelName = this.elements.modelSelect.value
    const model = this.models.find(m => m.name === modelName)

    if (!model) return

    // Clear existing options
    this.elements.paletteSelect.innerHTML = ''

    // Add options for each palette_id in the model (only if framework_class is not empty)
    model.palette_ids.forEach(paletteId => {
      const palette = this.palettes.find(p => p.id === paletteId)
      if (palette && palette.framework_class && palette.framework_class.trim() !== '') {
        const option = document.createElement('option')
        option.value = palette.id
        option.textContent = palette.name
        this.elements.paletteSelect.appendChild(option)
      }
    })
  }

  /**
   * Emit 'trmnl:change' event with current state and screen classes
   * @private
   */
  _emitChangeEvent(origin) {
    // Save to localStorage if key is configured
    this._saveToLocalStorage()

    const event = new CustomEvent('trmnl:change', {
      detail: {
        origin,
        ...this.state,
        screenClasses: this.screenClasses
      },
      bubbles: true
    })

    this.formElement.dispatchEvent(event)
  }

  /**
   * Load state from localStorage
   * @private
   * @returns {Object|null} Saved state or null if not available
   */
  _loadFromLocalStorage() {
    if (!this.localStorageKey) return null

    try {
      const saved = localStorage.getItem(this.localStorageKey)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.warn('TRMNLPicker: Failed to load from localStorage:', error)
    }

    return null
  }

  /**
   * Save current state to localStorage
   * @private
   */
  _saveToLocalStorage() {
    if (!this.localStorageKey) return

    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.params))
    } catch (error) {
      console.warn('TRMNLPicker: Failed to save to localStorage:', error)
    }
  }

  /**
   * Handle model selection change
   * @private
   */
  _handleModelChange(event) {
    this._setParams('form', { modelName: event.target.value })
  }

  /**
   * Handle palette selection change
   * @private
   */
  _handlePaletteChange(event) {
    this._setParams('form', { paletteId: event.target.value })
  }

  /**
   * Toggle orientation between portrait and landscape
   * @private
   */
  _toggleOrientation() {
    this._setParams('form', { isPortrait: !this._state.isPortrait })
  }

  /**
   * Toggle dark mode on/off
   * @private
   */
  _toggleDarkMode() {
    this._setParams('form', { isDarkMode: !this._state.isDarkMode })
  }

  /**
   * Reset to defaults: first valid palette, landscape orientation, light mode
   * @private
   */
  _resetToModelDefaults() {
    const model = this._state.model
    if (!model) return

    // Reset to first valid palette of current model
    const firstPaletteId = this._getFirstValidPaletteId(model)

    this._setParams('form', {
      paletteId: firstPaletteId,
      isPortrait: false,
      isDarkMode: false
    })
  }

  /**
   * Update reset button enabled/disabled state
   * Button is disabled only when palette, orientation, and dark mode are all at defaults
   * @private
   */
  _updateResetButton() {
    if (!this.elements.resetButton) return

    const model = this._state.model
    if (!model) return

    const firstValidPaletteId = this._getFirstValidPaletteId(model)
    const isPaletteDefault = this.elements.paletteSelect.value === String(firstValidPaletteId)
    const isOrientationDefault = this._state.isPortrait === false
    const isDarkModeDefault = this._state.isDarkMode === false

    const isAtDefaults = isPaletteDefault && isOrientationDefault && isDarkModeDefault

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
   * Get current screen classes
   * @public
   * @returns {Array<string>} Array of CSS class names
   */
  get screenClasses() {
    const model = this._state.model
    const palette = this._state.palette

    if (!model) {
      throw new Error('No model selected')
    }

    const classes = []

    // 0. Base screen class (always present)
    classes.push('screen')

    // 1. Palette framework class
    if (palette && palette.framework_class) {
      classes.push(palette.framework_class)
    }

    // 2. Model device class (from API)
    if (model.css && model.css.classes && model.css.classes.device) {
      classes.push(model.css.classes.device)
    }

    // 3. Model size class (from API)
    if (model.css && model.css.classes && model.css.classes.size) {
      classes.push(model.css.classes.size)
    }

    // 4. Orientation (UI state, only portrait - landscape is default)
    if (this._state.isPortrait) {
      classes.push('screen--portrait')
    }

    // 5. Scale (UI state, always 1x)
    classes.push('screen--1x')

    // 6. Dark mode (UI state, conditional)
    if (this._state.isDarkMode) {
      classes.push('screen--dark-mode')
    }

    return classes
  }

  /**
   * Get current picker parameters
   * @public
   * @returns {Object} Current parameters including model name, palette ID, and flags
   */
  get params() {
    return {
      modelName: this._state.model?.name,
      paletteId: this._state.palette?.id,
      isPortrait: this._state.isPortrait,
      isDarkMode: this._state.isDarkMode
    }
  }

  /**
   * Update picker with new configuration
   * @public
   * @param {Object} params - Configuration object
   * @param {string} params.modelName - Model name to select
   * @param {string} params.paletteId - Palette ID to select
   * @param {boolean} params.isPortrait - Portrait orientation
   * @param {boolean} params.isDarkMode - Dark mode enabled
   */
  setParams(params) {
    this._setParams('setParams', params)
  }

  _setParams(origin, params) {
    if (!params || typeof params !== 'object') {
      throw new Error('params must be an object')
    }

    let changed = false

    // Update model if provided
    if (params.modelName) {
      const model = this.models.find(m => m.name === params.modelName)
      if (model) {
        this.elements.modelSelect.value = model.name
        this._state.model = model
        this._populateModelPalettes()

        // Select first valid palette of new model
        const firstPaletteId = this._getFirstValidPaletteId(model)
        this.elements.paletteSelect.value = firstPaletteId
        this._state.palette = this.palettes.find(p => p.id === firstPaletteId)
        changed = true
      }
    }

    // Update palette if provided
    if (params.paletteId) {
      const palette = this.palettes.find(p => p.id === params.paletteId)
      if (palette) {
        this.elements.paletteSelect.value = palette.id
        this._state.palette = palette
        changed = true
      }
    }

    // Update orientation if provided
    if (typeof params.isPortrait === 'boolean') {
      this._state.isPortrait = params.isPortrait
      if (this.elements.orientationText) {
        this.elements.orientationText.textContent = this._state.isPortrait ? 'Portrait' : 'Landscape'
      }
      changed = true
    }

    // Update dark mode if provided
    if (typeof params.isDarkMode === 'boolean') {
      this._state.isDarkMode = params.isDarkMode
      if (this.elements.darkModeText) {
        this.elements.darkModeText.textContent = this._state.isDarkMode ? 'Dark Mode' : 'Light Mode'
      }
      changed = true
    }

    if (changed) {
      this._updateResetButton()
    }

    if (changed && origin) {
      this._emitChangeEvent(origin)
    }

    return changed
  }

  get state() {
    return { ...this._state, };
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
    this._state = null
  }
}

export default TRMNLPicker
