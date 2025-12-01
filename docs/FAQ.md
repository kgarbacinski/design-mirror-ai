# Frequently Asked Questions

## General Questions

### What is DesignMirror?

DesignMirror is a Chrome extension that analyzes any website's design system and generates AI-ready prompts with CSS variables, component examples, and design tokens.

### Is it free?

Yes! DesignMirror is completely free and open source under the MIT license.

### Does it work on all websites?

DesignMirror works on most websites, but:
- ✅ Works: Regular websites, SPAs, most modern web apps
- ❌ Doesn't work: Chrome internal pages (`chrome://`), some heavily protected sites
- ⚠️ Limited: Sites with lots of iframes, canvas-based content

### How accurate is the analysis?

DesignMirror uses advanced algorithms (K-means clustering, perceptual color distance, modular scale detection) to provide highly accurate results. However, it's an automated tool - always review the output.

### Can I use the generated prompts commercially?

Yes! The output belongs to you. Use it however you want.

## Usage Questions

### How do I analyze a page?

1. Navigate to any website
2. Click the DesignMirror icon in Chrome toolbar
3. Click "Analyze This Page"
4. Wait 5-15 seconds
5. Copy the prompt or export as JSON

### Why is the analysis slow?

Analysis time depends on:
- Page complexity (number of elements)
- Your computer's performance
- Page load state

Typical analysis times:
- Simple pages: 2-5 seconds
- Medium pages: 5-10 seconds
- Complex pages: 10-20 seconds

### What data is collected?

**None!** DesignMirror:
- ✅ Analyzes pages locally in your browser
- ✅ Never sends data to external servers
- ✅ No analytics or tracking
- ✅ Privacy-focused

### Can I analyze private/internal websites?

Yes! Since all analysis happens locally, you can analyze:
- Localhost websites
- Internal company tools
- Password-protected sites
- Any page you can view in Chrome

## Technical Questions

### What browsers are supported?

Currently:
- ✅ Chrome (90+)
- ✅ Chromium-based browsers (Edge, Brave, Opera)
- ❌ Firefox (planned)
- ❌ Safari (maybe in future)

### Does it work with Shadow DOM?

Yes! DesignMirror recursively traverses Shadow DOM to analyze components.

### What CSS properties are analyzed?

DesignMirror extracts 40+ CSS properties including:
- Colors (text, background, borders)
- Typography (font-family, size, weight, line-height)
- Spacing (margin, padding, gap)
- Borders (width, style, radius)
- Shadows (box-shadow, text-shadow)
- Layout (display, position, etc.)

### How does color clustering work?

DesignMirror uses K-means clustering with perceptual color distance (Delta E in LAB color space) to group similar colors. Colors with Delta E < 10 are considered similar.

### What is modular scale detection?

Modular scale is a typographic system where font sizes follow a mathematical ratio (e.g., 1.25 = Major Third, 1.618 = Golden Ratio). DesignMirror detects if a site uses this pattern.

## Troubleshooting

### "Cannot establish connection" error

This usually means the content script isn't loaded. Try:
1. Refresh the page you want to analyze
2. Close and reopen the popup
3. Reload the extension in `chrome://extensions/`

### "Cannot analyze browser internal pages" error

You're trying to analyze a `chrome://` page. Navigate to a regular website instead.

### Analysis gets stuck at XX%

1. Close the popup
2. Refresh the page
3. Try again
4. If it persists, report an issue on GitHub

### Results look wrong/incomplete

Some possibilities:
- Page uses canvas or images for design elements
- Page is still loading
- Page has dynamic content
- Try analyzing after page fully loads

### Extension icon doesn't appear

1. Check if extension is enabled in `chrome://extensions/`
2. Look for the puzzle piece icon → pin DesignMirror
3. Reload the extension

### Copy to clipboard doesn't work

Some browsers require secure context (HTTPS). Try:
1. Use "Download JSON" instead
2. Check browser permissions
3. Update Chrome to latest version

## Feature Requests

### Can you add [feature X]?

Check if it's already requested in [GitHub Issues](https://github.com/kgarbacinski/design-mirror/issues). If not, create a feature request! We love feedback.

### Commonly requested features:

- [ ] **Analysis history** - Coming soon!
- [ ] **Export to Figma** - Planned
- [ ] **Export to Tailwind config** - Investigating
- [ ] **Dark mode** - Planned
- [ ] **Firefox support** - Need help!
- [ ] **API access** - Future consideration

### Can I contribute?

Absolutely! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## AI Integration

### Which AI tools work best?

DesignMirror prompts work with:
- ✅ Claude (Anthropic) - Recommended
- ✅ ChatGPT (OpenAI)
- ✅ Gemini (Google)
- ✅ Most LLMs that understand CSS/HTML

### How do I use the prompt with AI?

1. Copy the prompt from DesignMirror
2. Paste into your AI tool
3. Add specific instructions like:
   - "Create a button component using these design tokens"
   - "Generate a color scheme based on this palette"
   - "Build a landing page with this spacing system"

### Example AI prompts:

```
[Paste DesignMirror output]

Based on this design system, please:
1. Create a React button component with primary/secondary variants
2. Use the CSS variables provided
3. Match the spacing and typography scales
```

## Performance

### Why does DesignMirror use caching?

Calling `getComputedStyle()` is slow (5-10ms per element). DesignMirror caches results in a WeakMap, providing 10x speedup.

### How much memory does it use?

Typical usage:
- Small pages: 5-10 MB
- Large pages: 20-50 MB

Memory is freed when you close the popup.

### Does it affect page performance?

No! Analysis happens in an idle callback, so:
- ✅ Non-blocking
- ✅ Doesn't freeze the page
- ✅ Uses spare CPU cycles
- ✅ Automatically paused if user interacts

## Privacy & Security

### Is my data safe?

Yes! DesignMirror:
- Never sends data externally
- No server-side processing
- No analytics
- No cookies
- Open source (you can audit the code)

### What permissions does it need?

- `activeTab` - Access to current tab when clicked
- `storage` - Local storage for future history feature
- `clipboardWrite` - Copy prompts to clipboard
- `scripting` - Inject content script
- `host_permissions` - Analyze any website

### Can it access my passwords/personal data?

No! DesignMirror only reads:
- Computed styles (CSS)
- Element structure (DOM)
- Visible content

It does NOT access:
- ❌ Form data
- ❌ Passwords
- ❌ Cookies
- ❌ Local storage
- ❌ Network requests

## Contact & Support

### Where can I get help?

- 🐛 **Bugs**: [GitHub Issues](https://github.com/kgarbacinski/design-mirror/issues)
- 💡 **Features**: [GitHub Discussions](https://github.com/kgarbacinski/design-mirror/discussions)

### How can I support the project?

- ⭐ Star on GitHub
- 🔀 Contribute code
- 📣 Share with others
- 💬 Write a review
- 📝 Write a blog post
- 🐛 Report bugs

---

**Didn't find your answer?** [Ask on GitHub Discussions](https://github.com/kgarbacinski/design-mirror/discussions/new)
