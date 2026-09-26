const STORAGE_KEY = "premiumJackpotTableConfig_v6";

const DEMO = {
  title: "MEMBER TERPILIH",
  provider: "PRAGMATIC PLAY",
  page: 1,
  timeMode: "realtime",
  customDate: "",
  customTime: "",
  columns: [
    "Account type",
    "Tanggal",
    "Type",
    "No terpilih",
    "Total Claim",
    "Progres",
    "Status"
  ],
  rows: [
    ["#2316958", "", "VIP", "+62 853-4223-1719", "5,500,000", "0", "Menunggu"],
    ["#2316877", "", "VIP", "+62 882-****-6675", "5,050,000", "0", "Succses"],
    ["#2316554", "", "VIP", "+62 857-****-3716", "4,800,000", "0", "Succses"],
    ["#2316435", "", "VIP", "+62 853-****-1719", "5,020,000", "0", "Succses"],
    ["#2316957", "", "VIP", "+62 878-****-5432", "3,500,000", "0", "Succses"],
    ["#2316343", "", "VIP", "+62 882-****-1741", "5,100,000", "0", "Succses"]
  ]
};

let config = loadConfig();
let editing = deepClone(config);

const $ = (selector) => document.querySelector(selector);

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return deepClone(DEMO);
    return normalizeConfig(JSON.parse(saved));
  } catch {
    return deepClone(DEMO);
  }
}

function normalizeConfig(data) {
  const safe = deepClone(DEMO);
  if (!data || typeof data !== "object") return safe;

  safe.title = String(data.title ?? safe.title);
  safe.provider = String(data.provider ?? safe.provider);
  safe.page = Math.max(1, Number.parseInt(data.page, 10) || 1);
  safe.timeMode = data.timeMode === "custom" ? "custom" : "realtime";
  safe.customDate = String(data.customDate ?? "");
  safe.customTime = String(data.customTime ?? "");

  if (Array.isArray(data.columns) && data.columns.length === 7) {
    safe.columns = data.columns.map(v => String(v ?? ""));
  }

  if (Array.isArray(data.rows)) {
    safe.rows = data.rows.map(row => {
      const arr = Array.isArray(row) ? row : [];
      return safe.columns.map((_, i) => {
        let value = String(arr[i] ?? "");
        if (i === 6) value = normalizeStatus(value);
        return value;
      });
    });
  }

  return safe;
}

function normalizeStatus(value) {
  const v = String(value || "").toLowerCase();
  return v.includes("menunggu") || v.includes("pending") ? "Menunggu" : "Succses";
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cellHTML(value) {
  return escapeHTML(value).replace(/\n/g, "<br>");
}

function getLiveDateTime(rowIndex = 0) {
  if (config.timeMode === "custom" && config.customDate) {
    const date = config.customDate;
    const time = config.customTime || "00:00:00";
    return formatDateTime(new Date(`${date}T${time}`));
  }

  // Each row is offset by a few seconds to resemble live incoming records.
  const now = new Date();
  now.setSeconds(now.getSeconds() - rowIndex);
  return formatDateTime(now);
}

function formatDateTime(date) {
  const pad = n => String(n).padStart(2, "0");
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  const day = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  return `${time}\n${day}`;
}

function isDateColumn(index) {
  const name = String(config.columns[index] || "").toLowerCase();
  return index === 1 || name.includes("tanggal") || name.includes("date") || name.includes("waktu");
}

function progressHTML(status) {
  const normalized = normalizeStatus(status);
  const isSuccess = normalized === "Succses";
  const width = isSuccess ? "100%" : "52%";
  const cls = isSuccess ? "progress-success" : "progress-pending";
  const label = isSuccess ? "100%" : "52%";

  return `<div class="progress-wrap" aria-label="Progres ${label}">
    <div class="progress-track">
      <div class="progress-fill ${cls}" style="width:${width}"></div>
    </div>
  </div>`;
}

function renderMain() {
  $("#mainTitle").textContent = config.title;
  $("#providerName").textContent = config.provider;
  $("#pageNumber").textContent = config.page;

  $("#tableHead").innerHTML = config.columns
    .map(col => `<th>${escapeHTML(col)}</th>`)
    .join("");

  $("#tableBody").innerHTML = config.rows.map((row, rowIndex) => `
    <tr>
      ${row.map((value, colIndex) => {
        let displayValue = value;
        let contentHTML;
        if (isDateColumn(colIndex)) displayValue = getLiveDateTime(rowIndex);

        const statusClass = colIndex === 6
          ? (normalizeStatus(value) === "Succses" ? "status-success" : "status-pending")
          : "";

        if (colIndex === 5) {
          const status = row[6] ?? "Menunggu";
          contentHTML = progressHTML(status);
        } else {
          contentHTML = cellHTML(displayValue);
        }

        return `<td class="${statusClass}" data-label="${escapeHTML(config.columns[colIndex])}">
          ${contentHTML}
        </td>`;
      }).join("")}
    </tr>
  `).join("");

  document.title = config.title || "MEMBER TERPILIH";
}

function fillCustomForm() {
  $("#inputTitle").value = editing.title;
  $("#inputProvider").value = editing.provider;
  $("#inputPage").value = editing.page;
  $("#timeMode").value = editing.timeMode;
  $("#customDate").value = editing.customDate;
  $("#customTime").value = editing.customTime;
  updateCustomTimeVisibility();

  $("#columnsEditor").innerHTML = editing.columns.map((col, i) => `
    <label>Kolom ${i + 1}
      <input class="column-input" data-index="${i}" type="text" value="${escapeHTML(col)}">
    </label>
  `).join("");

  renderEditorRows();
}

function updateCustomTimeVisibility() {
  const custom = $("#timeMode").value === "custom";
  $("#customDateWrap").style.display = custom ? "flex" : "none";
  $("#customTimeWrap").style.display = custom ? "flex" : "none";
}

function renderEditorRows() {
  $("#editorHead").innerHTML =
    editing.columns.map(col => `<th>${escapeHTML(col)}</th>`).join("") +
    "<th>Aksi</th>";

  $("#editorBody").innerHTML = editing.rows.map((row, rowIndex) => `
    <tr>
      ${editing.columns.map((_, colIndex) => {
        if (colIndex === 6) {
          const status = normalizeStatus(row[colIndex]);
          return `<td>
            <select class="cell-input status-select" data-row="${rowIndex}" data-col="${colIndex}">
              <option value="Succses" ${status === "Succses" ? "selected" : ""}>Succses</option>
              <option value="Menunggu" ${status === "Menunggu" ? "selected" : ""}>Menunggu</option>
            </select>
          </td>`;
        }

        return `<td>
          <input
            class="cell-input"
            data-row="${rowIndex}"
            data-col="${colIndex}"
            type="text"
            value="${escapeHTML(row[colIndex] ?? "")}"
            aria-label="Baris ${rowIndex + 1}, kolom ${colIndex + 1}">
        </td>`;
      }).join("")}
      <td>
        <button class="delete-row" data-delete-row="${rowIndex}">Hapus</button>
      </td>
    </tr>
  `).join("");
}

function openModal() {
  editing = deepClone(config);
  fillCustomForm();
  $("#customModal").classList.add("open");
  $("#customModal").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  $("#customModal").classList.remove("open");
  $("#customModal").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function collectEditingData() {
  editing.title = $("#inputTitle").value.trim();
  editing.provider = $("#inputProvider").value.trim();
  editing.page = Math.max(1, Number.parseInt($("#inputPage").value, 10) || 1);
  editing.timeMode = $("#timeMode").value;
  editing.customDate = $("#customDate").value;
  editing.customTime = $("#customTime").value;

  document.querySelectorAll(".column-input").forEach(input => {
    editing.columns[Number(input.dataset.index)] = input.value.trim();
  });

  document.querySelectorAll(".cell-input").forEach(input => {
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    if (editing.rows[row]) editing.rows[row][col] = input.value;
  });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

$("#openCustom").addEventListener("click", openModal);
$("#closeCustom").addEventListener("click", closeModal);
$("#cancelCustom").addEventListener("click", closeModal);

$("#timeMode").addEventListener("change", updateCustomTimeVisibility);

$("#customModal").addEventListener("click", (event) => {
  if (event.target === $("#customModal")) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && $("#customModal").classList.contains("open")) {
    closeModal();
  }
});

$("#addRow").addEventListener("click", () => {
  collectEditingData();
  editing.rows.push(["", "", "", "", "", "", "Menunggu"]);
  renderEditorRows();

  requestAnimationFrame(() => {
    const inputs = document.querySelectorAll(".cell-input");
    const lastRowInputs = Array.from(inputs).slice(-editing.columns.length);
    lastRowInputs[0]?.focus();
  });
});

$("#editorBody").addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-row]");
  if (!button) return;

  collectEditingData();
  const rowIndex = Number(button.dataset.deleteRow);

  if (editing.rows.length <= 1) {
    showToast("Minimal harus ada 1 baris data.");
    return;
  }

  editing.rows.splice(rowIndex, 1);
  renderEditorRows();
});

$("#saveCustom").addEventListener("click", () => {
  collectEditingData();

  if (!editing.title) editing.title = "MEMBER TERPILIH";
  if (!editing.provider) editing.provider = "PRAGMATIC PLAY";
  editing.columns = editing.columns.map((col, i) => col || `Kolom ${i + 1}`);

  config = normalizeConfig(editing);
  saveToStorage();
  renderMain();
  closeModal();
  showToast("Custom berhasil disimpan.");
});

$("#resetDemo").addEventListener("click", () => {
  const confirmed = confirm(
    "Reset Demo akan menghapus customisasi tersimpan dan mengembalikan data awal. Lanjutkan?"
  );
  if (!confirmed) return;

  config = deepClone(DEMO);
  editing = deepClone(DEMO);
  localStorage.removeItem(STORAGE_KEY);
  renderMain();
  fillCustomForm();
  showToast("Data demo berhasil dikembalikan.");
});

$("#prevPage").addEventListener("click", () => {
  config.page = Math.max(1, config.page - 1);
  saveToStorage();
  renderMain();
});

$("#nextPage").addEventListener("click", () => {
  config.page += 1;
  saveToStorage();
  renderMain();
});

// Refresh real-time clock without reloading the page.
setInterval(() => {
  if (config.timeMode === "realtime") renderMain();
}, 1000);

renderMain();
