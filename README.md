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

Chalk lives in the menu bar, with no Dock icon unless you turn on **Show in
Dock** in Settings.

- **`⌘⇧K`** opens or hides Chalk from anywhere.
- **`⌘⇧J`** opens it straight to the scratchpad.
- Type a todo and press `Enter`. You can add `friday 5pm` (deadline),
  `remind 4pm` (reminder), `daily` / `weekly` / `monthly` (repeat), `p1`–`p3`
  (priority) and `#tags`, anywhere in the text.
- Press **`⌘H`** in the app for every shortcut.

---

## Features & shortcuts

### Writing a todo

Type a todo and press `Enter`. Any of these can go anywhere in the text:

| Type | What it does |
| --- | --- |
| `friday 5pm` | **Deadline.** Shown as a countdown badge, coloured by how soon it is. You're notified based on Settings. |
| `remind 4pm` | **Reminder.** A notification at that time. |
| `daily` / `weekly` / `monthly` | **Repeat.** Needs a deadline. When the deadline passes, the todo comes back with the next one. |
| `p1` `p2` `p3` | **Priority.** Shown as a coloured bar. |
| `#work` | **Tag,** up to two per todo. `Tab` completes tags you've used before. |

Example: `pay rent friday 5pm remind 9am p1 weekly #home`

While typing, `⌥←` / `⌥→` jump over a command and `⌥⌫` deletes it in one go.

### Shortcuts

| Keys | Action |
| --- | --- |
| **Anywhere on your Mac** | |
| `⌘⇧K` | Open or hide Chalk |
| `⌘⇧J` | Open Chalk on the scratchpad, or hide it |
| **Todos** | |
| `↑` `↓` | Move between todos |
| `Enter` | Edit |
| `Space` | Complete |
| `⌘P` | Pin to the top |
| `⌘D` | Delete |
| `⌘Z` | Undo delete |
| **Moving around** | |
| `⌥↑` `⌥↓` | Jump between sections |
| `⌘1`–`⌘4` | Switch view: All / Day / Priority / Tags |
| `⌘K` | Open or close search |
| **App** | |
| `⌘J` | Show or hide the scratchpad |
| `⌘S` | Open or close settings |
| `⌘H` | Open or close help |
| `⌘+` `⌘−` / `⌘0` | Font size up, down / reset |
| `Esc` | Close whatever's open, then hide Chalk |

### Views

- **All:** one list.
- **Day:** grouped into Overdue, Today, Tomorrow, This Week, Next Week, Later and No deadline.
- **Priority:** grouped into Pinned, Overdue, and Priority 1 to 3.
- **Tags:** grouped by tag.

Completed todos go to the bottom (or a Completed section). Pinned todos stay at the top. With more than one section, a rail on the left lists them for jumping. The view you pick is remembered.

### Notifications

Deadlines and reminders arrive as macOS notifications with buttons:

- **Complete:** marks the todo done.
- **Remind me in 15 min / 30 min / 1 hour:** only offered if that's still before the deadline.
- **Extend 15 min / 30 min / 1 hour:** moves the deadline; offered once it has passed.
- **Clicking the notification:** opens Chalk on that todo.

Several notifications due at once arrive one after another. A todo only ever shows its latest notification: a newer one replaces the older one. Completing a todo clears its reminders.

### Scratchpad

A notepad that slides out on the right (`⌘J`, the notepad icon at the top right, or `⌘⇧J` from anywhere). It saves as you type. `Esc` closes it and puts you back in the new todo field.

### Settings

`⌘S` or the gear icon. Use `↑` `↓` to move, and `Space` or `Enter` to select.

- **Appearance:** System, Light or Dark.
- **Font size:** 12 to 20px.
- **Deadline notifications:** at the deadline, a set time before it, both, or none.
- **Notification sound:** on or off.
- **Footer:** show or hide the shortcut hints.
- **Dock:** show Chalk in the Dock and ⌘Tab, not only the menu bar. Takes effect as soon as it's toggled.

### Menu bar

The menu bar icon opens Chalk or quits it, and shows a badge with the number of overdue todos.

---

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
