# GEM Website

Static website for the Good Enough Manipulator.

Run locally:

```powershell
python -m http.server 8080
```

Open `http://localhost:8080`.

The build manual content lives in `assets/data/build-steps.json`; final instruction
renders should be saved into `assets/build-images/`. The BOM table is generated from
`assets/data/bom.json`, which was normalized from the project spreadsheet.

## License

This repo uses a split license:

- Website code (`index.html`, `assets/css/**`, `assets/js/**`) is Apache-2.0.
- GEM design files, URDF/mesh assets, media, build instructions, and BOM data are
  CC BY-NC-SA 4.0 unless a file says otherwise.
- Third-party vendored files remain under their upstream licenses.

See `LICENSE` for the exact file-level scope.
