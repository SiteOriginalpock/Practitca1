document.addEventListener("DOMContentLoaded", function () {
  // --------------------------
  // Elemente
  // --------------------------
  const lunaSelect = document.getElementById("month");
  const saptamanaSelect = document.getElementById("week");
  const listSelect = document.getElementById("listSelect");
  const searchInput = document.getElementById("searchInput");
  const scheduleTable = document.querySelector(".schedule");
  const dayButtons = document.querySelectorAll(".week-days .day");
  const prevBtn = document.querySelector(".prev");
  const nextBtn = document.querySelector(".next");
  const monthlyButton = document.getElementById("monthly-btn");
  const monthlyCalendar = document.getElementById("monthly-calendar");
  const googleButton = document.getElementById("google-sync");
  const daysTable = document.querySelector(".days-table");

  const luni = {
    Ianuarie: 1, Februarie: 2, Martie: 3, Aprilie: 4,
    Mai: 5, Iunie: 6, Iulie: 7, August: 8,
    Septembrie: 9, Octombrie: 10, Noiembrie: 11, Decembrie: 12
  };

  let mockData = {
    grupe: [],
    profesori: [],
    aule: []
  };

  let mockSchedule = {
    "01.02.2025-07.02.2025": {
      Luni: ["Matematică - A101", "Informatica - B202"],
      Marți: ["Programare - C303"],
      Miercuri: [],
      Joi: ["Baze de date - A101"],
      Vineri: ["Engleză - B202"],
      Sâmbătă: [],
      Duminică: []
    },
    "08.02.2025-14.02.2025": {
      Luni: ["Algoritmi - A101"],
      Marți: ["Structuri de date - B202"],
      Miercuri: ["Fizică - C303"],
      Joi: [],
      Vineri: ["Matematică - B202"],
      Sâmbătă: [],
      Duminică: []
    }
  };

  // --------------------------
  // Funcții API
  // --------------------------
  async function fetchData(url) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) throw new Error(`Eroare API: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async function loadData() {
    mockData.grupe = await fetchData("https://localhost:5001/api/access/getGroups");
    mockData.profesori = await fetchData("/api/access/getTeachers");
    mockData.aule = await fetchData("/api/access/getOffices");

    renderList(mockData.grupe);
  }

  // --------------------------
  // Funcții UI
  // --------------------------
  function renderList(items) {
    listSelect.innerHTML = "";
    items.forEach(el => {
      const opt = document.createElement("option");
      opt.textContent = el;
      listSelect.appendChild(opt);
    });
  }

  function displaySchedule(week, day = null) {
    const schedule = mockSchedule[week] || {};
    const rows = scheduleTable.querySelectorAll("tr");
    rows.forEach((row, i) => {
      if (i === 0) return;
      const lessonCell = row.querySelector(".lesson");
      lessonCell.textContent = "";
    });

    if (!day) {
      let i = 1;
      for (const d in schedule) {
        const cell = scheduleTable.rows[i]?.querySelector(".lesson");
        if (cell) cell.textContent = schedule[d][0] || "";
        i++;
      }
    } else {
      const lessons = schedule[day] || [];
      lessons.forEach((l, idx) => {
        if (scheduleTable.rows[idx + 1]) {
          scheduleTable.rows[idx + 1].querySelector(".lesson").textContent = l;
        }
      });
    }
  }

  function generateWeeks(numeLuna, an = 2025) {
    saptamanaSelect.innerHTML = "";
    const luna = luni[numeLuna];
    const primaZi = new Date(an, luna - 1, 1);
    const ultimaZi = new Date(an, luna, 0);
    let nrSapt = 1;
    let ziStart = new Date(primaZi);

    while (ziStart <= ultimaZi) {
      let ziEnd = new Date(ziStart);
      ziEnd.setDate(ziEnd.getDate() + 6);
      if (ziEnd > ultimaZi) ziEnd = ultimaZi;

      const opt = document.createElement("option");
      opt.value = `${ziStart.getDate().toString().padStart(2,"0")}.${(luna).toString().padStart(2,"0")}.${ziStart.getFullYear()}-${ziEnd.getDate().toString().padStart(2,"0")}.${(luna).toString().padStart(2,"0")}.${ziEnd.getFullYear()}`;
      opt.textContent = `${nrSapt} (${ziStart.toLocaleDateString("ro-RO")} - ${ziEnd.toLocaleDateString("ro-RO")})`;
      saptamanaSelect.appendChild(opt);

      ziStart.setDate(ziStart.getDate() + 7);
      nrSapt++;
    }
  }

  function generateMonthlyCalendar() {
    monthlyCalendar.innerHTML = "";
    const monthIndex = lunaSelect.selectedIndex;
    const year = 2025;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const div = document.createElement("div");
      div.textContent = d;
      div.addEventListener("click", () => {
        const selectedWeek = saptamanaSelect.value;
        displaySchedule(selectedWeek);
      });
      monthlyCalendar.appendChild(div);
    }
  }

  function updateDaysTable(weekRange) {
    if (!weekRange) return;
    const [start, end] = weekRange.split("-");
    const [startDay, startMonth, startYear] = start.split(".");
    const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
    const dayNames = ["L", "Ma", "Mi", "J", "V", "S", "D"];
    let html = "";

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dayLabel = `${dayNames[i]} - ${d.getDate()}`;
      html += `<tr><td class="day-cell">${dayLabel}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
    }

    daysTable.innerHTML = html;
  }

  // --------------------------
  // Google Calendar API
  // --------------------------
  const CLIENT_ID = "1032261024939-1q9aebj74buitf610ho5h1vbbos1gt8b.apps.googleusercontent.com"; 
const API_KEY = "AIzaSyAxKPwwvJgEAhF69E56TfMa8Zev-iI4w0U"; 
const SCOPES = "https://www.googleapis.com/auth/calendar";

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
    scope: SCOPES
  }).then(() => {
    console.log("Google API gata!");
  });
}

function handleAuthClick() {
  const auth = gapi.auth2.getAuthInstance();
  if (!auth) {
    alert("Google API nu este încărcat. Reîncearcă după câteva secunde.");
    return;
  }
  auth.signIn().then(() => {
    console.log("Autentificat!");
    adaugaInCalendar();
  });
}

function adaugaInCalendar() {
  const event = {
    summary: "Curs: Programare Web",
    location: "Universitatea X",
    description: "Orar sincronizat din aplicația mea",
    start: { dateTime: "2025-10-01T10:00:00+03:00", timeZone: "Europe/Chisinau" },
    end:   { dateTime: "2025-10-01T12:00:00+03:00", timeZone: "Europe/Chisinau" }
  };

  gapi.client.calendar.events.insert({
    calendarId: "primary",
    resource: event
  }).then(resp => {
    console.log("Eveniment adăugat:", resp);
    alert("Orarul a fost sincronizat cu Google Calendar!");
  });
}

// La final, când pagina se încarcă
window.addEventListener("load", () => {
  gapi.load('client:auth2', initClient);
});

// Legăm butonul de sincronizare
googleButton.addEventListener("click", handleAuthClick);


/**
 * Adaugă un eveniment de test în Calendar
 */
function adaugaInCalendar() {
  const event = {
    summary: "Curs: Programare Web",
    location: "Universitatea X",
    description: "Orar sincronizat din aplicația mea",
    start: {
      dateTime: "2025-10-01T10:00:00+03:00",
      timeZone: "Europe/Chisinau",
    },
    end: {
      dateTime: "2025-10-01T12:00:00+03:00",
      timeZone: "Europe/Chisinau",
    },
  };

  gapi.client.calendar.events.insert({
    calendarId: "primary",
    resource: event,
  }).then((resp) => {
    console.log("Eveniment adăugat:", resp);
    alert("Orarul a fost sincronizat cu Google Calendar!");
  });
}
  googleButton.addEventListener("click", handleAuthClick);
  // --------------------------
  // Evenimente UI
  // --------------------------
  loadData();
  generateWeeks(lunaSelect.value);

  lunaSelect.addEventListener("change", () => {
    generateWeeks(lunaSelect.value);
  });

  saptamanaSelect.addEventListener("change", () => {
    const week = saptamanaSelect.value;
    displaySchedule(week);
    updateDaysTable(week);
  });

 // ... codul tău inițial rămâne până la secțiunea monthlyButton.addEventListener

let monthlyVisible = false;

monthlyButton.addEventListener("click", () => {
  monthlyVisible = !monthlyVisible;
  if (monthlyVisible) {
    generateMonthlyCalendar();
    monthlyCalendar.classList.remove("hidden");
    monthlyCalendar.scrollIntoView({ behavior: "smooth" });
  } else {
    monthlyCalendar.classList.add("hidden");
  }
});

// Actualizare calendar lunar când schimbăm luna
lunaSelect.addEventListener("change", () => {
  generateWeeks(lunaSelect.value);
  if (monthlyVisible) {
    generateMonthlyCalendar();
  }
});

// Next / Prev să actualizeze și luna automat
prevBtn.addEventListener("click", () => {
  if (saptamanaSelect.selectedIndex > 0) {
    saptamanaSelect.selectedIndex -= 1;
    saptamanaSelect.dispatchEvent(new Event("change"));
  } else {
    // Dacă suntem la prima săptămână, trece la luna anterioară
    if (lunaSelect.selectedIndex > 0) {
      lunaSelect.selectedIndex -= 1;
      lunaSelect.dispatchEvent(new Event("change"));
      saptamanaSelect.selectedIndex = saptamanaSelect.options.length - 1;
      saptamanaSelect.dispatchEvent(new Event("change"));
    }
  }
});

nextBtn.addEventListener("click", () => {
  if (saptamanaSelect.selectedIndex < saptamanaSelect.options.length - 1) {
    saptamanaSelect.selectedIndex += 1;
    saptamanaSelect.dispatchEvent(new Event("change"));
  } else {
    // Dacă suntem la ultima săptămână, trece la luna următoare
    if (lunaSelect.selectedIndex < lunaSelect.options.length - 1) {
      lunaSelect.selectedIndex += 1;
      lunaSelect.dispatchEvent(new Event("change"));
      saptamanaSelect.selectedIndex = 0;
      saptamanaSelect.dispatchEvent(new Event("change"));
    }
  }
});

// Actualizare calendar lunar și zilele când selectăm o săptămână
saptamanaSelect.addEventListener("change", () => {
  const week = saptamanaSelect.value;
  displaySchedule(week);
  updateDaysTable(week);
  if (monthlyVisible) {
    generateMonthlyCalendar();
  }
});

}); 


