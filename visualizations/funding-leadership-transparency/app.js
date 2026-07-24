import { mappingVisualizations as data } from "../../data/mapping-visualizations.js";
import {
  formatNumber,
  formatPercent,
  requireElements,
  shortLabel,
} from "../../assets/viz-utils.js";

const elements = requireElements({
  knownBar: document.querySelector("#known-completeness"),
  leadershipBars: document.querySelector("#leadership-bars"),
  fundingBars: document.querySelector("#funding-bars"),
  sort: document.querySelector("#funding-sort"),
  detail: document.querySelector("#funding-detail"),
});

const transparency = data.fundingLeadership;
let selectedFunding = transparency.funding[0].name;

function drawLeadership() {
  const maximum = Math.max(...transparency.leadershipTags.map((item) => item.count));
  elements.knownBar.style.width =
    `${(transparency.leadershipKnown / data.meta.projects) * 100}%`;
  elements.leadershipBars.replaceChildren();

  transparency.leadershipTags.forEach((item) => {
    const row = document.createElement("div");
    row.className = "leadership-row";

    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = item.name;

    const track = document.createElement("span");
    track.className = "leadership-track";
    const fill = document.createElement("span");
    fill.className = "leadership-fill";
    fill.style.width = `${(item.count / maximum) * 100}%`;
    track.append(fill);

    const value = document.createElement("span");
    value.className = "bar-value";
    value.textContent = formatNumber(item.count);

    row.append(label, track, value);
    elements.leadershipBars.append(row);
  });
}

function sortedFunding() {
  const rows = [...transparency.funding];
  if (elements.sort.value === "unknown") {
    rows.sort(
      (a, b) =>
        b.unknownLeadership / b.total - a.unknownLeadership / a.total ||
        b.total - a.total
    );
  }
  return rows;
}

function updateDetail() {
  const row = transparency.funding.find((item) => item.name === selectedFunding);
  elements.detail.innerHTML =
    `<p><strong>${formatNumber(row.total)} projects</strong> report ${row.name}.</p>` +
    `<p>${formatNumber(row.unknownLeadership)} (${formatPercent(
      row.unknownLeadership,
      row.total,
      1
    )}) have unknown leadership data; ${formatNumber(row.knownLeadership)} have known leadership data.</p>`;
}

function drawFunding() {
  const rows = sortedFunding();
  const maximum = Math.max(...rows.map((item) => item.total));
  elements.fundingBars.replaceChildren();

  rows.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "funding-row funding-row-button";
    button.setAttribute("aria-pressed", String(item.name === selectedFunding));
    button.setAttribute(
      "aria-label",
      `${item.name}: ${item.total} projects; ${item.knownLeadership} leadership known; ${item.unknownLeadership} leadership unknown`
    );

    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = shortLabel(item.name, 42);

    const track = document.createElement("span");
    track.className = "funding-track";
    const known = document.createElement("span");
    known.className = "funding-known";
    known.style.width = `${(item.knownLeadership / maximum) * 100}%`;
    const unknown = document.createElement("span");
    unknown.className = "funding-unknown";
    unknown.style.width = `${(item.unknownLeadership / maximum) * 100}%`;
    track.append(known, unknown);

    const value = document.createElement("span");
    value.className = "bar-value";
    value.textContent = formatNumber(item.total);

    button.append(label, track, value);
    button.addEventListener("click", () => {
      selectedFunding = item.name;
      updateDetail();
      drawFunding();
    });
    elements.fundingBars.append(button);
  });
}

elements.sort.addEventListener("change", drawFunding);

drawLeadership();
drawFunding();
updateDetail();

