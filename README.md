# 🪞 DesignMirror

A Chrome extension that analyzes design systems from any website and generates AI-ready prompts with CSS/HTML snippets.

## Features

- Extract color palettes with role detection (primary, secondary, neutrals, semantic)
- Analyze typography systems (font families, type scales, modular ratios)
- Detect spacing patterns and base units
- Identify UI components (buttons, cards, forms, navigation)
- Generate hybrid prompts (natural language + code snippets)
- Export results as JSON
- History of analyzed pages

## Development

### Setup

```bash
# Install dependencies
npm install

# Development mode (watch)
npm run dev

# Production build
npm run build

# Type check
npm run type-check

# Package for Chrome Web Store
npm run package
```

### Loading the Extension

1. Run `npm run build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `build` folder

## Project Structure

```
design-mirror/
├── background/          # Service worker
├── content/            # Content script & analyzers
│   ├── analyzers/      # Design system analyzers
│   ├── utils/          # DOM walker, cache
│   └── generators/     # Prompt & code generators
├── popup/              # React UI
│   ├── components/     # React components
│   └── styles/         # CSS
├── shared/             # Shared types & utilities
└── icons/              # Extension icons
```

## Technologies

- Manifest V3
- TypeScript
- React
- Webpack

## License

MIT
