/**
 * Página /reporte: reportes de inventario.
 * /reports/* → reporting-service FastAPI (vía Nginx).
 */

const REPORTS_SUMMARY = "/reports/summary";
const REPORTS_LOW_STOCK = "/reports/low-stock?threshold=5";
const REPORTS_TOP_VALUE = "/reports/top-value?limit=5";

const btnCargarReportes = document.getElementById("btnCargarReportes");
const btnReintentarReportes = document.getElementById("btnReintentarReportes");
const reportesStatus = document.getElementById("reportes-status");
const kpiTotalProductos = document.getElementById("kpi-total-productos");
const kpiTotalUnidades = document.getElementById("kpi-total-unidades");
const kpiValorInventario = document.getElementById("kpi-valor-inventario");
const tbodyLowStock = document.getElementById("tbodyLowStock");
const tbodyTopValue = document.getElementById("tbodyTopValue");
const lowStockEmpty = document.getElementById("low-stock-empty");
const topValueEmpty = document.getElementById("top-value-empty");

function setReportesStatus(mensaje, tipo = "ok") {
  reportesStatus.textContent = mensaje;
  reportesStatus.className = "status " + tipo;
}

function resetReportesUi() {
  kpiTotalProductos.textContent = "—";
  kpiTotalUnidades.textContent = "—";
  kpiValorInventario.textContent = "—";
  clearElement(tbodyLowStock);
  clearElement(tbodyTopValue);
  lowStockEmpty.hidden = true;
  topValueEmpty.hidden = true;
}

function renderSummary(summary) {
  kpiTotalProductos.textContent = formatInt(summary.total_productos);
  kpiTotalUnidades.textContent = formatInt(summary.total_unidades);
  kpiValorInventario.textContent = formatMoney(summary.valor_inventario);
}

function renderLowStock(productos) {
  clearElement(tbodyLowStock);
  const empty = !Array.isArray(productos) || productos.length === 0;
  lowStockEmpty.hidden = !empty;
  if (empty) return;

  productos.forEach((p) => {
    const tr = document.createElement("tr");
    appendTextCell(tr, p.id);
    appendTextCell(tr, p.nombre);
    appendTextCell(tr, p.descripcion || "");
    appendTextCell(tr, formatMoney(p.precio));
    appendTextCell(tr, formatInt(p.stock));
    tbodyLowStock.appendChild(tr);
  });
}

function renderTopValue(productos) {
  clearElement(tbodyTopValue);
  const empty = !Array.isArray(productos) || productos.length === 0;
  topValueEmpty.hidden = !empty;
  if (empty) return;

  productos.forEach((p) => {
    const tr = document.createElement("tr");
    appendTextCell(tr, p.id);
    appendTextCell(tr, p.nombre);
    appendTextCell(tr, p.descripcion || "");
    appendTextCell(tr, formatMoney(p.precio));
    appendTextCell(tr, formatInt(p.stock));
    appendTextCell(tr, formatMoney(p.valor_inventario));
    tbodyTopValue.appendChild(tr);
  });
}

async function cargarReportes() {
  btnCargarReportes.disabled = true;
  btnReintentarReportes.hidden = true;
  setReportesStatus("Cargando reportes…", "loading");
  resetReportesUi();

  try {
    const [summary, lowStock, topValue] = await Promise.all([
      fetchJson(REPORTS_SUMMARY),
      fetchJson(REPORTS_LOW_STOCK),
      fetchJson(REPORTS_TOP_VALUE),
    ]);

    renderSummary(summary);
    renderLowStock(lowStock);
    renderTopValue(topValue);
    setReportesStatus("Reportes actualizados correctamente.", "ok");
  } catch (err) {
    console.error(err);
    resetReportesUi();
    btnReintentarReportes.hidden = false;
    setReportesStatus(
      "No se pudieron obtener los reportes. Revisá reporting-service o reintentá.",
      "error"
    );
  } finally {
    btnCargarReportes.disabled = false;
  }
}

btnCargarReportes.addEventListener("click", cargarReportes);
btnReintentarReportes.addEventListener("click", cargarReportes);

cargarReportes();
