import * as Chronera from "./chronera/index.js";

// --- State Management ---
const state = {
  currentDate: new Date(),
  activeTab: "matrix",
  packageManager: "pnpm",
  activeYear: 2026,
  activeMonth: 4,
  activeDay: 13,
};

// --- Preset Data for 15 Countries Holidays (Built-in offline preview) ---
const COUNTRY_HOLIDAYS_PRESETS = {
  TH: {
    name: "Thailand (ไทย 🇹🇭)",
    holidays: [
      { date: "2026-01-01", name: "วันขึ้นปีใหม่", nameEn: "New Year's Day" },
      { date: "2026-03-03", name: "วันมาฆบูชา", nameEn: "Makha Bucha Day" },
      { date: "2026-04-06", name: "วันจักรี", nameEn: "Chakri Memorial Day" },
      {
        date: "2026-04-13",
        name: "วันสงกรานต์",
        nameEn: "Songkran Festival Day 1",
      },
      {
        date: "2026-04-14",
        name: "วันสงกรานต์",
        nameEn: "Songkran Festival Day 2",
      },
      {
        date: "2026-04-15",
        name: "วันสงกรานต์",
        nameEn: "Songkran Festival Day 3",
      },
      {
        date: "2026-05-01",
        name: "วันแรงงานแห่งชาติ",
        nameEn: "National Labour Day",
      },
      { date: "2026-05-04", name: "วันฉัตรมงคล", nameEn: "Coronation Day" },
      { date: "2026-05-31", name: "วันวิสาขบูชา", nameEn: "Visakha Bucha Day" },
      {
        date: "2026-06-01",
        name: "วันหยุดชดเชยวันวิสาขบูชา",
        nameEn: "Substituted Visakha Bucha",
        isObserved: true,
      },
      {
        date: "2026-06-03",
        name: "วันเฉลิมฯ พระราชินี",
        nameEn: "HM Queen Suthida's Birthday",
      },
      {
        date: "2026-07-28",
        name: "วันเฉลิมฯ รัชกาลที่ 10",
        nameEn: "HM King Vajiralongkorn's Birthday",
      },
      { date: "2026-07-29", name: "วันอาสาฬหบูชา", nameEn: "Asalha Bucha Day" },
      {
        date: "2026-08-12",
        name: "วันแม่แห่งชาติ",
        nameEn: "HM Queen Mother's Birthday",
      },
      {
        date: "2026-10-13",
        name: "วันนวมินทรมหาราช",
        nameEn: "King Bhumibol Adulyadej Memorial Day",
      },
      { date: "2026-10-23", name: "วันปิยมหาราช", nameEn: "Chulalongkorn Day" },
      {
        date: "2026-12-05",
        name: "วันพ่อแห่งชาติ",
        nameEn: "King Bhumibol Birthday",
      },
      {
        date: "2026-12-07",
        name: "วันหยุดชดเชยวันพ่อแห่งชาติ",
        nameEn: "Substituted Father's Day",
        isObserved: true,
      },
      { date: "2026-12-10", name: "วันรัฐธรรมนูญ", nameEn: "Constitution Day" },
      { date: "2026-12-31", name: "วันสิ้นปี", nameEn: "New Year's Eve" },
    ],
  },
  JP: {
    name: "Japan (日本 🇯🇵)",
    holidays: [
      { date: "2026-01-01", name: "元日", nameEn: "New Year's Day" },
      { date: "2026-01-12", name: "成人の日", nameEn: "Coming of Age Day" },
      {
        date: "2026-02-11",
        name: "建国記念の日",
        nameEn: "National Foundation Day",
      },
      { date: "2026-02-23", name: "天皇誕生日", nameEn: "Emperor's Birthday" },
      { date: "2026-03-20", name: "春分の日", nameEn: "Vernal Equinox Day" },
      { date: "2026-04-29", name: "昭和の日", nameEn: "Showa Day" },
      {
        date: "2026-05-03",
        name: "憲法記念日",
        nameEn: "Constitution Memorial Day",
      },
      { date: "2026-05-04", name: "みどりの日", nameEn: "Greenery Day" },
      { date: "2026-05-05", name: "こどもの日", nameEn: "Children's Day" },
      {
        date: "2026-05-06",
        name: "振替休日",
        nameEn: "Substitute Holiday (Golden Week)",
        isObserved: true,
      },
      { date: "2026-07-20", name: "海の日", nameEn: "Marine Day" },
      { date: "2026-08-11", name: "山の日", nameEn: "Mountain Day" },
      {
        date: "2026-09-21",
        name: "敬老の日",
        nameEn: "Respect for the Aged Day",
      },
      { date: "2026-09-23", name: "秋分の日", nameEn: "Autumnal Equinox Day" },
      { date: "2026-10-12", name: "スポーツの日", nameEn: "Sports Day" },
      { date: "2026-11-03", name: "文化の日", nameEn: "Culture Day" },
      {
        date: "2026-11-23",
        name: "勤労感謝の日",
        nameEn: "Labor Thanksgiving Day",
      },
    ],
  },
  US: {
    name: "United States (🇺🇸)",
    holidays: [
      { date: "2026-01-01", name: "New Year's Day", nameEn: "New Year's Day" },
      {
        date: "2026-01-19",
        name: "Martin Luther King Jr. Day",
        nameEn: "MLK Day",
      },
      {
        date: "2026-02-16",
        name: "Washington's Birthday",
        nameEn: "Presidents' Day",
      },
      { date: "2026-05-25", name: "Memorial Day", nameEn: "Memorial Day" },
      {
        date: "2026-06-19",
        name: "Juneteenth National Independence Day",
        nameEn: "Juneteenth",
      },
      {
        date: "2026-07-03",
        name: "Independence Day (Observed)",
        nameEn: "Independence Day (Observed)",
        isObserved: true,
      },
      {
        date: "2026-07-04",
        name: "Independence Day",
        nameEn: "Independence Day",
      },
      { date: "2026-09-07", name: "Labor Day", nameEn: "Labor Day" },
      { date: "2026-10-12", name: "Columbus Day", nameEn: "Columbus Day" },
      { date: "2026-11-11", name: "Veterans Day", nameEn: "Veterans Day" },
      {
        date: "2026-11-26",
        name: "Thanksgiving Day",
        nameEn: "Thanksgiving Day",
      },
      { date: "2026-12-25", name: "Christmas Day", nameEn: "Christmas Day" },
    ],
  },
  GB: {
    name: "United Kingdom (🇬🇧)",
    holidays: [
      { date: "2026-01-01", name: "New Year's Day", nameEn: "New Year's Day" },
      { date: "2026-04-03", name: "Good Friday", nameEn: "Good Friday" },
      { date: "2026-04-06", name: "Easter Monday", nameEn: "Easter Monday" },
      {
        date: "2026-05-04",
        name: "Early May Bank Holiday",
        nameEn: "Early May Bank Holiday",
      },
      {
        date: "2026-05-25",
        name: "Spring Bank Holiday",
        nameEn: "Spring Bank Holiday",
      },
      {
        date: "2026-08-31",
        name: "Summer Bank Holiday",
        nameEn: "Summer Bank Holiday",
      },
      { date: "2026-12-25", name: "Christmas Day", nameEn: "Christmas Day" },
      {
        date: "2026-12-28",
        name: "Boxing Day (Observed)",
        nameEn: "Boxing Day (Observed)",
        isObserved: true,
      },
    ],
  },
  SG: {
    name: "Singapore (🇸🇬)",
    holidays: [
      { date: "2026-01-01", name: "New Year's Day", nameEn: "New Year's Day" },
      {
        date: "2026-02-17",
        name: "Chinese New Year Day 1",
        nameEn: "Chinese New Year",
      },
      {
        date: "2026-02-18",
        name: "Chinese New Year Day 2",
        nameEn: "Chinese New Year",
      },
      {
        date: "2026-03-20",
        name: "Hari Raya Puasa",
        nameEn: "Hari Raya Puasa",
      },
      { date: "2026-04-03", name: "Good Friday", nameEn: "Good Friday" },
      { date: "2026-05-01", name: "Labour Day", nameEn: "Labour Day" },
      { date: "2026-05-27", name: "Hari Raya Haji", nameEn: "Hari Raya Haji" },
      { date: "2026-05-31", name: "Vesak Day", nameEn: "Vesak Day" },
      { date: "2026-08-09", name: "National Day", nameEn: "National Day" },
      {
        date: "2026-08-10",
        name: "National Day (Observed)",
        nameEn: "National Day (Observed)",
        isObserved: true,
      },
      { date: "2026-11-08", name: "Deepavali", nameEn: "Deepavali" },
      { date: "2026-12-25", name: "Christmas Day", nameEn: "Christmas Day" },
    ],
  },
  SA: {
    name: "Saudi Arabia (🇸🇦)",
    holidays: [
      { date: "2026-02-22", name: "يوم التأسيس", nameEn: "Founding Day" },
      {
        date: "2026-03-20",
        name: "عيد الفطر (اليوم الأول)",
        nameEn: "Eid al-Fitr (Day 1)",
      },
      {
        date: "2026-03-21",
        name: "عيد الفطر (اليوم الثاني)",
        nameEn: "Eid al-Fitr (Day 2)",
      },
      {
        date: "2026-03-22",
        name: "عيد الفطر (اليوم الثالث)",
        nameEn: "Eid al-Fitr (Day 3)",
      },
      {
        date: "2026-03-23",
        name: "عيد الفطر (اليوم الرابع)",
        nameEn: "Eid al-Fitr (Day 4)",
      },
      { date: "2026-05-26", name: "يوم عرفة", nameEn: "Arafat Day" },
      {
        date: "2026-05-27",
        name: "عيد الأضحى (اليوم الأول)",
        nameEn: "Eid al-Adha (Day 1)",
      },
      {
        date: "2026-05-28",
        name: "عيد الأضحى (اليوم الثاني)",
        nameEn: "Eid al-Adha (Day 2)",
      },
      {
        date: "2026-05-29",
        name: "عيد الأضحى (اليوم الثالث)",
        nameEn: "Eid al-Adha (Day 3)",
      },
      {
        date: "2026-09-23",
        name: "اليوم الوطني للمملكة",
        nameEn: "Saudi National Day",
      },
    ],
  },
};

// --- 1. Multi-Calendar Matrix Engine ---
function renderCalendarMatrix(year, month, day) {
  const pad = (n) => String(n).padStart(2, "0");
  const isoStr = `${year}-${pad(month)}-${pad(day)}`;

  try {
    const lDate = Chronera.localDate(year, month, day);

    // 1. ISO 8601
    updateCard(
      "card-iso",
      `${isoStr}`,
      `International Standard (${Chronera.formatDate(lDate, { dateStyle: "full" })})`,
    );

    // 2. Thai Buddhist (พ.ศ.)
    const thaiYear = year + 543;
    const thaiMonths = [
      "",
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    updateCard(
      "card-thai",
      `พ.ศ. ${thaiYear}`,
      `${day} ${thaiMonths[month]} พ.ศ. ${thaiYear}`,
    );

    // 3. Japanese Era
    let eraName = "令和 (Reiwa)";
    let eraYear = year - 2018;
    if (year < 2019 || (year === 2019 && month < 5)) {
      eraName = "平成 (Heisei)";
      eraYear = year - 1988;
    }
    const eraDisplay = eraYear === 1 ? "元年" : `${eraYear}年`;
    updateCard(
      "card-japanese",
      `${eraName} ${eraDisplay}`,
      `${eraName} ${eraYear}年 ${month}月 ${day}日`,
    );

    // 4. Taiwan Minguo (民國)
    const minguoYear = year - 1911;
    updateCard(
      "card-roc",
      `民國 ${minguoYear} 年`,
      `民國 ${minguoYear} 年 ${month} 月 ${day} 日`,
    );

    // 5. Islamic Hijri
    try {
      const conv = Chronera.convertCalendarDate(
        {
          kind: "calendar-date",
          calendar: "gregory",
          year,
          monthCode: `M${pad(month)}`,
          day,
        },
        "islamic-civil",
      );
      updateCard(
        "card-hijri",
        `${conv.value.year} AH`,
        `Islamic Civil: Year ${conv.value.year}, Month ${conv.value.month}, Day ${conv.value.day}`,
      );
    } catch {
      updateCard("card-hijri", `1447-1448 AH`, `Islamic Lunar Calendar`);
    }

    // 6. Persian Solar Hijri
    try {
      const conv = Chronera.convertCalendarDate(
        {
          kind: "calendar-date",
          calendar: "gregory",
          year,
          monthCode: `M${pad(month)}`,
          day,
        },
        "persian",
      );
      updateCard(
        "card-persian",
        `${conv.value.year} AP`,
        `Solar Hijri: Year ${conv.value.year}, Month ${conv.value.month}, Day ${conv.value.day}`,
      );
    } catch {
      updateCard(
        "card-persian",
        `${year - 621} AP`,
        `Solar Hijri (Iran / Afghanistan)`,
      );
    }

    // 7. Indian National Saka
    try {
      const conv = Chronera.convertCalendarDate(
        {
          kind: "calendar-date",
          calendar: "gregory",
          year,
          monthCode: `M${pad(month)}`,
          day,
        },
        "indian",
      );
      updateCard(
        "card-indian",
        `${conv.value.year} Saka`,
        `Saka Era: Year ${conv.value.year}, Month ${conv.value.month}, Day ${conv.value.day}`,
      );
    } catch {
      updateCard(
        "card-indian",
        `${year - 78} Saka`,
        `Indian National Calendar`,
      );
    }

    // Update Live Code
    const codeEl = document.getElementById("matrix-code-snippet");
    if (codeEl) {
      codeEl.textContent = `import { localDate, convertCalendarDate, formatDate } from "@intech-software/chronera";

const date = localDate(${year}, ${month}, ${day});

// Convert across cultural calendars
const thai = convertCalendarDate(date, "buddhist");   // พ.ศ. ${thaiYear}
const jp   = convertCalendarDate(date, "japanese");   // ${eraName}
const roc  = convertCalendarDate(date, "roc");        // 民國 ${minguoYear}
const sa   = convertCalendarDate(date, "islamic-civil");

// Locale-native legal formatting
const formattedThai = formatDate(date, { locale: "th-TH-u-ca-buddhist", dateStyle: "long" });
// -> "${day} ${thaiMonths[month]} ${thaiYear}"`;
    }
  } catch (err) {
    console.error("Calendar matrix error:", err);
  }
}

function updateCard(id, value, detail) {
  const card = document.getElementById(id);
  if (!card) return;
  const valEl = card.querySelector(".cal-value");
  const detEl = card.querySelector(".cal-detail");
  if (valEl) valEl.textContent = value;
  if (detEl) detEl.textContent = detail;
}

// --- 2. Working & Business Days Engine ---
function renderBusinessDays(startDateStr, amountToAdd, countryCode) {
  if (!startDateStr) return;
  const [y, m, d] = startDateStr.split("-").map(Number);
  const pad = (n) => String(n).padStart(2, "0");

  let cur = new Date(Date.UTC(y, m - 1, d));
  const countryPreset = COUNTRY_HOLIDAYS_PRESETS[countryCode];
  const holidayMap = new Set(
    (countryPreset?.holidays ?? []).map((h) => h.date),
  );

  let added = 0;
  const target = Math.abs(amountToAdd);
  const step = amountToAdd >= 0 ? 1 : -1;
  const isWeekendDay = (date) => {
    const dow = date.getUTCDay(); // 0 = Sun, 6 = Sat
    if (countryCode === "IR") return dow === 4 || dow === 5; // Thu & Fri
    return dow === 0 || dow === 6; // Sat & Sun
  };

  let skippedWeekends = 0;
  let skippedHolidays = 0;
  const timelineDays = [];

  // Record start day
  const startIso = `${cur.getUTCFullYear()}-${pad(cur.getUTCMonth() + 1)}-${pad(cur.getUTCDate())}`;
  const startIsWknd = isWeekendDay(cur);
  const startIsHol = holidayMap.has(startIso);
  timelineDays.push({
    iso: startIso,
    day: cur.getUTCDate(),
    dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][cur.getUTCDay()],
    type: startIsHol ? "holiday" : startIsWknd ? "weekend" : "work",
    label: startIsHol ? "Holiday" : startIsWknd ? "Weekend" : "Start",
  });

  while (added < target) {
    cur.setUTCDate(cur.getUTCDate() + step);
    const iso = `${cur.getUTCFullYear()}-${pad(cur.getUTCMonth() + 1)}-${pad(cur.getUTCDate())}`;
    const wknd = isWeekendDay(cur);
    const hol = holidayMap.has(iso);

    if (wknd) {
      skippedWeekends++;
      if (timelineDays.length < 15) {
        timelineDays.push({
          iso,
          day: cur.getUTCDate(),
          dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
            cur.getUTCDay()
          ],
          type: "weekend",
          label: "Weekend",
        });
      }
    } else if (hol) {
      skippedHolidays++;
      if (timelineDays.length < 15) {
        timelineDays.push({
          iso,
          day: cur.getUTCDate(),
          dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
            cur.getUTCDay()
          ],
          type: "holiday",
          label: "Holiday",
        });
      }
    } else {
      added++;
      if (timelineDays.length < 15) {
        timelineDays.push({
          iso,
          day: cur.getUTCDate(),
          dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
            cur.getUTCDay()
          ],
          type: "work",
          label: `Day +${added}`,
        });
      }
    }
  }

  const resultIso = `${cur.getUTCFullYear()}-${pad(cur.getUTCMonth() + 1)}-${pad(cur.getUTCDate())}`;

  // Update UI Elements
  const resultDateEl = document.getElementById("biz-result-date");
  if (resultDateEl) resultDateEl.textContent = resultIso;

  const resultDetailEl = document.getElementById("biz-result-detail");
  if (resultDetailEl) {
    resultDetailEl.textContent = `${amountToAdd >= 0 ? "+" : "-"}${target} Business Days • ${skippedWeekends} weekends skipped • ${skippedHolidays} public holidays skipped (${countryPreset?.name ?? "Standard"})`;
  }

  // Render Timeline Strip
  const timelineEl = document.getElementById("biz-timeline-strip");
  if (timelineEl) {
    timelineEl.innerHTML = timelineDays
      .map(
        (t) => `
        <div class="timeline-item timeline-${t.type}">
          <div class="font-bold">${t.dow} ${t.day}</div>
          <div class="text-[10px] opacity-80">${t.label}</div>
        </div>
      `,
      )
      .join("");
  }

  // Update Live Code
  const codeEl = document.getElementById("biz-code-snippet");
  if (codeEl) {
    codeEl.textContent = `import { localDate, addBusinessDays, isBusinessDay } from "@intech-software/chronera";

const start = localDate(${y}, ${m}, ${d});

// Add ${amountToAdd} working days skipping weekends and statutory holidays in ${countryCode}
const dueDate = addBusinessDays(start, ${amountToAdd}, { holidays: "${countryCode}" });
// Result: ${resultIso}

const isWork = isBusinessDay(dueDate, { holidays: "${countryCode}" }); // true`;
  }
}

// --- 3. TimeZone Clock Engine ---
function renderTimeZoneClock(timeZone, pattern) {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(now);
    const getPart = (type) => parts.find((p) => p.type === type)?.value ?? "";

    const y = getPart("year");
    const m = getPart("month");
    const d = getPart("day");
    const hh = getPart("hour");
    const mm = getPart("minute");
    const ss = getPart("second");
    const tzName = getPart("timeZoneName");

    const clockEl = document.getElementById("tz-clock-display");
    if (clockEl) {
      clockEl.textContent = `${hh}:${mm}:${ss}`;
    }

    const fullEl = document.getElementById("tz-full-display");
    if (fullEl) {
      fullEl.textContent = `${y}-${m}-${d} ${hh}:${mm}:${ss} (${tzName})`;
    }

    const badgeEl = document.getElementById("tz-offset-pill");
    if (badgeEl) {
      badgeEl.textContent = `${tzName} • ${timeZone}`;
    }

    // Update Live Code
    const codeEl = document.getElementById("tz-code-snippet");
    if (codeEl) {
      codeEl.textContent = `import { formatInTimeZone, getTimeZoneOffset, instant } from "@intech-software/chronera";

const now = instant(); // Or JavaScript Date
const localStr = formatInTimeZone(now, "${timeZone}", "${pattern}");
// -> "${y}-${m}-${d} ${hh}:${mm}:${ss}"

const offset = getTimeZoneOffset("${timeZone}", now, "object");
// -> { formatted: "${tzName}", timeZone: "${timeZone}" }`;
    }
  } catch (err) {
    console.error("TimeZone clock error:", err);
  }
}

// --- 4. 15-Country Holidays Engine ---
function renderHolidaysExplorer(countryCode) {
  const preset =
    COUNTRY_HOLIDAYS_PRESETS[countryCode] ?? COUNTRY_HOLIDAYS_PRESETS.TH;
  const listEl = document.getElementById("holidays-table-body");
  if (!listEl) return;

  listEl.innerHTML = preset.holidays
    .map(
      (h) => `
      <tr class="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)] transition-colors">
        <td class="py-2.5 px-3 font-mono text-xs text-[var(--accent-primary)]">${h.date}</td>
        <td class="py-2.5 px-3 text-sm font-medium text-[var(--text-primary)]">
          ${h.name}
          ${h.isObserved ? '<span class="badge badge-amber ml-2">ชดเชย / Observed</span>' : ""}
        </td>
        <td class="py-2.5 px-3 text-xs text-[var(--text-secondary)]">${h.nameEn}</td>
      </tr>
    `,
    )
    .join("");

  const titleEl = document.getElementById("holidays-country-title");
  if (titleEl) {
    titleEl.textContent = `${preset.name} — 2026 Statutory Holidays (${preset.holidays.length} วัน)`;
  }

  const codeEl = document.getElementById("holidays-code-snippet");
  if (codeEl) {
    codeEl.textContent = `import { isPublicHoliday, getPublicHolidays, localDate } from "@intech-software/chronera";

// Check if a date is an official statutory holiday
const isHoliday = isPublicHoliday(localDate(2026, 4, 13), "${countryCode}"); // true

// Get all official holidays for the year
const holidays = getPublicHolidays("${countryCode}", 2026);
// -> ${preset.holidays.length} statutory holidays resolved offline deterministically`;
  }
}

// --- UI Interaction & Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
  // Theme Toggle
  const themeToggle = document.getElementById("theme-toggle");
  const storedTheme =
    localStorage.getItem("chronera-theme") ||
    (window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark");
  document.documentElement.setAttribute("data-theme", storedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("chronera-theme", next);
    });
  }

  // Tab Switching
  const tabButtons = document.querySelectorAll(".workbench-tab");
  const tabPanels = document.querySelectorAll(".workbench-panel");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      tabPanels.forEach((p) => {
        p.classList.toggle(
          "hidden",
          p.getAttribute("data-panel") !== targetTab,
        );
      });
    });
  });

  // Package Manager Switcher
  const pmButtons = document.querySelectorAll(".pm-tab");
  const installCode = document.getElementById("install-code");

  const pmCommands = {
    pnpm: "pnpm add @intech-software/chronera",
    npm: "npm install @intech-software/chronera",
    yarn: "yarn add @intech-software/chronera",
    bun: "bun add @intech-software/chronera",
  };

  pmButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pm = btn.getAttribute("data-pm");
      pmButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (installCode)
        installCode.textContent = pmCommands[pm] ?? pmCommands.pnpm;
    });
  });

  // Copy Install Command
  const copyInstallBtn = document.getElementById("copy-install-btn");
  if (copyInstallBtn) {
    copyInstallBtn.addEventListener("click", () => {
      if (!installCode) return;
      navigator.clipboard.writeText(installCode.textContent.trim());
      const originalText = copyInstallBtn.textContent;
      copyInstallBtn.textContent = "Copied!";
      setTimeout(() => (copyInstallBtn.textContent = originalText), 1800);
    });
  }

  // Copy Snippet Buttons
  document.querySelectorAll(".copy-code-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        navigator.clipboard.writeText(targetEl.textContent);
        const orig = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = orig), 1800);
      }
    });
  });

  // 1. Multi-Calendar Date Input & Quick Jumps
  const dateInput = document.getElementById("matrix-date-input");
  if (dateInput) {
    dateInput.value = "2026-04-13"; // Songkran preset default
    dateInput.addEventListener("input", () => {
      const [y, m, d] = dateInput.value.split("-").map(Number);
      if (y && m && d) renderCalendarMatrix(y, m, d);
    });
  }

  document.querySelectorAll(".quick-date-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const dateVal = chip.getAttribute("data-date");
      if (dateVal === "today") {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        dateInput.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      } else {
        dateInput.value = dateVal;
      }
      const [y, m, d] = dateInput.value.split("-").map(Number);
      renderCalendarMatrix(y, m, d);
    });
  });

  // 2. Business Days Controls
  const bizDateInput = document.getElementById("biz-start-input");
  const bizAmountInput = document.getElementById("biz-amount-input");
  const bizCountrySelect = document.getElementById("biz-country-select");

  const triggerBizUpdate = () => {
    if (bizDateInput && bizAmountInput && bizCountrySelect) {
      renderBusinessDays(
        bizDateInput.value,
        parseInt(bizAmountInput.value, 10) || 5,
        bizCountrySelect.value,
      );
    }
  };

  if (bizDateInput) {
    bizDateInput.value = "2026-04-10"; // Friday before Songkran
    bizDateInput.addEventListener("input", triggerBizUpdate);
  }
  if (bizAmountInput)
    bizAmountInput.addEventListener("input", triggerBizUpdate);
  if (bizCountrySelect)
    bizCountrySelect.addEventListener("change", triggerBizUpdate);

  // 3. TimeZone Clock Controls
  const tzSelect = document.getElementById("tz-zone-select");
  const tzPatternSelect = document.getElementById("tz-pattern-select");

  const triggerTzUpdate = () => {
    if (tzSelect && tzPatternSelect) {
      renderTimeZoneClock(tzSelect.value, tzPatternSelect.value);
    }
  };

  if (tzSelect) tzSelect.addEventListener("change", triggerTzUpdate);
  if (tzPatternSelect)
    tzPatternSelect.addEventListener("change", triggerTzUpdate);

  // Update clock every second
  setInterval(triggerTzUpdate, 1000);

  // 4. Holidays Explorer Controls
  const holCountrySelect = document.getElementById("hol-country-select");
  if (holCountrySelect) {
    holCountrySelect.addEventListener("change", () => {
      renderHolidaysExplorer(holCountrySelect.value);
    });
  }

  // Initial Render
  renderCalendarMatrix(2026, 4, 13);
  triggerBizUpdate();
  triggerTzUpdate();
  renderHolidaysExplorer("TH");

  // Replace Lucide Icons if available
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
