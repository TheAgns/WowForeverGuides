# WoW Forever Field Guides

1–60 leveling guides for World of Warcraft: Forever with checklists that remember your progress.

- `index.html` – start page listing every guide with each visitor's progress
- `guides/paladin.html` – Human Protection Paladin
- `guides/warlock.html` – Gnome / Human Affliction Warlock
- `guides/druid.html` – Night Elf Druid (Cat, Bear and Balance)
- `guides/mage.html` – Gnome Frost Mage
- `guides/hunter.html` – Night Elf Beast Mastery Hunter
- `assets/progress.js` – shared saving, reset, export and import

## Host it on GitHub Pages

1. Create a new repository on GitHub and push this folder to it.
2. In the repository go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

## How progress is saved

Progress is stored with `localStorage` in each visitor's own browser.

- Every person who opens the site has their own separate checkmarks. Nobody sees anyone else's progress, and nothing is sent to GitHub or any server.
- Progress stays when the visitor closes the tab, restarts the browser or when you push an update to the guides.
- Progress does **not** follow a person to another device or browser, and it is lost if they clear site data or browse in a private window.
- To move progress, open the guide and use **Save or move your progress** at the bottom: download a backup file or copy a backup code, then import it on the other device.

All pages on `<username>.github.io` share one storage area, so each guide uses its own key.

## Add a new guide

1. Copy an existing guide into `guides/`.
2. On its `<body>` set unique values:
   ```html
   <body data-guide="priest" data-storage-key="wow-forever-priest-guide-v1" data-guide-title="Shadow Priest 1–60">
   ```
3. Give every checkbox a unique `data-task="..."` attribute.
4. Keep the elements `#progressfill`, `#progresslabel` and `#reset-btn` if you want the sidebar bar and reset button.
5. Load `<script src="../assets/progress.js"></script>` after the checkboxes exist (end of the page).
6. Add the guide to the `GUIDES` list in `index.html`.

Don't rename a `data-task` or a storage key after people start using a guide, or their saved checkmarks won't match anymore.
