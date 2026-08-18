# Tomás Schiter — tennis photography portfolio

A responsive, image-first portfolio presenting 97 tennis photographs.

Open `index.html` to view the site. No dependencies or build step are required.

## Photograph files

All portfolio slots are defined in `assets/js/tennis-photos.js`.

- `assets/images/web/` contains the optimized photographs used by both the gallery and fullscreen viewer.
- `assets/images/full/` contains local full-resolution backups and is excluded from Git.

The original named files remain in `assets/images/` and are ignored by Git. Only the optimized 2400px website images are published, keeping the repository and page load manageable.

The manifest identifies tournaments from the source filename prefixes (`perga`, `bjkc`, `brezo`, and `chamartin`) and distributes the groups throughout the gallery rather than displaying tournament blocks.

## Local preview

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.
