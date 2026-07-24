export const SVG_NS = "http://www.w3.org/2000/svg";

export function svgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value, denominator, digits = 0) {
  if (!denominator) return "0%";
  return `${((value / denominator) * 100).toFixed(digits)}%`;
}

export function maxValue(matrix) {
  return Math.max(
    0,
    ...matrix.flat(Infinity).filter((value) => typeof value === "number")
  );
}

export function setPressed(buttons, activeButton) {
  for (const button of buttons) {
    button.setAttribute("aria-pressed", String(button === activeButton));
  }
}

export function cssColor(name, fallback = "currentColor") {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function shortLabel(value, length = 22) {
  const replacements = [
    ["Digital Collections/Databases/Archives", "Digital collections"],
    ["Digital Publishing & Digital Editions", "Digital publishing"],
    ["Data Mining/Mapping/Visualization", "Data / mapping"],
    ["Exhibits & Digital Storytelling", "Exhibits / storytelling"],
    ["Local History & Local Places", "Local history"],
    ["Independent Scholar/Individual Research", "Independent research"],
    ["Inter-Institution Partnership", "Inter-institution"],
    ["Minority Serving Institution", "MSI"],
    ["Grants/Awards", "Grants"],
    ["Institutional Operating Budget", "Operating budget"],
    ["Race Relations/Racial Inequality/Racism", "Race / inequality"],
    ["Abolitionists/Emancipation/Reconstruction", "Abolition / Reconstruction"],
    ["Colonialism & Post-Colonialism/Decolonization", "Colonialism / decolonization"],
    ["Transatlantic Slave Trade/Slavery", "Slave trade / slavery"],
    ["Lynching/Race Riots/Police Brutality", "Racial violence"],
    ["Black Visual and Performance Art", "Black visual / performance art"],
    ["Newspapers/Periodicals/Black Press", "Black press"],
    ["Black Communities/Urban Renewal", "Black communities"],
    ["Black Education/Black Students", "Black education"],
    ["Black People - Race Identity", "Race identity"],
  ];
  let shortened = value;
  for (const [from, to] of replacements) {
    shortened = shortened.replace(from, to);
  }
  if (shortened.length <= length) return shortened;
  return `${shortened.slice(0, Math.max(1, length - 1)).trim()}…`;
}

export function requireElements(elements) {
  const missing = Object.entries(elements)
    .filter(([, element]) => !element)
    .map(([name]) => name);
  if (missing.length) {
    throw new Error(`Missing required page elements: ${missing.join(", ")}`);
  }
  return elements;
}

