import { mappingVisualizations as data } from "../../data/mapping-visualizations.js";
import {
  formatNumber,
  requireElements,
  shortLabel,
  svgElement,
} from "../../assets/viz-utils.js";

const elements = requireElements({
  svg: document.querySelector("#ecosystem-chart"),
  detail: document.querySelector("#ecosystem-detail"),
  focus: document.querySelector("#organization-focus"),
  minimum: document.querySelector("#minimum-count"),
});

const ecosystem = data.organizationContributor;
let focus = "all";
let minimum = 10;
let selectedEdge = strongestEdge();

function strongestEdge(organizationIndex = null) {
  let strongest = { organization: 0, contributor: 0, value: -1 };
  ecosystem.matrix.forEach((row, orgIndex) => {
    if (organizationIndex !== null && orgIndex !== organizationIndex) return;
    row.forEach((value, contributorIndex) => {
      if (value > strongest.value) {
        strongest = { organization: orgIndex, contributor: contributorIndex, value };
      }
    });
  });
  return strongest;
}

function populateFocus() {
  ecosystem.organizations.forEach((organization, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${organization.name} (${organization.count})`;
    elements.focus.append(option);
  });
}

function updateDetail(edge = selectedEdge) {
  const organization = ecosystem.organizations[edge.organization];
  const contributor = ecosystem.contributors[edge.contributor];
  elements.detail.innerHTML =
    `<p><strong>${formatNumber(edge.value)} projects</strong> connect ` +
    `${organization.name} with ${contributor.name}.</p>`;
}

function draw() {
  const width = Math.max(640, elements.svg.getBoundingClientRect().width || 1000);
  const height = elements.svg.getBoundingClientRect().height || 650;
  const leftX = Math.min(240, width * 0.27);
  const rightX = width - Math.min(240, width * 0.27);
  const top = 22;
  const bottom = 22;
  const orgGap = (height - top - bottom) / ecosystem.organizations.length;
  const contributorGap = (height - top - bottom) / ecosystem.contributors.length;
  const maximum = Math.max(...ecosystem.matrix.flat());
  const focusedIndex = focus === "all" ? null : Number(focus);

  const orgY = ecosystem.organizations.map(
    (_, index) => top + orgGap * index + orgGap / 2
  );
  const contributorY = ecosystem.contributors.map(
    (_, index) => top + contributorGap * index + contributorGap / 2
  );

  elements.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  elements.svg.replaceChildren(
    Object.assign(svgElement("title"), {
      textContent: "Organization types connected to contributor roles",
    }),
    Object.assign(svgElement("desc"), {
      textContent:
        "Line width represents the number of projects connecting an organization type and contributor role.",
    })
  );

  ecosystem.organizations.forEach((organization, orgIndex) => {
    ecosystem.contributors.forEach((contributor, contributorIndex) => {
      const value = ecosystem.matrix[orgIndex][contributorIndex];
      if (value < minimum) return;
      if (focusedIndex !== null && orgIndex !== focusedIndex) return;
      const active =
        orgIndex === selectedEdge.organization &&
        contributorIndex === selectedEdge.contributor;
      const curve = svgElement("path", {
        d:
          `M${leftX},${orgY[orgIndex]} ` +
          `C${leftX + (rightX - leftX) * 0.38},${orgY[orgIndex]} ` +
          `${leftX + (rightX - leftX) * 0.62},${contributorY[contributorIndex]} ` +
          `${rightX},${contributorY[contributorIndex]}`,
        class: `ecosystem-edge${active ? " active" : ""}`,
        "stroke-width": 0.7 + (value / maximum) * 11,
        "aria-label": `${organization.name} and ${contributor.name}: ${value} projects`,
      });
      curve.addEventListener("pointerenter", () => {
        selectedEdge = { organization: orgIndex, contributor: contributorIndex, value };
        updateDetail();
      });
      curve.addEventListener("click", draw);
      elements.svg.append(curve);
    });
  });

  ecosystem.organizations.forEach((organization, index) => {
    const active = focusedIndex === index;
    elements.svg.append(
      svgElement("rect", {
        x: leftX - 8,
        y: orgY[index] - Math.max(4, orgGap * 0.25),
        width: 8,
        height: Math.max(8, orgGap * 0.5),
        rx: 3,
        class: `ecosystem-node${active ? " active" : ""}`,
      })
    );
    const label = svgElement("text", {
      x: leftX - 14,
      y: orgY[index] + 3,
      "text-anchor": "end",
      class: "ecosystem-label",
    });
    label.textContent = shortLabel(organization.name, width < 760 ? 18 : 30);
    elements.svg.append(label);
  });

  ecosystem.contributors.forEach((contributor, index) => {
    elements.svg.append(
      svgElement("rect", {
        x: rightX,
        y: contributorY[index] - Math.max(4, contributorGap * 0.18),
        width: 8,
        height: Math.max(8, contributorGap * 0.36),
        rx: 3,
        class: "ecosystem-node",
      })
    );
    const label = svgElement("text", {
      x: rightX + 14,
      y: contributorY[index] + 3,
      "text-anchor": "start",
      class: "ecosystem-label",
    });
    label.textContent = shortLabel(contributor.name, width < 760 ? 18 : 26);
    elements.svg.append(label);
  });
}

elements.focus.addEventListener("change", () => {
  focus = elements.focus.value;
  selectedEdge = strongestEdge(focus === "all" ? null : Number(focus));
  updateDetail();
  draw();
});

elements.minimum.addEventListener("change", () => {
  minimum = Number(elements.minimum.value);
  draw();
});

populateFocus();
updateDetail();
draw();
new ResizeObserver(draw).observe(elements.svg.parentElement);
