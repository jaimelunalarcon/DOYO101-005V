/**
 * Utilidades compartidas del frontend (productos y reporte).
 */

const moneyFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const intFmt = new Intl.NumberFormat("es-CL");

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return moneyFmt.format(n);
}

function formatInt(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return intFmt.format(n);
}

function clearElement(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function appendTextCell(tr, text) {
  const td = document.createElement("td");
  td.textContent = text == null ? "" : String(text);
  tr.appendChild(td);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} en ${url}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
