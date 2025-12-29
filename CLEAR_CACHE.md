# Emergency Fix: Clear AutoMaker Cache

The "play is not defined" error might be caused by CORRUPTED LOCALSTORAGE from the migration.

## Option 1: Clear Electron User Data (RECOMMENDED)

```bash
# Close AutoMaker completely first, then:
rm -rf ~/.config/Automaker/Local\ Storage/
rm -rf ~/.config/Automaker/Session\ Storage/

# Restart AutoMaker
npm run dev:electron:debug
```

## Option 2: Clear via Electron API

If AutoMaker loads at all:

1. Press F12 to open DevTools (try multiple times)
2. Go to Console
3. Type: `localStorage.clear()` and press Enter
4. Type: `sessionStorage.clear()` and press Enter
5. Reload the app (Ctrl+R or Cmd+R)

## Option 3: Nuclear - Delete All Config

```bash
# BACKUP FIRST
cp -r ~/.config/Automaker ~/.config/Automaker.backup

# Delete everything
rm -rf ~/.config/Automaker

# Restart (will be like fresh install)
npm run dev:electron:debug
```

## WHY THIS MIGHT WORK

The Executive Suite migration changed the persisted state structure. Old localStorage might have:

- Old `bmm-triad` references
- Corrupted `boardBackgroundByProject` object
- Invalid state that's breaking during hydration

Clearing it forces AutoMaker to start fresh with clean state.
