# Mapping Viz

A small, dependency-free gallery of interactive visualizations built from the
Mapping Black Digital and Public Humanities dataset.

## Structure

```text
index.html                              Gallery index
assets/site.css                         Shared visual system
data/portfolio-health-growth.js         Reusable aggregated data module
visualizations/
  portfolio-health-growth/
    index.html                           Visualization page
    app.js                               Chart and interaction logic
```

Each visualization lives in its own directory and imports shared data from
`/data`. This keeps the gallery index stable as new visualizations are added.

## Local preview

Serve the repository root with any static server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Data notes

The current visualization uses aggregated, non-sensitive fields derived from
the Mapping workbook:

- project start year
- last-updated recency bucket
- catalog totals

Unknown or unparseable dates remain explicit rather than being imputed.
