import { mappingVisualizations as data } from "../../data/mapping-visualizations.js?v=2";
import { requireElements, setPressed, svgElement } from "../../assets/viz-utils.js";

const elements = requireElements({
  svg: document.querySelector("#map-chart"),
  detail: document.querySelector("#map-detail"),
  select: document.querySelector("#location-select"),
  allButton: document.querySelector("#all-locations"),
  sharedButton: document.querySelector("#shared-locations"),
});

const groups = data.map.groups;
const world = data.map.world;
let mode = "all";
let selectedIndex = 0;

function optionLabel(group) {
  const coordinate = `${group.lat.toFixed(2)}, ${group.lon.toFixed(2)}`;
  return `${group.count} project${group.count === 1 ? "" : "s"} - ${group.location} (${coordinate})`;
}

function populateSelect() {
  groups.forEach((group, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = optionLabel(group);
    elements.select.append(option);
  });
}

function updateDetail() {
  const group = groups[selectedIndex];
  const heading = document.createElement("p");
  heading.innerHTML =
    `<strong>${group.count} project${group.count === 1 ? "" : "s"}</strong> at ` +
    `${group.location} (${group.lat.toFixed(4)}, ${group.lon.toFixed(4)})`;

  const list = document.createElement("ul");
  list.className = "project-list";
  for (const project of group.projects) {
    const item = document.createElement("li");
    if (project.url) {
      const link = document.createElement("a");
      link.href = project.url;
      link.textContent = project.name;
      item.append(link);
    } else {
      item.textContent = project.name;
    }
    list.append(item);
  }

  elements.detail.replaceChildren(heading, list);
}

function drawMap() {
  const width = Math.max(320, elements.svg.getBoundingClientRect().width || 960);
  const height = elements.svg.getBoundingClientRect().height || 560;
  const projection = d3.geoEqualEarth().fitExtent(
    [[10, 10], [width - 10, height - 10]],
    { type: "Sphere" }
  );
  const path = d3.geoPath(projection);
  const countries = topojson.feature(world, world.objects.countries);

  elements.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  elements.svg.replaceChildren(
    Object.assign(svgElement("title"), { textContent: "World map of project coordinate stacks" }),
    Object.assign(svgElement("desc"), {
      textContent: "Circles mark exact coordinate groups. Larger circles contain more projects.",
    })
  );

  elements.svg.append(
    svgElement("path", { d: path({ type: "Sphere" }), class: "map-sphere" })
  );
  for (const country of countries.features) {
    elements.svg.append(
      svgElement("path", { d: path(country), class: "map-country" })
    );
  }

  groups.forEach((group, index) => {
    if (mode === "shared" && group.count === 1) return;
    const point = projection([group.lon, group.lat]);
    if (!point) return;
    const circle = svgElement("circle", {
      cx: point[0],
      cy: point[1],
      r: 2.2 + Math.sqrt(group.count) * 2.3,
      class:
        `map-point${group.count > 1 ? " shared" : ""}` +
        `${index === selectedIndex ? " selected" : ""}`,
      "aria-label": optionLabel(group),
    });
    circle.addEventListener("click", () => {
      selectedIndex = index;
      elements.select.value = String(index);
      updateDetail();
      drawMap();
    });
    elements.svg.append(circle);
  });
}

function setMode(nextMode, button) {
  mode = nextMode;
  setPressed([elements.allButton, elements.sharedButton], button);
  drawMap();
}

elements.allButton.addEventListener("click", () => setMode("all", elements.allButton));
elements.sharedButton.addEventListener("click", () =>
  setMode("shared", elements.sharedButton)
);
elements.select.addEventListener("change", () => {
  selectedIndex = Number(elements.select.value);
  updateDetail();
  drawMap();
});

populateSelect();
updateDetail();
drawMap();
new ResizeObserver(drawMap).observe(elements.svg.parentElement);
