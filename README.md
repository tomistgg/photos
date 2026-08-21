# Tomás Schiter — tennis photography portfolio

A responsive, image-first portfolio presenting 123 tennis photographs.

Open `index.html` to view the site. No dependencies or build step are required.

## Photograph files

All portfolio slots are defined in `assets/js/tennis-photos.js`.

- `assets/images/web/` contains the optimized 2400px photographs used by the fullscreen viewer.
- `assets/images/responsive/480/` and `assets/images/responsive/960/` contain lighter gallery copies selected automatically for each screen size.
- `assets/images/full/` contains local full-resolution backups and is excluded from Git.

The original named files remain in `assets/images/` and are ignored by Git. Only the optimized 2400px website images are published, keeping the repository and page load manageable.

After adding or replacing photographs in `assets/images/web/`, rebuild the responsive gallery copies:

```powershell
python tools/build_responsive_images.py
```

The manifest identifies tournaments from the source filename prefixes (`perga`, `bjkc`, `brezo`, `chamartin`, `junin`, and `zaragoza`) and distributes the groups throughout the gallery rather than displaying tournament blocks.

Each photograph also has an invisible primary visual tag in `assets/js/tennis-photos.js`. The justified-row layout uses those tags to prevent matching subjects from touching vertically or horizontally while keeping every row and the bottom edge perfectly flush.

## Local preview

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.
