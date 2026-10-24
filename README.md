# chalk.

A keyboard-first todo list for macOS. It lives in your menu bar and opens as a
floating panel over whatever you're doing, like Spotlight.

**[Download Chalk.dmg →](../../releases/latest/download/Chalk.dmg)**

**Website: [cautiously-founded.github.io/chalk-releases](https://cautiously-founded.github.io/chalk-releases/)**

This repository only hosts the downloads. The source code is private.

---

## Install

1. Download [`Chalk.dmg`](../../releases/latest/download/Chalk.dmg). It works on
   both Apple Silicon and Intel Macs, on macOS 15 (Sequoia) or later. Every
   version is on the [releases page](../../releases).
2. Open the `.dmg` and drag **Chalk** into **Applications**.
3. Open Chalk from Applications, and allow notifications when asked, so
   deadlines and reminders can reach you.

Chalk is signed with a Developer ID and notarized by Apple (from 4.0.4), so
macOS opens it without a warning. Updates are signed too, and Chalk only
installs ones that come from me.

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
| `https://…` or `link: …` | **Link.** Shown as a link icon on the todo. Click it, or press `⌘Enter`, to open it. |

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
| `⌘Enter` | Open the todo's link |
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
- **Highlight commands:** tint deadlines, reminders, priorities and tags as you type.
- **Notification sound:** on or off.
- **Footer:** show or hide the shortcut hints.
- **Dock:** show Chalk in the Dock and ⌘Tab, not only the menu bar. Takes effect as soon as it's toggled.
- **Launch at login:** open Chalk in the menu bar when you log in.
- **Shortcuts:** change the two shortcuts that work from any app (`⌘⇧K` and `⌘⇧J` by default).

### Menu bar

The menu bar icon's menu has **Open**, **Add Task** and **Open Scratchpad**, each with its
shortcut, then **Check for Updates…** and **Quit**. The icon shows a badge with the number of overdue todos.

---

## Updating

Chalk updates itself: once a day it checks for a new version, and downloads
and installs it in the background, with nothing to click. It waits until
Chalk's window is closed. You can also check any time with **Check for
Updates…** in its menu bar menu. Your todos and settings are kept.

Versions before 4.0.3 ask once before installing; after that, updates are
automatic. If Chalk was installed by another account on your Mac, macOS asks
for an administrator's password to update it, and Chalk tells you why first.

If you have Chalk 4.0.0, update by hand this once: quit Chalk, download the
latest `.dmg` and drag Chalk into Applications, replacing the old one. 4.0.0
can't update itself, and may not open on some Macs.

## Backups

Chalk copies your todos to
`~/Library/Application Support/com.cautiouslyfound.chalk/Backups` once a day
and before any update that changes how they're stored. If your todos ever
can't be opened, Chalk offers to restore the latest copy.

**Coming from Chalk 3:** the first time Chalk 4 opens, it copies your todos,
reminders, settings and scratchpad over from Chalk 3 by itself. Chalk 3's data
is left as it was.

## Uninstalling

Quit Chalk from its menu bar icon, then delete it from Applications. To also
remove your todos and settings, delete this folder:
`~/Library/Application Support/com.cautiouslyfound.chalk`

If you used Chalk 3, also delete `com.cautiouslyfound.chalkv3` in the same place.

---

© 2026 CautiouslyFound. All rights reserved. Chalk is free to download and use,
but it may not be redistributed or modified.
