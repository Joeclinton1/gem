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
