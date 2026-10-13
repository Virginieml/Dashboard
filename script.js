
"use strict";

// ======================================
// KIGALI UPLINK - MAIN JAVASCRIPT
// ======================================

const ACCOUNT_KEY = "kigaliUplinkAccounts";
const USER_KEY = "kigaliUplinkCurrentUser";

// Kigali coordinates
const KIGALI_LAT = -1.9441;
const KIGALI_LON = 30.0619;


// ======================================
// ACCOUNT HELPERS
// ======================================

function getAccounts() {
    try {
        const accounts = JSON.parse(
            localStorage.getItem(ACCOUNT_KEY) || "[]"
        );

        return Array.isArray(accounts) ? accounts : [];
    } catch {
        return [];
    }
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
        return null;
    }
}

function showMessage(id, message, isError = false) {
    const element = document.getElementById(id);

    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#c04469" : "#218966";
}


// ======================================
// ACCOUNT PAGE: CREATE ACCOUNT / SIGN IN
// ======================================

function initAuth() {
    const signupForm = document.getElementById("signup-form");
    const signinForm = document.getElementById("signin-form");

    const signupTab = document.getElementById("show-signup");
    const signinTab = document.getElementById("show-signin");

    if (!signupForm || !signinForm || !signupTab || !signinTab) {
        return;
    }

    function showSignup() {
        signupForm.hidden = false;
        signinForm.hidden = true;

        signupTab.classList.add("active");
        signinTab.classList.remove("active");
    }

    function showSignin() {
        signupForm.hidden = true;
        signinForm.hidden = false;

        signinTab.classList.add("active");
        signupTab.classList.remove("active");
    }

    signupTab.addEventListener("click", showSignup);
    signinTab.addEventListener("click", showSignin);

    // CREATE ACCOUNT
    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("signup-name")
            .value.trim();

        const email = document.getElementById("signup-email")
            .value.trim().toLowerCase();

        const password = document.getElementById("signup-password")
            .value;

        if (!name || !email || password.length < 8) {
            showMessage(
                "signup-message",
                "Please complete all fields correctly.",
                true
            );
            return;
        }

        const accounts = getAccounts();

        const exists = accounts.some(
            account => account.email === email
        );

        if (exists) {
            showMessage(
                "signup-message",
                "This email already has an account. Please sign in.",
                true
            );
            return;
        }

        // Classroom demonstration only.
        // Real websites must use secure server-side authentication.
        const newAccount = {
            name: name,
            email: email,
            password: password
        };

        try {
            accounts.push(newAccount);

            localStorage.setItem(
                ACCOUNT_KEY,
                JSON.stringify(accounts)
            );

            localStorage.setItem(
                USER_KEY,
                JSON.stringify({
                    name: newAccount.name,
                    email: newAccount.email
                })
            );

            window.location.href = "dashboard.html";
        } catch {
            showMessage(
                "signup-message",
                "Account storage failed in this browser.",
                true
            );
        }
    });

    // SIGN IN
    signinForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("signin-email")
            .value.trim().toLowerCase();

        const password = document.getElementById("signin-password")
            .value;

        const account = getAccounts().find(
            item =>
                item.email === email &&
                item.password === password
        );

        if (!account) {
            showMessage(
                "signin-message",
                "Incorrect email or password. Please try again.",
                true
            );
            return;
        }

        try {
            localStorage.setItem(
                USER_KEY,
                JSON.stringify({
                    name: account.name,
                    email: account.email
                })
            );

            window.location.href = "dashboard.html";
        } catch {
            showMessage(
                "signin-message",
                "Could not sign in. Please try again.",
                true
            );
        }
    });
}


// ======================================
// PERSONALIZED DASHBOARD
// ======================================

function requireLogin() {
    const user = getCurrentUser();

    return user || {
        name: "Kigali User",
        email: "user@kigali.rw"
    };
}

function initDashboard() {
    const user = requireLogin();

    if (!user) return;

    const heading = document.getElementById("welcome-heading");
    if (heading) {
        heading.textContent = `Welcome, ${user.name}`;
    }

    const note = document.getElementById("dashboard-weather-note");
    if (note) {
        note.textContent = `Hello ${user.name}! Check the latest available weather for Kigali.`;
    }

    document.querySelectorAll("#sidebar-user-name, #topbar-user-name")
        .forEach(function (element) {
            element.textContent = user.name;
        });

    initDashboardCalendar();
    initDashboardSearch();
    initDashboardControls();
}

function initDashboardCalendar() {
    const monthLabel = document.getElementById("calendar-month");
    const daysContainer = document.getElementById("calendar-days");
    const previousButton = document.getElementById("calendar-previous");
    const nextButton = document.getElementById("calendar-next");

    if (!monthLabel || !daysContainer || !previousButton || !nextButton) return;

    const visibleMonth = new Date();
    visibleMonth.setDate(1);

    function renderCalendar() {
        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth();
        monthLabel.textContent = visibleMonth.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric"
        });
        daysContainer.replaceChildren();

        const firstDay = new Date(year, month, 1);
        const offset = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPreviousMonth = new Date(year, month, 0).getDate();
        const today = new Date();

        for (let index = 0; index < 42; index += 1) {
            let day = index - offset + 1;
            let outsideMonth = false;

            if (day < 1) {
                day = daysInPreviousMonth + day;
                outsideMonth = true;
            } else if (day > daysInMonth) {
                day -= daysInMonth;
                outsideMonth = true;
            }

            const dateButton = document.createElement("button");
            dateButton.type = "button";
            dateButton.className = "calendar-day";
            dateButton.textContent = day;
            dateButton.setAttribute("aria-label", new Date(
                year,
                month + (index < offset ? -1 : index >= offset + daysInMonth ? 1 : 0),
                day
            ).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric"
            }));

            if (outsideMonth) dateButton.classList.add("is-outside");
            if (
                !outsideMonth &&
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day
            ) {
                dateButton.classList.add("is-today");
                dateButton.setAttribute("aria-current", "date");
            }

            dateButton.addEventListener("click", function () {
                daysContainer.querySelectorAll(".is-selected")
                    .forEach(function (selectedDay) {
                        selectedDay.classList.remove("is-selected");
                    });
                dateButton.classList.add("is-selected");
            });
            daysContainer.appendChild(dateButton);
        }
    }

    previousButton.addEventListener("click", function () {
        visibleMonth.setMonth(visibleMonth.getMonth() - 1);
        renderCalendar();
    });
    nextButton.addEventListener("click", function () {
        visibleMonth.setMonth(visibleMonth.getMonth() + 1);
        renderCalendar();
    });
    renderCalendar();
}

function initDashboardSearch() {
    const search = document.getElementById("dashboard-search");
    const rows = Array.from(document.querySelectorAll("#customer-rows tr"));
    const emptyMessage = document.getElementById("search-empty");

    if (!search || !rows.length || !emptyMessage) return;

    search.addEventListener("input", function () {
        const query = search.value.trim().toLowerCase();
        let visibleRows = 0;

        rows.forEach(function (row) {
            const matches = row.textContent.toLowerCase().includes(query);
            row.hidden = !matches;
            if (matches) visibleRows += 1;
        });

        emptyMessage.hidden = visibleRows !== 0;
    });

    document.addEventListener("keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            search.focus();
        }
    });
}

function initDashboardControls() {
    const settingsButton = document.getElementById("settings-button");
    const settingsDialog = document.getElementById("settings-dialog");
    const transferButton = document.getElementById("transfer-button");
    const balanceNote = document.getElementById("balance-note");

    if (settingsButton && settingsDialog) {
        settingsButton.addEventListener("click", function () {
            settingsDialog.showModal();
        });
    }

    if (transferButton && balanceNote) {
        transferButton.addEventListener("click", function () {
            balanceNote.textContent = "Transfers are not available in this demo.";
        });
    }
}


// ======================================
// SIGN OUT
// ======================================

function initLogout() {
    const button = document.getElementById("logout-button");

    if (!button) return;

    button.addEventListener("click", function () {
        localStorage.removeItem(USER_KEY);
        window.location.href = "index.html";
    });
}


// ======================================
// WEATHER CONDITIONS
// ======================================

function getWeatherVisual(temperature, code) {
    // Very hot weather: show the sun.
    // This also means a hypothetical 100°C reading shows the sun.
    if (temperature >= 30) {
        return {
            condition: "Sunny",
            status: "Hot conditions",
            visual: "sunny"
        };
    }

    // At or below 0°C: show rain as requested.
    if (temperature <= 0) {
        return {
            condition: "Rainy",
            status: "Cold conditions",
            visual: "rainy"
        };
    }

    // Open-Meteo weather codes:
    // 0 = clear, 1-2 = mainly clear / partly cloudy,
    // 3 = overcast, 45/48 = fog,
    // 51-67 and 80-82 = drizzle or rain,
    // 71-77 and 85-86 = snow.

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return {
            condition: "Snow",
            status: "Freezing conditions",
            visual: "cold"
        };
    }

    if (
        [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]
            .includes(code)
    ) {
        return {
            condition: "Rainy",
            status: "Rain expected",
            visual: "rainy"
        };
    }

    if ([45, 48].includes(code)) {
        return {
            condition: "Foggy",
            status: "Low visibility",
            visual: "cloudy"
        };
    }

    if (code === 0) {
        return {
            condition: "Sunny",
            status: "Conditions optimal",
            visual: "sunny"
        };
    }

    if ([1, 2].includes(code)) {
        return {
            condition: "Partly cloudy",
            status: "Conditions optimal",
            visual: "partly-cloudy"
        };
    }

    return {
        condition: "Cloudy",
        status: "Cloud cover",
        visual: "cloudy"
    };
}


// ======================================
// FETCH WEATHER FROM OPEN-METEO
// ======================================

async function fetchKigaliWeather() {
    const url =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${KIGALI_LAT}` +
        `&longitude=${KIGALI_LON}` +
        "&current=temperature_2m,wind_speed_10m,weather_code" +
        "&timezone=Africa%2FKigali";

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Weather request failed.");
    }

    const data = await response.json();

    if (!data.current) {
        throw new Error("No current weather data.");
    }

    return {
        temperature: data.current.temperature_2m,
        wind: data.current.wind_speed_10m,
        code: data.current.weather_code,
        time: data.current.time
    };
}


// ======================================
// DISPLAY WEATHER ON THE PAGE
// ======================================

function displayWeather(weather) {
    const visual = getWeatherVisual(
        weather.temperature,
        weather.code
    );

    // Main weather page
    const scene = document.getElementById("weather-scene");

    if (scene) {
        scene.dataset.condition = visual.visual;
    }

    const condition = document.getElementById("weather-condition");

    if (condition) {
        condition.textContent = visual.condition;
    }

    const temperature = document.getElementById("temperature-value");

    if (temperature) {
        temperature.textContent = `${weather.temperature} °C`;
    }

    const wind = document.getElementById("wind-value");

    if (wind) {
        wind.textContent = `${weather.wind} km/h`;
    }

    const status = document.getElementById("condition-status");

    if (status) {
        status.textContent = visual.status;
    }

    // Dashboard summary cards
    const summaryTemp = document.getElementById("summary-temperature");

    if (summaryTemp) {
        summaryTemp.textContent = `${weather.temperature} °C`;
    }

    const summaryWind = document.getElementById("summary-wind");

    if (summaryWind) {
        summaryWind.textContent = `${weather.wind} km/h`;
    }

    const summaryCondition =
        document.getElementById("summary-condition");

    if (summaryCondition) {
        summaryCondition.textContent = visual.condition;
    }

    const note = document.getElementById("dashboard-weather-note");

    if (note) {
        note.textContent =
            `Kigali is currently ${visual.condition.toLowerCase()} at ` +
            `${weather.temperature} °C. Wind: ${weather.wind} km/h.`;
    }

    const updated = document.getElementById("updated-time");

    if (updated) {
        updated.textContent =
            "Updated " + new Date().toLocaleTimeString();
    }
}


// ======================================
// WEATHER PAGE: FETCH LIVE DATA BUTTON
// ======================================

function initWeather() {
    const user = requireLogin();

    const greeting = document.getElementById("weather-greeting");

    if (greeting) {
        greeting.textContent = `Welcome back, ${user ? user.name : "Kigali User"} 💗`;
    }

    const button = document.getElementById("fetch-weather");
    const error = document.getElementById("weather-error");

    if (!button) return;

    async function load() {
        button.disabled = true;
        button.textContent = "Fetching Weather...";

        if (error) {
            error.textContent = "";
        }

        try {
            const weather = await fetchKigaliWeather();

            displayWeather(weather);
        } catch (err) {
            if (error) {
                error.textContent =
                    "Weather could not be fetched. Check your internet and try again.";
            }
        } finally {
            button.disabled = false;
            button.textContent = "Fetch Live Data";
        }
    }

    button.addEventListener("click", load);

    // Automatically fetch weather when the page opens.
    load();
}


// ======================================
// ADMIN & WALLET PAGES
// ======================================

function initAdmin() {
    const form = document.getElementById("alert-form");
    const messageInput = document.getElementById("alert-message");
    const counter = document.getElementById("character-count");

    if (messageInput && counter) {
        messageInput.addEventListener("input", function () {
            counter.textContent = `${messageInput.value.length} / 180`;
        });
    }

    if (form && messageInput) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            alert("City Alert broadcast: " + messageInput.value);
            messageInput.value = "";
            if (counter) counter.textContent = "0 / 180";
        });
    }
}

function initWallet() {
    const addBtn = document.getElementById("add-ticket");
    const clearBtn = document.getElementById("clear-tickets");
    const list = document.getElementById("ticket-list");
    const status = document.getElementById("wallet-status");

    if (!list) return;

    const STORAGE_KEY = "kigaliUplinkTickets";

    function renderTickets() {
        let tickets = [];
        try {
            tickets = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } catch {
            tickets = [];
        }

        list.replaceChildren();

        if (tickets.length === 0) {
            if (status) status.textContent = "Tickets are saved in this browser.";
            return;
        }

        if (status) status.textContent = `${tickets.length} ticket(s) saved in this browser.`;

        tickets.forEach(function (ticket) {
            const card = document.createElement("div");
            card.className = "ticket-card";
            card.style.cssText = "padding:12px;margin:8px 0;background:#ffffffa0;border-radius:10px;border:1px solid #e0d0f0;";
            card.innerHTML = `<strong>${ticket.title}</strong><br><small>${ticket.date}</small>`;
            list.appendChild(card);
        });
    }

    if (addBtn) {
        addBtn.addEventListener("click", function () {
            let tickets = [];
            try {
                tickets = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            } catch {
                tickets = [];
            }
            tickets.push({
                title: "Kigali Transit Bus Pass #" + (tickets.length + 1),
                date: new Date().toLocaleDateString() + " · Active"
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
            renderTickets();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", function () {
            localStorage.removeItem(STORAGE_KEY);
            renderTickets();
        });
    }

    renderTickets();
}


// ======================================
// START THE CORRECT PAGE
// ======================================

document.addEventListener("DOMContentLoaded", function () {
    const page = document.body.dataset.page;

    initLogout();

    if (page === "auth") {
        initAuth();
    }

    if (page === "dashboard") {
        initDashboard();
    }

    if (page === "weather") {
        initWeather();
    }

    if (page === "admin") {
        initAdmin();
    }

    if (page === "wallet") {
        initWallet();
    }
});
