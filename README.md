# Mapping Viz

A gallery of seven interactive visualizations built from the Mapping Black
Digital and Public Humanities dataset.

## Structure

```text
index.html                              Gallery index
assets/site.css                         Shared visual system
assets/viz-utils.js                     Shared JavaScript helpers
data/portfolio-health-growth.js         Reusable aggregated data module
data/mapping-visualizations.js          Aggregates for visualizations 02–07
scripts/build_visualization_data.py     Workbook-to-web data builder
visualizations/
  portfolio-health-growth/
    index.html                           Visualization page
    app.js                               Chart and interaction logic
  clustered-project-map/
  project-type-topic-heatmap/
  topic-cooccurrence-matrix/
  organization-contributor-ecosystem/
  era-modality-decade-matrix/
  funding-leadership-transparency/
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

The visualizations use public catalog fields and aggregate counts derived from
the analysis-ready Mapping workbook:

- project start year
- last-updated recency bucket
- coordinates and coordinate stack size
- project type, topic, historical era, and modality
- organization and contributor classifications
- funding and leadership classifications

Unknown or unparseable values remain explicit rather than being imputed. In
particular, all 604 records without leadership data stay visible in the
transparency dashboard.
