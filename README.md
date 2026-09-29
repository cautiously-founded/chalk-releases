# chalk.

A keyboard-first todo list for macOS. It lives in your menu bar and opens as a
floating panel over whatever you're doing, like Spotlight.

**[Download the latest version →](../../releases/latest)**

This repository only hosts the downloads. The source code is private.

---

## Install

1. Download `Chalk_<version>_universal.dmg` from the
   [latest release](../../releases/latest). It works on both Apple Silicon and
   Intel Macs.
2. Open the `.dmg` and drag **Chalk** into **Applications**.
3. Open Chalk from Applications. macOS will block it the first time (see below).
4. Go to **System Settings → Privacy & Security**, scroll to the bottom, and
   next to *"Chalk" was blocked to protect your Mac*, click **Open Anyway**.
   Confirm with your password or Touch ID.
5. Allow notifications when asked, so deadlines and reminders can reach you.

You only need to do step 4 once. After that Chalk opens normally.

### Why macOS blocks it

Apple only trusts apps from developers who pay for an Apple Developer account
($99 a year) and have each version checked by Apple ("notarized"). I'm a
student and can't justify that cost for a free app, so Chalk isn't notarized,
and macOS warns you about it.

That warning means Apple hasn't checked the app. It doesn't mean anything is
wrong with it. If I get a developer account in the future, this step will go
away.

### If macOS says Chalk "is damaged and can't be opened"

This can happen on some macOS versions with apps that aren't notarized. Open
**Terminal** and run:

```sh
xattr -cr /Applications/Chalk.app
```

Then open Chalk again. The command removes the "downloaded from the internet"
flag that triggers the check.

---

## Getting started

Chalk has no Dock icon. It lives in the menu bar.

- **`⌘⇧K`** opens or hides Chalk from anywhere.
- **`⌘⇧J`** opens it straight to the scratchpad.
- Type a todo and press `Enter`. You can add `friday 5pm` (deadline),
  `remind 4pm` (reminder), `daily` / `weekly` / `monthly` (repeat), `p1`–`p3`
  (priority) and `#tags`, anywhere in the text.
- Press **`⌘H`** in the app for every shortcut.

## Updating

Download the new `.dmg` and drag Chalk into Applications again, replacing the
old one. Your todos and settings are kept.

## Uninstalling

Quit Chalk from its menu bar icon, then delete it from Applications. To also
remove your todos and settings, delete this folder:
`~/Library/Application Support/com.cautiouslyfound.chalkv3`

---

© 2026 cautiouslyfound. All rights reserved. Chalk is free to download and use,
but it may not be redistributed or modified.
