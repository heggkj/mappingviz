import { mappingVisualizations as data } from "../../data/mapping-visualizations.js";
import { formatNumber, requireElements } from "../../assets/viz-utils.js";

const elements = requireElements({
  grid: document.querySelector("#era-matrix"),
  detail: document.querySelector("#era-detail"),
});

const eraData = data.eraModalityDecade;
let selected = findLargestCell();

function totalCell(values) {
  return values.reduce((sum, value) => sum + value, 0);
}

function findLargestCell() {
  let strongest = { era: 0, decade: 0, total: -1 };
  eraData.matrix.forEach((row, eraIndex) => {
    row.forEach((cell, decadeIndex) => {
      const total = totalCell(cell);
      if (total > strongest.total) {
        strongest = { era: eraIndex, decade: decadeIndex, total };
      }
    });
  });
  return { era: strongest.era, decade: strongest.decade };
}

function updateDetail() {
  const values = eraData.matrix[selected.era][selected.decade];
  const total = totalCell(values);
  const breakdown = eraData.modalities
    .map((modality, index) => `${modality}: ${formatNumber(values[index])}`)
    .join(" - ");
  elements.detail.innerHTML =
    `<p><strong>${formatNumber(total)} projects</strong> connect ` +
    `${eraData.eras[selected.era]} with the ${eraData.decades[selected.decade]}.</p>` +
    `<p>${breakdown}</p>`;
}

function draw() {
  const maximum = Math.max(
    ...eraData.matrix.flatMap((row) => row.map(totalCell))
  );
  elements.grid.replaceChildren();

  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.scope = "col";
  corner.textContent = "Era / start decade";
  headRow.append(corner);

  eraData.decades.forEach((decade) => {
    const label = document.createElement("th");
    label.scope = "col";
    label.textContent = decade;
    headRow.append(label);
  });
  head.append(headRow);
  elements.grid.append(head);

  const body = document.createElement("tbody");

  eraData.eras.forEach((era, eraIndex) => {
    const row = document.createElement("tr");
    const rowLabel = document.createElement("th");
    rowLabel.scope = "row";
    rowLabel.textContent = era;
    row.append(rowLabel);

    eraData.decades.forEach((decade, decadeIndex) => {
      const values = eraData.matrix[eraIndex][decadeIndex];
      const total = totalCell(values);
      const cell = document.createElement("td");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "era-cell";
      button.style.setProperty(
        "--era-strength",
        total ? `${Math.max(7, Math.round((total / maximum) * 42))}%` : "0%"
      );
      button.setAttribute(
        "aria-label",
        `${era}, ${decade}: ${total} projects; ` +
          eraData.modalities
            .map((modality, index) => `${modality} ${values[index]}`)
            .join(", ")
      );
      button.setAttribute(
        "aria-pressed",
        String(eraIndex === selected.era && decadeIndex === selected.decade)
      );

      const totalLabel = document.createElement("span");
      totalLabel.className = "era-total";
      totalLabel.textContent = String(total);

      const stack = document.createElement("span");
      stack.className = "era-stack";
      eraData.modalities.forEach((_, modalityIndex) => {
        const segment = document.createElement("span");
        segment.style.width = total
          ? `${(values[modalityIndex] / total) * 100}%`
          : "0%";
        stack.append(segment);
      });

      button.append(totalLabel, stack);
      button.addEventListener("click", () => {
        selected = { era: eraIndex, decade: decadeIndex };
        updateDetail();
        draw();
      });
      cell.append(button);
      row.append(cell);
    });
    body.append(row);
  });
  elements.grid.append(body);
}

draw();
updateDetail();
