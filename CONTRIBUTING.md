# Contributing to DesignMirror

First off, thank you for considering contributing to DesignMirror! 🎉

It's people like you that make DesignMirror such a great tool. We welcome contributions from everyone, whether it's:

- 🐛 Reporting a bug
- 💡 Discussing the current state of the code
- 📝 Submitting a fix
- 🚀 Proposing new features
- 📖 Improving documentation
- 🎨 Designing better UI/UX

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests Process

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests (when testing is set up)
3. Ensure the build passes with `npm run build`
4. Ensure your code type-checks with `npm run type-check`
5. Make sure your code follows the existing style
6. Issue that pull request!

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/design-mirror.git
cd design-mirror
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Branch

```bash
git checkout -b feature/my-new-feature
# or
git checkout -b fix/bug-description
```

### 4. Make Your Changes

Follow the code style and structure that's already in place:

**Code Organization:**
- **Analyzers** go in `content/analyzers/`
- **Generators** go in `content/generators/`
- **UI Components** go in `popup/components/`
- **Shared types** go in `shared/types/`
- **Utilities** go in appropriate `utils/` folders

**TypeScript Best Practices:**
- Use strict types (no `any` unless absolutely necessary)
- Define interfaces for all props and data structures
- Use descriptive variable and function names
- Add JSDoc comments for complex logic

**Component Guidelines:**
- Keep components small and focused
- Use functional components with hooks
- Extract reusable logic into custom hooks
- Keep styling in CSS files, not inline

### 5. Test Your Changes

```bash
# Build the extension
npm run build

# Load it in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the build/ folder

# Test on multiple websites:
# - Simple sites (example.com)
# - Complex sites (stripe.com, github.com)
# - Sites with shadow DOM
```

### 6. Commit Your Changes

We use conventional commits for clear history:

```bash
# Format: <type>(<scope>): <description>

# Examples:
git commit -m "feat(analyzer): add CSS Grid layout detection"
git commit -m "fix(popup): resolve color display bug"
git commit -m "docs(readme): update installation steps"
git commit -m "refactor(utils): improve DOM walker performance"
git commit -m "style(components): fix button spacing"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (white-space, formatting)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding missing tests
- `chore`: Changes to build process or auxiliary tools

### 7. Push and Create PR

```bash
git push origin feature/my-new-feature
```

Then open a Pull Request on GitHub with:

**Title**: Clear, concise description (e.g., "Add CSS Grid analysis support")

**Description template:**
```markdown
## What does this PR do?
Brief description of changes

## Why is this needed?
Explanation of the problem this solves

## How to test?
1. Step-by-step testing instructions
2. Expected results

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code builds without errors
- [ ] Type checking passes
- [ ] Tested on multiple websites
- [ ] Documentation updated (if needed)
```

## Areas for Contribution

### 🐛 Good First Issues

Look for issues tagged with `good first issue`:
- Documentation improvements
- UI/UX tweaks
- Simple bug fixes
- Adding examples

### 🚀 Feature Ideas

Current areas we'd love help with:

**Analyzers:**
- [ ] CSS Grid/Flexbox layout patterns
- [ ] Animation and transition detection
- [ ] Responsive breakpoint detection
- [ ] Dark mode color schemes
- [ ] Accessibility analysis (contrast ratios, ARIA)

**Generators:**
- [ ] Export to Figma tokens format
- [ ] Export to Tailwind config
- [ ] Export to CSS-in-JS (styled-components, emotion)
- [ ] Generate Storybook stories

**UI Improvements:**
- [ ] Dark mode for popup
- [ ] Better visualization of color palettes
- [ ] Interactive component preview
- [ ] Analysis history with search/filter

**Browser Support:**
- [ ] Firefox extension
- [ ] Edge extension (Chromium-based, should be easy)
- [ ] Safari extension

### 🏗️ Technical Improvements

- [ ] Unit tests with Jest
- [ ] E2E tests with Playwright
- [ ] Performance benchmarks
- [ ] CI/CD with GitHub Actions
- [ ] Automated releases

## Code Style

We use TypeScript with strict mode. Here are some guidelines:

```typescript
// ✅ Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ variant, onClick }) => {
  return <button className={`btn-${variant}`} onClick={onClick} />;
};

// ❌ Bad
export const Button = ({ variant, onClick }: any) => {
  return <button className={`btn-${variant}`} onClick={onClick} />;
};
```

```typescript
// ✅ Good - descriptive names
const detectModularScale = (fontSizes: number[]): ScaleInfo | null => {
  // Implementation
};

// ❌ Bad - unclear names
const detect = (sizes: any) => {
  // Implementation
};
```

## Architecture Overview

Understanding the extension structure helps with contributions:

```
Message Flow:
Popup (React) → Background (Service Worker) → Content Script → DOM

Analysis Flow:
1. DOMWalker traverses elements
2. StyleCache optimizes style lookups
3. Analyzers extract patterns
4. Generators create prompts
5. Results sent back to popup
```

**Key Components:**

- **DOMWalker** (`content/utils/dom-walker.ts`): Efficient DOM traversal
- **StyleCache** (`content/utils/style-cache.ts`): Caches computed styles
- **Analyzers** (`content/analyzers/*`): Extract design patterns
- **Generators** (`content/generators/*`): Create output formats

## Performance Considerations

When contributing, keep performance in mind:

- Use `StyleCache` for all style lookups
- Batch DOM operations
- Use `requestIdleCallback` for heavy processing
- Avoid layout thrashing
- Profile your changes on large pages (1000+ elements)

## Documentation

If you're adding a new feature:

1. Add JSDoc comments to functions
2. Update README.md if it's user-facing
3. Add examples in code comments
4. Update CHANGELOG.md

```typescript
/**
 * Detects if font sizes follow a modular scale
 *
 * @param sizes - Array of font sizes in pixels
 * @param tolerance - Acceptable deviation from perfect ratio (default: 0.05)
 * @returns Scale info with ratio and confidence, or null if no scale detected
 *
 * @example
 * const scale = detectModularScale([12, 16, 20, 25]);
 * // Returns: { ratio: 1.25, confidence: 0.9 }
 */
export function detectModularScale(
  sizes: number[],
  tolerance: number = 0.05
): ScaleInfo | null {
  // Implementation
}
```

## Questions?

Feel free to:
- Open an issue for discussion
- Ask in GitHub Discussions
- Reach out on Twitter

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to make DesignMirror better! 🎉

### Examples of behavior that contributes to a positive environment:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Thank you for contributing! 🙏
