import { portfolioHealthGrowth as data } from "../../data/portfolio-health-growth.js";

const svg = document.querySelector("#timeline-chart");
const recencySvg = document.querySelector("#recency-chart");
const select = document.querySelector("#year-select");
const annualButton = document.querySelector("#annual-button");
const cumulativeButton = document.querySelector("#cumulative-button");
const metricLabel = document.querySelector("#metric-label");
const detail = document.querySelector("#chart-detail");
const tooltip = document.querySelector("#chart-tooltip");
const legend = document.querySelector("#recency-legend");

const requiredElements = [
  svg,
  recencySvg,
  select,
  annualButton,
  cumulativeButton,
  metricLabel,
  detail,
  tooltip,
  legend
];

if (requiredElements.some((element) => !element)) {
  throw new Error("The visualization could not find all required page elements.");
}

const counts = new Map(data.startYears);
const years = [];
for (let year = 1946; year <= 2025; year += 1) {
  years.push({ year, annual: counts.get(year) || 0 });
}

let running = 0;
for (const item of years) {
  running += item.annual;
  item.cumulative = running;
}

let mode = "annual";
let selectedYear = 2020;
let previousValues = years.map((item) => item.annual);
let animationFrame = null;

const svgNamespace = "http://www.w3.org/2000/svg";

function makeSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(svgNamespace, tag);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

function populateYearSelect() {
  for (const item of years.filter((year) => year.annual > 0)) {
    const option = document.createElement("option");
    option.value = String(item.year);
    option.textContent = String(item.year);
    option.selected = item.year === selectedYear;
    select.append(option);
  }
}

function updateDetail() {
  const selected = years.find((item) => item.year === selectedYear);
  if (!selected) return;

  if (mode === "annual") {
    const share = selected.annual / data.knownStartYears;
    detail.textContent =
      `${selected.year} · ${selected.annual} project${selected.annual === 1 ? "" : "s"} started · ` +
      `${(share * 100).toFixed(1)}% of projects with known start years`;
  } else {
    const share = selected.cumulative / data.knownStartYears;
    detail.textContent =
      `By ${selected.year} · ${selected.cumulative} projects started · ` +
      `${(share * 100).toFixed(1)}% of projects with known start years`;
  }
}

function setMode(nextMode) {
  if (nextMode === mode) return;

  const nextValues = years.map((item) => item[nextMode]);
  const fromValues = previousValues.slice();
  mode = nextMode;

  annualButton.setAttribute("aria-pressed", String(mode === "annual"));
  cumulativeButton.setAttribute("aria-pressed", String(mode === "cumulative"));
  metricLabel.textContent =
    mode === "annual"
      ? "Projects started by year"
      : "Cumulative projects with known start year";
  document.querySelector("#chart-title").textContent = metricLabel.textContent;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reducedMotion ? 0 : 260;
  const startTime = performance.now();

  cancelAnimationFrame(animationFrame);

  function animate(now) {
    const progress = duration === 0 ? 1 : Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const values = fromValues.map(
      (value, index) => value + (nextValues[index] - value) * eased
    );

    drawTimeline(values);

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      previousValues = nextValues;
    }
  }

  animationFrame = requestAnimationFrame(animate);
}

function drawTimeline(values) {
  const width = Math.max(320, svg.getBoundingClientRect().width || 960);
  const height = svg.getBoundingClientRect().height || 390;
  const margin = {
    top: 28,
    right: width < 480 ? 18 : 30,
    bottom: 42,
    left: width < 480 ? 38 : 52
  };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const maxValue = mode === "annual" ? 60 : 650;

  const x = (year) =>
    margin.left + ((year - 1946) / (2025 - 1946)) * innerWidth;
  const y = (value) =>
    margin.top + innerHeight - (value / maxValue) * innerHeight;

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  while (svg.childNodes.length > 2) {
    svg.lastChild.remove();
  }

  const gridValues =
    mode === "annual" ? [0, 15, 30, 45, 60] : [0, 150, 300, 450, 600];

  for (const value of gridValues) {
    svg.append(
      makeSvgElement("line", {
        x1: margin.left,
        x2: width - margin.right,
        y1: y(value),
        y2: y(value),
        class: "chart-grid"
      })
    );

    const label = makeSvgElement("text", {
      x: margin.left - 8,
      y: y(value) + 4,
      "text-anchor": "end",
      class: "axis-label"
    });
    label.textContent = value;
    svg.append(label);
  }

  for (const value of [1950, 1970, 1990, 2010, 2025]) {
    const label = makeSvgElement("text", {
      x: x(value),
      y: height - 12,
      "text-anchor":
        value === 1950 ? "start" : value === 2025 ? "end" : "middle",
      class: "axis-label"
    });
    label.textContent = value;
    svg.append(label);
  }

  const points = years.map((item, index) => [x(item.year), y(values[index])]);
  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${point[0].toFixed(2)},${point[1].toFixed(2)}`
    )
    .join(" ");
  const areaPath =
    `${linePath} L${x(2025).toFixed(2)},${y(0).toFixed(2)} ` +
    `L${x(1946).toFixed(2)},${y(0).toFixed(2)} Z`;

  svg.append(makeSvgElement("path", { d: areaPath, class: "chart-area" }));
  svg.append(makeSvgElement("path", { d: linePath, class: "chart-line" }));

  const selectedIndex = years.findIndex((item) => item.year === selectedYear);
  const selectedX = points[selectedIndex][0];

  svg.append(
    makeSvgElement("line", {
      x1: selectedX,
      x2: selectedX,
      y1: margin.top,
      y2: y(0),
      class: "chart-guide"
    })
  );

  years.forEach((item, index) => {
    if (item.annual === 0 && item.year !== selectedYear) return;

    const point = makeSvgElement("circle", {
      cx: points[index][0],
      cy: points[index][1],
      r: item.year === selectedYear ? 5.5 : 3,
      class: `chart-point${item.year === selectedYear ? " selected" : ""}`,
      "aria-label": `${item.year}: ${item.annual} projects started`
    });

    point.addEventListener("pointerenter", () => {
      const value = mode === "annual" ? item.annual : item.cumulative;
      tooltip.textContent =
        `${item.year}: ${value} ${mode === "annual" ? "started" : "cumulative projects"}`;
      tooltip.style.visibility = "visible";

      const svgRect = svg.getBoundingClientRect();
      const wrapRect = svg.parentElement.getBoundingClientRect();
      const tooltipLeft = Math.min(
        svgRect.width - 190,
        Math.max(8, points[index][0] - 70)
      );
      const tooltipTop = Math.max(8, points[index][1] - 48);

      tooltip.style.left = `${svgRect.left - wrapRect.left + tooltipLeft}px`;
      tooltip.style.top = `${svgRect.top - wrapRect.top + tooltipTop}px`;
    });

    point.addEventListener("pointerleave", () => {
      tooltip.style.visibility = "hidden";
    });

    point.addEventListener("click", () => {
      selectedYear = item.year;
      select.value = String(item.year);
      drawTimeline(years.map((year) => year[mode]));
      updateDetail();
    });

    svg.append(point);
  });

  drawCallout(selectedX, margin.top + 8, selectedYear, values[selectedIndex], width);
  updateDetail();
}

function drawCallout(x, top, year, value, chartWidth) {
  const group = makeSvgElement("g", { class: "chart-callout" });
  const text = makeSvgElement("text", { y: top + 16 });
  text.textContent = `${year} · ${Math.round(value)}`;
  group.append(text);
  svg.append(group);

  const textBox = text.getBBox();
  const paddingX = 8;
  const paddingY = 5;
  const calloutWidth = textBox.width + paddingX * 2;
  const calloutHeight = textBox.height + paddingY * 2;
  const clampedLeft = Math.min(
    chartWidth - calloutWidth - 8,
    Math.max(8, x - calloutWidth / 2)
  );

  text.setAttribute("x", clampedLeft + paddingX);
  text.setAttribute("y", top + paddingY + textBox.height * 0.82);

  const background = makeSvgElement("rect", {
    x: clampedLeft,
    y: top,
    width: calloutWidth,
    height: calloutHeight,
    rx: 6,
    ry: 6
  });
  group.insertBefore(background, text);
}

function drawRecency() {
  const width = Math.max(320, recencySvg.getBoundingClientRect().width || 960);
  const height = recencySvg.getBoundingClientRect().height || 54;
  recencySvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  recencySvg.replaceChildren();

  let offset = 0;
  for (const item of data.updateRecency) {
    const segmentWidth = (width * item.value) / data.projects;
    const rect = makeSvgElement("rect", {
      x: offset,
      y: 9,
      width: segmentWidth,
      height: 34,
      fill: item.color
    });
    recencySvg.append(rect);

    if (segmentWidth > 38) {
      const label = makeSvgElement("text", {
        x: offset + segmentWidth / 2,
        y: 31,
        "text-anchor": "middle"
      });
      label.textContent = item.value;
      recencySvg.append(label);
    }

    offset += segmentWidth;
  }
}

function populateLegend() {
  for (const item of data.updateRecency) {
    const wrapper = document.createElement("span");
    wrapper.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.background = item.color;
    swatch.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.textContent = `${item.label}: ${item.value}`;

    wrapper.append(swatch, label);
    legend.append(wrapper);
  }
}

annualButton.addEventListener("click", () => setMode("annual"));
cumulativeButton.addEventListener("click", () => setMode("cumulative"));

select.addEventListener("change", () => {
  selectedYear = Number(select.value);
  drawTimeline(years.map((item) => item[mode]));
});

const observer = new ResizeObserver(() => {
  drawTimeline(years.map((item) => item[mode]));
  drawRecency();
});

populateYearSelect();
populateLegend();
observer.observe(svg.parentElement);
drawTimeline(previousValues);
drawRecency();
