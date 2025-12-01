# 🎯 DesignMirror v1.4 - DOM Snapshot Debug

## Problem Który Rozwiązaliśmy

**User reported:** "Nie moge tego sprawdzic sposobem 1, bo popup blokuje mi interkatywnosc ze strona"

Extension popup blokuje interakcję ze stroną, co uniemożliwia ręczne debugowanie mode switcherów.

---

## ✅ Rozwiązanie: Automatic DOM Snapshot Logging

Extension teraz **automatycznie loguje pełny snapshot DOM** do Console przy każdej analizie.

### Co Jest Logowane:

1. **HTML data-* attributes** - wszystkie na `<html>` i `<body>`
2. **HTML/Body classes** - wszystkie CSS classes
3. **localStorage** - wszystkie klucze i wartości
4. **Potential buttons** - wszystkie przyciski z theme/mode keywords
5. **CSS Custom Properties** - wszystkie CSS variables związane z themingiem

---

## 🔧 Technical Changes

### File: `content/analyzers/theme-switcher-analyzer.ts`

#### Added Method: `logDOMSnapshot()`

```typescript
/**
 * Log complete DOM snapshot for debugging
 * This helps identify what actually changes when mode is switched
 */
private logDOMSnapshot(): void {
  console.group('[ThemeSwitcherAnalyzer] 📸 DOM SNAPSHOT');

  // 1. HTML data-* attributes
  // 2. HTML classes
  // 3. Body data-* attributes
  // 4. Body classes
  // 5. localStorage
  // 6. Potential theme/mode buttons
  // 7. CSS custom properties

  console.log('💡 TIP: Run analysis TWICE:');
  console.log('   1. Before clicking mode switcher');
  console.log('   2. After clicking mode switcher');
  console.log('   3. Compare the two snapshots above to see what changed!');

  console.groupEnd();
}
```

#### Modified Method: `analyze()`

```typescript
public async analyze(): Promise<ThemeSwitcherPattern[]> {
  console.log('[ThemeSwitcherAnalyzer] Starting theme detection...');
  console.log('[ThemeSwitcherAnalyzer] ========================================');

  // FIRST: Log complete DOM snapshot for debugging
  this.logDOMSnapshot(); // ← NEW!

  // ... existing detection logic ...

  console.log('[ThemeSwitcherAnalyzer] ========================================');
  console.log('[ThemeSwitcherAnalyzer] Total patterns found:', patterns.length);
  return patterns;
}
```

---

## 📊 Console Output Example

```
[ThemeSwitcherAnalyzer] 📸 DOM SNAPSHOT
  🏷️  HTML data-* attributes:
    { "data-mode": "developer", "data-theme": "dark" }

  🎨 HTML classes:
    ["mode-developer", "dark-theme", "other-class"]

  🏷️  BODY data-* attributes:
    None found

  🎨 BODY classes:
    []

  💾 localStorage:
    { "mode": "developer", "theme": "dark", "user": "..." }

  🔘 Potential mode/theme buttons:
    Button #3: {
      tagName: "BUTTON",
      text: "Switch to Founder Mode",
      className: "mode-toggle-btn",
      id: "mode-switcher",
      ariaLabel: "Toggle between developer and founder mode",
      dataAttributes: "data-action=\"toggle-mode\""
    }

  🎨 CSS Custom Properties:
    Found 8 theme-related CSS variables: {
      "--primary-color": "rgb(0, 255, 136)",
      "--bg-color": "rgb(26, 26, 26)",
      "--text-color": "rgb(255, 255, 255)",
      ...
    }

💡 TIP: Run analysis TWICE:
   1. Before clicking mode switcher
   2. After clicking mode switcher
   3. Compare the two snapshots above to see what changed!
```

---

## 🎯 Usage Workflow

### Step 1: First Analysis (BEFORE)
1. Open https://caspercooks.tech
2. Open DevTools (F12) → Console tab
3. Click DesignMirror icon → "Analyze This Page"
4. **Close popup** (extension stays loaded)

### Step 2: Click Mode Switcher
5. Now you can interact with the page!
6. Click the developer/founder mode button

### Step 3: Second Analysis (AFTER)
7. Click DesignMirror icon again → "Analyze This Page"
8. New snapshot is logged to Console

### Step 4: Compare
9. Scroll up in Console
10. Compare "SNAPSHOT 1" vs "SNAPSHOT 2"
11. See exactly what changed!

---

## 🔍 Possible Outcomes

### ✅ Detectable Changes

If you see changes in:
- `data-*` attributes → Extension **SHOULD** detect it
- CSS classes → Extension **SHOULD** detect it
- localStorage → Extension **SHOULD** detect it
- CSS variables → Extension **CAN** detect it

### ❌ Undetectable Changes

If **nothing changes** in DOM:
- Pure React state (no DOM changes)
- Inline style changes only
- JavaScript-only state management

→ Extension **CANNOT** detect these (no DOM evidence)

---

## 📦 Build Info

**Version:** 1.4
**Build Size:** 55 KB content script
**Status:** ✅ READY FOR TESTING

**Build Command:**
```bash
npm run build
```

**Reload Extension:**
```
chrome://extensions/ → Find "DesignMirror" → Click Reload (↻)
```

---

## 📤 Next Steps

User should:
1. Reload extension
2. Follow TWO_PASS_DEBUG.md guide
3. Run analysis twice (before/after clicking mode switcher)
4. Send both snapshots from Console

This will reveal:
- What actually changes in the DOM
- Whether the change is detectable
- If detectable but not detected = analyzer bug
- If nothing changes = pure JS state (undetectable)

---

## 🎓 Why This Works

**Problem:** Popup blocks page interaction
**Solution:** Snapshot logs DURING analysis (popup can be closed)

**Workflow:**
```
Analyze → Snapshot logged → Close popup → Click button → Analyze again → New snapshot
                              ↑
                         Can interact with page!
```

**Result:** Two snapshots in Console history for comparison!

---

**Created:** 2025-12-01
**By:** Claude Code
**Issue:** caspercooks.tech mode switcher not detected
**Status:** Awaiting user testing
