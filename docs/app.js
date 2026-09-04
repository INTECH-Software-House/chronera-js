import * as Chronera from "./chronera/index.js";

// DOM Elements
const dateInput = document.getElementById("matrix-date-input");
const quickJumpButtons = document.querySelectorAll(".quick-jump-btn");
const timezoneSelect = document.getElementById("tz-select");
const tzPatternSelect = document.getElementById("tz-pattern-select");
const tzOutput = document.getElementById("tz-output");
const tzOffsetBadge = document.getElementById("tz-offset-badge");
const tzDstBadge = document.getElementById("tz-dst-badge");
const bizStartDate = document.getElementById("biz-start-date");
const bizAmount = document.getElementById("biz-amount");
const bizOutput = document.getElementById("biz-output");
const bizTimeline = document.getElementById("biz-timeline");
const themeToggle = document.getElementById("theme-toggle");

// Initialize state
let currentDate = new Date();

// --- 1. Multi-Calendar Matrix ---
function updateCalendarMatrix() {
  if (!dateInput) return;
  const val = dateInput.value;
  if (!val) return;

  const [yStr, mStr, dStr] = val.split("-");
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  try {
    const lDate = Chronera.localDate(year, month, day);

    // 1. Gregorian & ISO
    const isoCard = document.getElementById("card-iso");
    if (isoCard) {
      isoCard.querySelector(".card-value").textContent =
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      isoCard.querySelector(".card-detail").textContent = Chronera.formatDate(
        lDate,
        { dateStyle: "full" },
      );
    }

    // 2. Thai Buddhist (พ.ศ.)
    const thaiCard = document.getElementById("card-thai");
    if (thaiCard) {
      const conv = Chronera.convertCalendarDate(
        {
          kind: "calendar-date",
          calendar: "gregory",
          year,
          monthCode: `M${String(month).padStart(2, "0")}`,
          day,
        },
        "buddhist",
      );
      const officialStr = Chronera.formatThaiOfficialPreset(
        conv.value,
        "thai-official-date-with-weekday",
        conv.value.day,
      );
      thaiCard.querySelector(".card-value").textContent =
        `พ.ศ. ${conv.value.year} (${officialStr})`;
      thaiCard.querySelector(".card-detail").textContent =
        `ปี ${conv.value.year} เดือน ${conv.value.month} วันที่ ${conv.value.day}`;
    }

    // 3. Japanese Era (令和/平成/昭和)
    const japCard = document.getElementById("card-japanese");
    if (japCard) {
      const conv = Chronera.convertCalendarDate(
        {
          kind: "calendar-date",
          calendar: "gregory",
          year,
          monthCode: `M${String(month).padStart(2, "0")}`,
          day,
        },
        "japanese",
      );
      const eraStr = Chronera.formatJapaneseOfficialWithWeekdayPreset(
        conv.value,
        0,
        { fullWeekday: true },
      );
      japCard.querySelector(".card-value").textContent = eraStr;
      japCard.querySelector(".card-detail").textContent =
        `Era: ${conv.value.era ?? "Reiwa"} Year ${conv.value.eraYear ?? conv.value.year}`;
    }

    // 4. Taiwan Minguo (民國)
    const rocCard = document.getElementById("card-roc");
    if (rocCard) {
      const conv = Chronera.convertCalendarDate(
        {
          kind: "calendar-date",
          calendar: "gregory",
          year,
          monthCode: `M${String(month).padStart(2, "0")}`,
          day,
        },
        "roc",
      );
      const rocStr = Chronera.formatTaiwanOfficialPreset(conv.value, 0, {
        weekday: "full",
      });
      rocCard.querySelector(".card-value").textContent = rocStr;
      rocCard.querySelector(".card-detail").textContent =
        `民國 ${conv.value.year}年 ${conv.value.month}月 ${conv.value.day}日`;
    }

    // 5. Islamic Hijri (Umm al-Qura)
    const hijriCard = document.getElementById("card-hijri");
    if (hijriCard) {
      const conv = Chronera.convertCalendarDate(
        {
          kind: "calendar-date",
          calendar: "gregory",
          year,
          monthCode: `M${String(month).padStart(2, "0")}`,
          day,
        },
        "islamic-umalqura",
      );
      const hijriStr = Chronera.formatArabicHijriPreset(conv.value, 0);
      hijriCard.querySelector(".card-value").textContent = hijriStr;
      hijriCard.querySelector(".card-detail").textContent =
        `Year ${conv.value.year} AH, Month ${conv.value.month}, Day ${conv.value.day}`;
    }

    // 6. Persian Jalali
    const persianCard = document.getElementById("card-persian");
    if (persianCard) {
      const conv = Chronera.convertCalendarDate(
        {
          kind: "calendar-date",
          calendar: "gregory",
          year,
          monthCode: `M${String(month).padStart(2, "0")}`,
          day,
        },
        "persian",
      );
      persianCard.querySelector(".card-value").textContent =
        `${conv.value.year}/${conv.value.month}/${conv.value.day} AP`;
      persianCard.querySelector(".card-detail").textContent =
        `Solar Hijri Year ${conv.value.year}`;
    }

    // 7. Indian National Saka
    const indianCard = document.getElementById("card-indian");
    if (indianCard) {
      const conv = Chronera.convertCalendarDate(
        {
          kind: "calendar-date",
          calendar: "gregory",
          year,
          monthCode: `M${String(month).padStart(2, "0")}`,
          day,
        },
        "indian",
      );
      indianCard.querySelector(".card-value").textContent =
        `${conv.value.year}-${conv.value.month}-${conv.value.day} Saka`;
      indianCard.querySelector(".card-detail").textContent =
        `Saka Era ${conv.value.year}`;
    }

    // Update Live Code snippet
    const codeSnippet = document.getElementById("live-matrix-code");
    if (codeSnippet) {
      codeSnippet.textContent = `// Converted using @intech-software/chronera
const date = localDate(${year}, ${month}, ${day});
const thai = convertCalendarDate(date, "buddhist"); // พ.ศ. ${year + 543}
const jap = convertCalendarDate(date, "japanese");  // Japanese Era
const roc = convertCalendarDate(date, "roc");       // 民國 Minguo
const hijri = convertCalendarDate(date, "islamic-umalqura"); // Hijri AH`;
    }
  } catch (err) {
    console.error("Matrix conversion error:", err);
  }
}

// --- 2. Global TimeZone Studio ---
function updateTimeZoneStudio() {
  if (!timezoneSelect || !tzPatternSelect || !tzOutput) return;

  const tz = timezoneSelect.value;
  const pattern = tzPatternSelect.value;
  const now = new Date();

  try {
    const formatted = Chronera.formatInTimeZone(now, tz, pattern);
    tzOutput.textContent = formatted;

    const offsetInfo = Chronera.getTimeZoneOffset(tz, now, "object");
    if (tzOffsetBadge) {
      tzOffsetBadge.textContent = `UTC Offset: ${offsetInfo.formatted} (${offsetInfo.minutes} min)`;
    }
    if (tzDstBadge) {
      tzDstBadge.textContent = offsetInfo.isDst
        ? "DST Active (Summer)"
        : "Standard Time";
      tzDstBadge.className = offsetInfo.isDst
        ? "badge badge-amber"
        : "badge badge-emerald";
    }

    const tzCode = document.getElementById("live-tz-code");
    if (tzCode) {
      tzCode.textContent = `// Real-time TimeZone Formatting
const now = new Date(); // ${now.toISOString()}
const formatted = formatInTimeZone(now, "${tz}", "${pattern}");
// -> "${formatted}"

const offset = getTimeZoneOffset("${tz}", now, "object");
// -> { formatted: "${offsetInfo.formatted}", minutes: ${offsetInfo.minutes}, isDst: ${offsetInfo.isDst} }`;
    }
  } catch (err) {
    console.error("TimeZone formatting error:", err);
  }
}

// --- 3. Business Days Simulator ---
function updateBusinessDaysSimulator() {
  if (!bizStartDate || !bizAmount || !bizOutput) return;

  const val = bizStartDate.value;
  const amount = parseInt(bizAmount.value, 10) || 0;
  if (!val) return;

  const [y, m, d] = val.split("-").map(Number);

  try {
    const start = Chronera.localDate(y, m, d);
    const result = Chronera.addBusinessDays(start, amount);
    const isWknd = Chronera.isWeekend(start);

    bizOutput.innerHTML = `
      <div class="text-lg font-bold text-sky-400">Result Date: ${result.year}-${String(result.month).padStart(2, "0")}-${String(result.day).padStart(2, "0")}</div>
      <div class="text-sm text-slate-400 mt-1">
        Start Day: ${isWknd ? "⚠️ Weekend (Saturday/Sunday)" : "✅ Weekday (Working Day)"} • Days Added: ${amount} business days
      </div>
    `;

    // Render 7-day timeline preview
    if (bizTimeline) {
      bizTimeline.innerHTML = "";
      let cur = start;
      const step = amount >= 0 ? 1 : -1;
      const totalSteps = Math.min(Math.abs(amount) + 5, 14);

      for (let i = 0; i <= totalSteps; i++) {
        const isCurWeekend = Chronera.isWeekend(cur);
        const el = document.createElement("div");
        el.className = `p-2 rounded text-center text-xs font-mono border ${
          isCurWeekend
            ? "bg-rose-950/30 border-rose-800/40 text-rose-300"
            : "bg-slate-800/60 border-slate-700/60 text-emerald-300"
        }`;
        el.innerHTML = `<div>${cur.month}/${cur.day}</div><div class="text-[10px] opacity-75">${isCurWeekend ? "Weekend" : "Business"}</div>`;
        bizTimeline.appendChild(el);
        cur = Chronera.addDays(cur, step);
      }
    }

    const bizCode = document.getElementById("live-biz-code");
    if (bizCode) {
      bizCode.textContent = `// Business Days Calculation
const orderDate = localDate(${y}, ${m}, ${d});
const deliveryDate = addBusinessDays(orderDate, ${amount});
// Result: ${result.year}-${String(result.month).padStart(2, "0")}-${String(result.day).padStart(2, "0")}

const isOrderOnWeekend = isWeekend(orderDate); // ${isWknd}`;
    }
  } catch (err) {
    console.error("Business days calculation error:", err);
  }
}

// --- Package Manager Install Command Switcher ---
function initInstallSwitcher() {
  const pmButtons = document.querySelectorAll(".pm-tab-btn");
  const installCmd = document.getElementById("install-command");
  const copyBtn = document.getElementById("copy-install-btn");

  const commands = {
    pnpm: "pnpm add @intech-software/chronera",
    npm: "npm install @intech-software/chronera",
    yarn: "yarn add @intech-software/chronera",
    bun: "bun add @intech-software/chronera",
  };

  pmButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      pmButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const pm = btn.getAttribute("data-pm");
      if (installCmd && commands[pm]) {
        installCmd.textContent = commands[pm];
      }
    });
  });

  if (copyBtn && installCmd) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(installCmd.textContent.trim()).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = "<span>Copied! ✓</span>";
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      });
    });
  }
}

// --- Quick Jump Buttons ---
function initQuickJumps() {
  quickJumpButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetDate = btn.getAttribute("data-date");
      if (targetDate && dateInput) {
        if (targetDate === "today") {
          const now = new Date();
          dateInput.value = now.toISOString().split("T")[0];
        } else {
          dateInput.value = targetDate;
        }
        updateCalendarMatrix();
      }
    });
  });
}

// --- Documentation Tabs ---
function initDocTabs() {
  const docTabs = document.querySelectorAll(".doc-tab-btn");
  const docContents = document.querySelectorAll(".doc-content-pane");

  docTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      docTabs.forEach((t) => t.classList.remove("active"));
      docContents.forEach((c) => c.classList.add("hidden"));

      tab.classList.add("active");
      const targetId = tab.getAttribute("data-target");
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.remove("hidden");
      }
    });
  });
}

// --- Theme Toggle ---
function initThemeToggle() {
  if (!themeToggle) return;
  const savedTheme = localStorage.getItem("chronera-theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  themeToggle.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("chronera-theme", next);
  });
}

// Global bootstrap
document.addEventListener("DOMContentLoaded", () => {
  // Set default dates
  const todayStr = new Date().toISOString().split("T")[0];
  if (dateInput) dateInput.value = todayStr;
  if (bizStartDate) bizStartDate.value = todayStr;

  initInstallSwitcher();
  initQuickJumps();
  initDocTabs();
  initThemeToggle();

  // Listeners
  if (dateInput) dateInput.addEventListener("input", updateCalendarMatrix);
  if (timezoneSelect)
    timezoneSelect.addEventListener("change", updateTimeZoneStudio);
  if (tzPatternSelect)
    tzPatternSelect.addEventListener("change", updateTimeZoneStudio);
  if (bizStartDate)
    bizStartDate.addEventListener("input", updateBusinessDaysSimulator);
  if (bizAmount)
    bizAmount.addEventListener("input", updateBusinessDaysSimulator);

  // Initial runs
  updateCalendarMatrix();
  updateTimeZoneStudio();
  updateBusinessDaysSimulator();

  // Live timer for timezone clock
  setInterval(updateTimeZoneStudio, 1000);
});
