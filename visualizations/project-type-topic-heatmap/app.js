import { mappingVisualizations as data } from "../../data/mapping-visualizations.js";
import {
  formatNumber,
  formatPercent,
  requireElements,
  shortLabel,
} from "../../assets/viz-utils.js";

const elements = requireElements({
  grid: document.querySelector("#type-topic-grid"),
  scope: document.querySelector("#topic-scope"),
  detail: document.querySelector("#heatmap-detail"),
});

const heatmap = data.typeTopic;
let topicLimit = 18;
let selected = { typeIndex: 0, topicIndex: 0 };

function cellStrength(value, maximum) {
  if (!value || !maximum) return "0%";
  return `${Math.max(12, Math.round((value / maximum) * 82))}%`;
}

function updateDetail() {
  const projectType = heatmap.types[selected.typeIndex];
  const topic = heatmap.topics[selected.topicIndex];
  const value = heatmap.matrix[selected.typeIndex][selected.topicIndex];
  elements.detail.innerHTML =
    `<p><strong>${formatNumber(value)} projects</strong> combine ` +
    `${projectType.name} with ${topic.name}.</p>` +
    `<p>${formatPercent(value, projectType.count)} of projects with this type; ` +
    `${formatPercent(value, topic.count)} of projects with this topic.</p>`;
}

function draw() {
  const visibleTopics = heatmap.topics.slice(0, topicLimit);
  const maximum = Math.max(
    ...heatmap.matrix.flatMap((row) => row.slice(0, topicLimit))
  );
  elements.grid.style.gridTemplateColumns =
    `minmax(190px, 220px) repeat(${visibleTopics.length}, 42px)`;
  elements.grid.replaceChildren();

  const corner = document.createElement("div");
  corner.className = "matrix-corner";
  corner.textContent = "Project type";
  elements.grid.append(corner);

  visibleTopics.forEach((topic) => {
    const label = document.createElement("div");
    label.className = "matrix-column-label";
    label.textContent = shortLabel(topic.name, 23);
    label.setAttribute("aria-label", `${topic.name}, ${topic.count} projects`);
    elements.grid.append(label);
  });

  heatmap.types.forEach((projectType, typeIndex) => {
    const rowLabel = document.createElement("div");
    rowLabel.className = "matrix-row-label";
    rowLabel.textContent = shortLabel(projectType.name, 28);
    rowLabel.setAttribute(
      "aria-label",
      `${projectType.name}, ${projectType.count} projects`
    );
    elements.grid.append(rowLabel);

    visibleTopics.forEach((topic, topicIndex) => {
      const value = heatmap.matrix[typeIndex][topicIndex];
      const button = document.createElement("button");
      button.type = "button";
      button.className = `matrix-cell${value === 0 ? " empty" : ""}`;
      button.style.setProperty("--cell-strength", cellStrength(value, maximum));
      button.textContent = value || "0";
      button.setAttribute(
        "aria-label",
        `${projectType.name} and ${topic.name}: ${value} projects`
      );
      button.setAttribute(
        "aria-pressed",
        String(typeIndex === selected.typeIndex && topicIndex === selected.topicIndex)
      );
      button.addEventListener("click", () => {
        selected = { typeIndex, topicIndex };
        updateDetail();
        draw();
      });
      elements.grid.append(button);
    });
  });
}

elements.scope.addEventListener("change", () => {
  topicLimit = Number(elements.scope.value);
  if (selected.topicIndex >= topicLimit) selected.topicIndex = 0;
  draw();
  updateDetail();
});

draw();
updateDetail();

