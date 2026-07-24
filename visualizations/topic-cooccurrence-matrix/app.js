import { mappingVisualizations as data } from "../../data/mapping-visualizations.js";
import {
  formatNumber,
  formatPercent,
  requireElements,
  shortLabel,
} from "../../assets/viz-utils.js";

const elements = requireElements({
  grid: document.querySelector("#topic-matrix"),
  scope: document.querySelector("#matrix-scope"),
  detail: document.querySelector("#topic-detail"),
});

const cooccurrence = data.topicCooccurrence;
let topicLimit = 18;
let selected = findStrongestPair(topicLimit);

function findStrongestPair(limit) {
  let strongest = { row: 0, column: 1, value: -1 };
  for (let row = 0; row < limit; row += 1) {
    for (let column = row + 1; column < limit; column += 1) {
      const value = cooccurrence.matrix[row][column];
      if (value > strongest.value) strongest = { row, column, value };
    }
  }
  return { row: strongest.row, column: strongest.column };
}

function strength(value, maximum, diagonal) {
  if (!value || !maximum) return "0%";
  const ceiling = diagonal ? 72 : 82;
  return `${Math.max(10, Math.round((value / maximum) * ceiling))}%`;
}

function updateDetail() {
  const topicA = cooccurrence.topics[selected.row];
  const topicB = cooccurrence.topics[selected.column];
  const value = cooccurrence.matrix[selected.row][selected.column];

  if (selected.row === selected.column) {
    elements.detail.innerHTML =
      `<p><strong>${formatNumber(value)} projects</strong> are tagged ${topicA.name}.</p>`;
    return;
  }

  const smallerTotal = Math.min(topicA.count, topicB.count);
  elements.detail.innerHTML =
    `<p><strong>${formatNumber(value)} projects</strong> connect ${topicA.name} ` +
    `with ${topicB.name}.</p><p>That is ${formatPercent(value, smallerTotal)} ` +
    `of the less-common topic's projects.</p>`;
}

function draw() {
  const topics = cooccurrence.topics.slice(0, topicLimit);
  const offDiagonalMaximum = Math.max(
    ...cooccurrence.matrix
      .slice(0, topicLimit)
      .flatMap((row, rowIndex) =>
        row
          .slice(0, topicLimit)
          .filter((value, columnIndex) => columnIndex !== rowIndex)
      )
  );
  const diagonalMaximum = Math.max(...topics.map((topic) => topic.count));
  elements.grid.style.gridTemplateColumns =
    `minmax(190px, 220px) repeat(${topics.length}, 42px)`;
  elements.grid.replaceChildren();

  const corner = document.createElement("div");
  corner.className = "matrix-corner";
  corner.textContent = "Topic";
  elements.grid.append(corner);

  topics.forEach((topic) => {
    const label = document.createElement("div");
    label.className = "matrix-column-label";
    label.textContent = shortLabel(topic.name, 23);
    label.setAttribute("aria-label", topic.name);
    elements.grid.append(label);
  });

  topics.forEach((rowTopic, row) => {
    const rowLabel = document.createElement("div");
    rowLabel.className = "matrix-row-label";
    rowLabel.textContent = shortLabel(rowTopic.name, 28);
    rowLabel.setAttribute("aria-label", rowTopic.name);
    elements.grid.append(rowLabel);

    topics.forEach((columnTopic, column) => {
      const value = cooccurrence.matrix[row][column];
      const diagonal = row === column;
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        `matrix-cell${diagonal ? " diagonal" : ""}${value === 0 ? " empty" : ""}`;
      button.style.setProperty(
        "--cell-strength",
        strength(value, diagonal ? diagonalMaximum : offDiagonalMaximum, diagonal)
      );
      button.textContent = value || "0";
      button.setAttribute(
        "aria-label",
        diagonal
          ? `${rowTopic.name}: ${value} projects`
          : `${rowTopic.name} and ${columnTopic.name}: ${value} shared projects`
      );
      button.setAttribute(
        "aria-pressed",
        String(row === selected.row && column === selected.column)
      );
      button.addEventListener("click", () => {
        selected = { row, column };
        updateDetail();
        draw();
      });
      elements.grid.append(button);
    });
  });
}

elements.scope.addEventListener("change", () => {
  topicLimit = Number(elements.scope.value);
  selected = findStrongestPair(topicLimit);
  draw();
  updateDetail();
});

draw();
updateDetail();

