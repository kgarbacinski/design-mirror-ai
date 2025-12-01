# 🔍 Two-Pass Debug Method

## Problem Rozwiązany!

Popup blokuje interakcję ze stroną, więc nie możesz kliknąć mode switcher podczas debugowania.

## ✅ Rozwiązanie: Analiza PRZED i PO

Extension teraz loguje **kompletny snapshot DOM** przy każdej analizie.

---

## 📋 Kroki:

### 1. Otwórz stronę + DevTools
```
1. Otwórz https://caspercooks.tech
2. F12 → Console
3. NIE KLIKAJ jeszcze mode switcher
```

### 2. Pierwsza Analiza (PRZED zmianą)
```
1. Kliknij DesignMirror icon
2. Kliknij "Analyze This Page"
3. Poczekaj aż się skończy
4. ZAMKNIJ popup (Extension zostaje załadowany w tle)
```

**W Console zobaczysz:**
```
[ThemeSwitcherAnalyzer] 📸 DOM SNAPSHOT
  🏷️  HTML data-* attributes: {...}
  🎨 HTML classes: [...]
  🏷️  BODY data-* attributes: {...}
  🎨 BODY classes: [...]
  💾 localStorage: {...}
  🔘 Potential mode/theme buttons: [...]
  🎨 CSS Custom Properties: {...}
```

### 3. Kliknij Mode Switcher
```
Teraz możesz kliknąć przycisk, który zmienia developer/founder mode
```

### 4. Druga Analiza (PO zmianie)
```
1. Kliknij DesignMirror icon ponownie
2. Kliknij "Analyze This Page"
3. Poczekaj aż się skończy
```

**W Console zobaczysz drugi snapshot**

### 5. Porównaj Output w Console
```
Przewiń Console w górę i porównaj:
- Pierwszy snapshot (przed kliknięciem)
- Drugi snapshot (po kliknięciu)
```

---

## 🔎 Co Sprawdzić:

### Scenariusz A: data-* attribute się zmienia
**Przed:**
```
🏷️  HTML data-* attributes: { "data-mode": "developer" }
```

**Po:**
```
🏷️  HTML data-* attributes: { "data-mode": "founder" }
```

✅ **SUKCES!** Extension POWINIEN to wykryć. Jeśli nie wykrywa, to jest bug w detektorze.

---

### Scenariusz B: Class się zmienia
**Przed:**
```
🎨 HTML classes: ["mode-developer", "other-class"]
```

**Po:**
```
🎨 HTML classes: ["mode-founder", "other-class"]
```

✅ **SUKCES!** Extension POWINIEN to wykryć.

---

### Scenariusz C: localStorage się zmienia
**Przed:**
```
💾 localStorage: { "mode": "developer", ... }
```

**Po:**
```
💾 localStorage: { "mode": "founder", ... }
```

✅ **SUKCES!** Extension POWINIEN to wykryć.

---

### Scenariusz D: CSS Variables się zmieniają
**Przed:**
```
🎨 CSS Custom Properties:
{
  "--primary-color": "rgb(0, 255, 136)",
  "--bg-color": "rgb(26, 26, 26)"
}
```

**Po:**
```
🎨 CSS Custom Properties:
{
  "--primary-color": "rgb(255, 107, 53)",
  "--bg-color": "rgb(245, 245, 245)"
}
```

✅ **Możliwe do wykrycia** przez CSS Variable analyzer.

---

### Scenariusz E: NIC się nie zmienia
**Przed:**
```
🏷️  HTML data-* attributes: None found
🎨 HTML classes: ["static-class"]
💾 localStorage: Empty
🎨 CSS Custom Properties: {...same values...}
```

**Po:**
```
🏷️  HTML data-* attributes: None found
🎨 HTML classes: ["static-class"]
💾 localStorage: Empty
🎨 CSS Custom Properties: {...same values...}
```

❌ **NIEMOŻLIWE DO WYKRYCIA**
→ Strona używa **pure React state** bez DOM changes
→ Extension NIE MOŻE tego wykryć (brak zmian w DOM)

---

## 📤 Co Mi Wysłać

Skopiuj **oba snapshoty** z Console i wyślij:

```
SNAPSHOT 1 (PRZED):
[ThemeSwitcherAnalyzer] 📸 DOM SNAPSHOT
  🏷️  HTML data-* attributes: ...
  ... cały output ...

SNAPSHOT 2 (PO):
[ThemeSwitcherAnalyzer] 📸 DOM SNAPSHOT
  🏷️  HTML data-* attributes: ...
  ... cały output ...
```

Lub po prostu powiedz:
- "data-mode zmienia się z 'developer' na 'founder'"
- "class zmienia się na <html>"
- "localStorage klucz 'mode' się zmienia"
- "nic się nie zmienia w DOM"

---

## 💡 Dlaczego To Działa?

1. **Extension loguje snapshot PODCZAS analizy**
2. **NIE musisz klikać podczas gdy popup jest otwarty**
3. **Możesz zamknąć popup i swobodnie klikać**
4. **Uruchom analizę ponownie = nowy snapshot**
5. **Porównaj snapshoty w Console history**

---

## 🚀 Build Nowej Wersji

```bash
npm run build
```

Potem:
1. `chrome://extensions/`
2. Find "DesignMirror"
3. Click "Reload" (↻)

---

## ✅ Ready!

**Build:** 53.5 KB (szacowane)
**Feature:** Automatic DOM snapshot logging
**Status:** READY FOR TESTING

Przetestuj i wyślij wyniki! 🎯
