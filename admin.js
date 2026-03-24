const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => Array.from(document.querySelectorAll(selector));

const loginPanel = qs(".js-login-panel");
const adminPanel = qs(".js-admin-panel");
const loginForm = qs(".js-login-form");
const loginError = qs(".js-login-error");
const logoutBtn = qs(".js-logout");

const barberForm = qs(".js-barber-form");
const barberList = qs(".js-barber-list");
const barberClear = qs(".js-barber-clear");
const barberServicesWrap = qs(".js-barber-services");

const horarioSelect = qs(".js-horario-barbero");
const horarioTable = qs(".js-horario-table");
const saveHorariosBtn = qs(".js-save-horarios");

const calendarBarber = qs(".js-calendar-barber");
const calendarDate = qs(".js-calendar-date");
const calendarRefresh = qs(".js-calendar-refresh");
const calendarGrid = qs(".js-calendar-grid");

const serviceForm = qs(".js-service-form");
const serviceList = qs(".js-service-list");
const serviceClear = qs(".js-service-clear");

const galleryForm = qs(".js-gallery-form");
const galleryList = qs(".js-gallery-list");
const gallerySubmit = qs(".js-gallery-submit");
const reviewForm = qs(".js-review-form");
const reviewList = qs(".js-review-list");
const experienceForm = qs(".js-experience-form");
const experienceList = qs(".js-experience-list");

const blockForm = qs(".js-block-form");
const blockList = qs(".js-block-list");
const blockBarber = qs(".js-block-barber");
const blockStatus = qs(".js-block-status");

const noteTitle = qs(".js-note-title");
const noteInfo = qs(".js-note-info");
const noteText = qs(".js-note-text");
const noteSave = qs(".js-note-save");
const noteCancel = qs(".js-note-cancel");
const noteConfirm = qs(".js-note-confirm");
const sendWhatsApp = qs(".js-send-whatsapp");

const clientContact = qs(".js-client-contact");
const clientSearch = qs(".js-client-search");
const clientHistory = qs(".js-client-history");

const upcomingList = qs(".js-upcoming");
const metricsGrid = qs(".js-metrics");
const exportMonthSelect = qs(".js-export-month");
const exportYearSelect = qs(".js-export-year");
const exportAnnualYearSelect = qs(".js-export-year-annual");
const exportMonthlyBtn = qs(".js-export-monthly");
const exportAnnualBtn = qs(".js-export-annual");
const canceladasList = qs(".js-canceladas");

const userForm = qs(".js-user-form");
const userList = qs(".js-user-list");
const userClear = qs(".js-user-clear");

const blockMode = qs(".js-block-mode");
const blockWeekdayWrap = qs(".js-block-weekday");
const blockWeekdaySelect = blockWeekdayWrap?.querySelector("[name='weekday']");

const tokenKey = "owb_token";
const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const monthOptions = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" }
];

const state = {
  barbers: [],
  services: [],
  selectedAppointment: null,
  experience: []
};

const blockDeleteScopes = {
  single: "Solo este bloqueo",
  week: "Toda esta semana",
  workweek: "Lunes a viernes",
  all_days: "Todos los dias",
  all_weeks: "Todas las semanas"
};

const getToken = () => localStorage.getItem(tokenKey);
const setToken = (value) => localStorage.setItem(tokenKey, value);
const clearToken = () => localStorage.removeItem(tokenKey);

const showAdmin = (show) => {
  if (loginPanel) loginPanel.hidden = show;
  if (adminPanel) adminPanel.hidden = !show;
};

const setNote = (el, text) => {
  if (!el) return;
  el.textContent = text || "";
};

const setupAccordion = () => {
  const accordions = qsa(".admin-accordion .accordion");
  if (!accordions.length) return;
  accordions.forEach((item) => {
    const locked = item.dataset.locked === "true";
    const summary = item.querySelector("summary");
    if (locked && summary) {
      summary.addEventListener("click", (event) => {
        event.preventDefault();
      });
    }
    item.addEventListener("toggle", () => {
      if (locked) {
        item.open = true;
        return;
      }
      if (!item.open) return;
      accordions.forEach((other) => {
        const otherLocked = other.dataset.locked === "true";
        if (other !== item && !otherLocked) other.open = false;
      });
    });
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};
const setupSubAccordion = () => {
  const sections = qsa(".sub-accordion");
  if (!sections.length) return;
  sections.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      sections.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
};



const apiFetch = async (url, options = {}) => {
  const headers = { ...(options.headers || {}) };
  if (getToken()) {
    headers.Authorization = `Bearer ${getToken()}`;
  }
  if (options.json) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.json ? JSON.stringify(options.json) : options.body
  });

  if (res.status === 401) {
    clearToken();
    showAdmin(false);
    throw new Error("unauthorized");
  }

  return res;
};

const escapeHtml = (value = "") =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const getResponseMessage = async (res, fallback = "No fue posible completar la accion.") => {
  try {
    const data = await res.json();
    if (data?.error) return data.error;
    if (data?.message) return data.message;
  } catch (err) {
    // Respuesta sin cuerpo JSON
  }
  return fallback;
};

const getBlockWeekdayLabel = (dateValue) => {
  if (!dateValue) return "";
  const dayIndex = new Date(`${dateValue}T00:00:00`).getDay();
  return days[dayIndex] || "";
};

const getBlockDeleteLabel = (block, scope) => {
  if (scope === "all_weeks") {
    return `${blockDeleteScopes[scope]} (${getBlockWeekdayLabel(block.fecha).toLowerCase()})`;
  }
  return blockDeleteScopes[scope] || "Este bloqueo";
};

const buildBlockDeletePrompt = (block, scope) => {
  const title = block.motivo?.trim() || "este bloqueo";
  const timeLabel = block.hora_fin ? `${block.hora} - ${block.hora_fin}` : block.hora;
  return `Â¿Deseas borrar ${getBlockDeleteLabel(block, scope).toLowerCase()} para "${title}" (${timeLabel})?`;
};

const handleLogin = async (event) => {
  event.preventDefault();
  if (loginError) loginError.textContent = "";

  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      if (loginError) loginError.textContent = "Credenciales inválidas";
      return;
    }

    const data = await res.json();
    setToken(data.token);
    showAdmin(true);
    await loadAll();
  } catch (err) {
    if (loginError) loginError.textContent = "Servidor no disponible. Ejecuta npm start.";
  }
};

const logout = () => {
  clearToken();
  showAdmin(false);
};

const populateSelect = (select, items, placeholder) => {
  if (!select) return;
  if (!items.length) {
    select.innerHTML = `<option value="">${placeholder || "Sin opciones"}</option>`;
    return;
  }
  select.innerHTML = items.map((item) => `<option value="${item.id}">${item.nombre}</option>`).join("");
};

const getSelectedBarberServiceIds = () => {
  if (!barberForm) return [];
  return qsa(".js-barber-service-option:checked").map((input) => Number(input.value));
};

const renderBarberServiceOptions = (selectedIds = []) => {
  if (!barberServicesWrap) return;
  if (!state.services.length) {
    barberServicesWrap.innerHTML = "<p class='form-note'>Primero crea servicios en el catálogo.</p>";
    return;
  }

  const selectedSet = new Set((selectedIds || []).map((item) => Number(item)));
  barberServicesWrap.innerHTML = `
    <div class="service-assignment__grid">
      ${state.services
        .map((service) => {
          const checked = selectedSet.has(Number(service.id)) ? "checked" : "";
          const stateLabel = service.activo ? "" : "<span class='service-assignment__flag'>Oculto</span>";
          return `
            <label class="service-option ${service.activo ? "" : "is-inactive"}">
              <input
                class="service-option__input js-barber-service-option"
                type="checkbox"
                name="servicio_ids"
                value="${service.id}"
                ${checked}
              />
              <span class="service-option__copy">
                <strong>${service.nombre}</strong>
                <small>${service.categoria || "General"} · ${service.duracion_min || "-"} min · COP ${service.precio_min || "-"}</small>
              </span>
              ${stateLabel}
            </label>
          `;
        })
        .join("")}
    </div>
  `;
};

const loadBarbers = async () => {
  try {
    const res = await apiFetch("/api/barbers/all");
    const barbers = await res.json();
    state.barbers = barbers;
    renderBarbers(barbers);
    populateSelect(calendarBarber, barbers, "Sin barberos");
    populateSelect(blockBarber, barbers, "Sin barberos");
    populateSelect(horarioSelect, barbers, "Sin barberos");
    if (calendarBarber && calendarBarber.value) {
      await loadCalendar();
    }
    return barbers;
  } catch (err) {
    return [];
  }
};

const renderBarbers = (barbers) => {
  if (!barberList) return;
  if (!barbers.length) {
    barberList.innerHTML = "<p class='form-note'>Sin barberos registrados.</p>";
    return;
  }

  barberList.innerHTML = `
    <div class="grid admin-barbers-grid">
      ${barbers
        .map(
          (barber) => `
        <div class="card admin-barber-card">
          ${
            barber.imagen_data
              ? `<img class="admin-media admin-media--barber" src="${barber.imagen_data}" alt="${barber.nombre}" />`
              : `<div class="admin-placeholder admin-placeholder--barber">${(barber.nombre || "B").trim().charAt(0).toUpperCase()}</div>`
          }
          <span class="card__tag">${barber.activo ? "Activo" : "Inactivo"}</span>
          <h3>${barber.nombre}</h3>
          <p class="form-note admin-barber-card__services">${
            barber.servicios?.length
              ? barber.servicios.map((service) => service.nombre).join(" · ")
              : "Sin servicios asignados."
          }</p>
          <p class="form-note admin-barber-card__desc">${barber.descripcion || "Sin descripción cargada."}</p>
          <div class="form__actions">
            <button class="btn btn--ghost btn--small" data-edit="${barber.id}">Editar</button>
            <button class="btn btn--ghost btn--small" data-toggle="${barber.id}">${
              barber.activo ? "Desactivar" : "Activar"
            }</button>
            <button class="btn btn--ghost btn--small" data-delete="${barber.id}">Eliminar</button>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  barberList.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.edit;
      const barber = barbers.find((item) => String(item.id) === id);
      if (!barber || !barberForm) return;
      barberForm.querySelector("[name='id']").value = barber.id;
      barberForm.querySelector("[name='nombre']").value = barber.nombre;
      barberForm.querySelector("[name='descripcion']").value = barber.descripcion || "";
      barberForm.querySelector("[name='activo']").value = barber.activo ? "1" : "0";
      renderBarberServiceOptions(barber.servicio_ids || []);
    });
  });

  barberList.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.toggle;
      const barber = barbers.find((item) => String(item.id) === id);
      if (!barber) return;
      await apiFetch(`/api/barbers/${id}`, {
        method: "PUT",
        json: { activo: barber.activo ? 0 : 1 }
      });
      await loadBarbers();
    });
  });

  barberList.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.delete;
      await apiFetch(`/api/barbers/${id}`, {
        method: "DELETE"
      });
      await loadBarbers();
    });
  });
};

const renderHorarioTable = (horarios = []) => {
  if (!horarioTable) return;
  const byDay = new Map(horarios.map((item) => [item.day_of_week, item]));

  horarioTable.innerHTML = `
    <div class="grid">
      ${days
        .map((day, idx) => {
          const current = byDay.get(idx) || {};
          const start = current.start_time || "09:00";
          const end = current.end_time || "19:00";
          const isOff = current.is_day_off ? "checked" : "";
          const id = current.id || "";
          return `
            <div class="card" data-day="${idx}" data-id="${id}">
              <div class="card__tag">${day}</div>
              <div class="form__row">
                <div class="field">
                  <label>Inicio</label>
                  <input type="time" value="${start}" class="js-start" />
                </div>
                <div class="field">
                  <label>Fin</label>
                  <input type="time" value="${end}" class="js-end" />
                </div>
              </div>
              <div class="schedule-toggle">
                <span class="schedule-toggle__label">Estado</span>
                <label class="schedule-switch">
                  <input type="checkbox" class="js-dayoff schedule-switch__input" ${isOff} />
                  <span class="schedule-switch__track" aria-hidden="true">
                    <span class="schedule-switch__thumb"></span>
                  </span>
                  <span class="schedule-switch__copy">
                    <span class="schedule-switch__state schedule-switch__state--off">Disponible</span>
                    <span class="schedule-switch__state schedule-switch__state--on">Día libre</span>
                  </span>
                </label>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  const syncDayOffState = (card) => {
    const checkbox = card.querySelector(".js-dayoff");
    const startInput = card.querySelector(".js-start");
    const endInput = card.querySelector(".js-end");
    if (!checkbox || !startInput || !endInput) return;
    const isDayOff = checkbox.checked;
    card.classList.toggle("is-day-off", isDayOff);
    startInput.disabled = isDayOff;
    endInput.disabled = isDayOff;
  };

  horarioTable.querySelectorAll("[data-day]").forEach((card) => {
    const checkbox = card.querySelector(".js-dayoff");
    if (!checkbox) return;
    syncDayOffState(card);
    checkbox.addEventListener("change", () => syncDayOffState(card));
  });
};

const loadHorarios = async () => {
  if (!horarioSelect) return;
  const barberoId = horarioSelect.value;
  if (!barberoId) return;
  const res = await apiFetch(`/api/horarios?barbero_id=${barberoId}`);
  if (!res.ok) {
    renderHorarioTable([]);
    return;
  }
  const horarios = await res.json();
  renderHorarioTable(horarios);
};

const saveHorarios = async () => {
  if (!horarioSelect || !horarioTable) return;
  const barberoId = horarioSelect.value;
  if (!barberoId) return;
  const cards = horarioTable.querySelectorAll("[data-day]");

  for (const card of cards) {
    const day = card.dataset.day;
    const id = card.dataset.id;
    const start = card.querySelector(".js-start").value;
    const end = card.querySelector(".js-end").value;
    const isDayOff = card.querySelector(".js-dayoff").checked ? 1 : 0;

    if (id) {
      await apiFetch(`/api/horarios/${id}`, {
        method: "PUT",
        json: { start_time: start, end_time: end, is_day_off: isDayOff }
      });
    } else {
      const res = await apiFetch("/api/horarios", {
        method: "POST",
        json: {
          barbero_id: barberoId,
          day_of_week: day,
          start_time: start,
          end_time: end,
          is_day_off: isDayOff
        }
      });
      const created = await res.json();
      card.dataset.id = created.id;
    }
  }
};

const timeToMinutes = (value) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const buildTimeSlots = (start, end, step = 30) => {
  const slots = [];
  for (let t = timeToMinutes(start); t + step <= timeToMinutes(end); t += step) {
    slots.push(minutesToTime(t));
  }
  return slots;
};

const blockOverlapsSlot = (block, slotTime, slotDuration = 30) => {
  if (!block?.hora) return false;
  const slotStart = timeToMinutes(slotTime);
  const blockStart = timeToMinutes(block.hora);
  if (!block.hora_fin) {
    return slotStart === blockStart;
  }
  const blockEnd = timeToMinutes(block.hora_fin);
  const slotEnd = slotStart + slotDuration;
  return slotStart < blockEnd && slotEnd > blockStart;
};

const renderCalendar = ({ slots, citas, bloqueos }) => {
  if (!calendarGrid) return;
  const citasByTime = new Map(citas.map((cita) => [cita.hora, cita]));

  if (!slots.length) {
    calendarGrid.innerHTML = "<p class='form-note'>Sin horarios para esta fecha.</p>";
    return;
  }

  calendarGrid.innerHTML = `
      <div class="calendar__list">
        ${slots
          .map((time) => {
            const cita = citasByTime.get(time);
            const block = bloqueos.find((item) => blockOverlapsSlot(item, time, 30));
            if (block) {
              const rangeLabel = block.hora_fin ? `${block.hora} - ${block.hora_fin}` : block.hora;
              return `
                <div class="calendar__row">
                  <div class="calendar__time">${time}</div>
                  <div class="calendar__slot is-blocked" data-time="${time}">
                    <div class="calendar__block">Bloqueado · ${rangeLabel}${block.motivo ? ` · ${block.motivo}` : ""}</div>
                  </div>
                </div>
              `;
            }
          if (cita) {
            return `
              <div class="calendar__row">
                <div class="calendar__time">${time}</div>
                <div class="calendar__slot" data-time="${time}">
                  <div class="calendar__appointment ${cita.status}" draggable="${
              cita.status !== "cancelada"
            }" data-appointment-id="${cita.id}">
                    <strong>${cita.cliente_nombre}</strong>
                    <span>${cita.servicio_nombre}</span>
                    <em>${cita.status}</em>
                  </div>
                </div>
              </div>
            `;
          }
          return `
            <div class="calendar__row">
              <div class="calendar__time">${time}</div>
              <div class="calendar__slot" data-time="${time}">
                <div class="calendar__empty">Disponible</div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  calendarGrid.querySelectorAll(".calendar__appointment").forEach((card) => {
    card.addEventListener("click", () => {
      const id = Number(card.dataset.appointmentId);
      const cita = citas.find((item) => item.id === id);
      if (cita) setActiveAppointment(cita);
    });

    card.addEventListener("dragstart", (event) => {
      if (card.getAttribute("draggable") !== "true") return;
      event.dataTransfer.setData("text/plain", card.dataset.appointmentId);
    });
  });

  calendarGrid.querySelectorAll(".calendar__slot").forEach((slot) => {
    if (slot.classList.contains("is-blocked")) return;
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("is-dragover");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("is-dragover"));
    slot.addEventListener("drop", async (event) => {
      event.preventDefault();
      slot.classList.remove("is-dragover");
      const id = event.dataTransfer.getData("text/plain");
      if (!id) return;
      const barberoId = calendarBarber.value;
      const fecha = calendarDate.value;
      const hora = slot.dataset.time;
      try {
        await apiFetch(`/api/citas/${id}`, {
          method: "PUT",
          json: { barbero_id: barberoId, fecha, hora }
        });
        await loadCalendar();
        await loadUpcoming();
      } catch (err) {
        alert("No se pudo mover la cita. Verifica disponibilidad.");
      }
    });
  });
};

const loadCalendar = async () => {
  if (!calendarBarber || !calendarDate) return;
  const barberoId = calendarBarber.value;
  const fecha = calendarDate.value;
  if (!barberoId || !fecha) {
    if (calendarGrid) {
      calendarGrid.innerHTML = "<p class='form-note'>Selecciona barbero y fecha.</p>";
    }
    return;
  }

  const horariosRes = await apiFetch(`/api/horarios?barbero_id=${barberoId}`);
  const horarios = horariosRes.ok ? await horariosRes.json() : [];
  const day = new Date(`${fecha}T00:00:00`).getDay();
  const horario = horarios.find((item) => item.day_of_week === day);
  if (!horario || horario.is_day_off) {
    if (calendarGrid) {
      calendarGrid.innerHTML = "<p class='form-note'>Día libre o sin horario configurado.</p>";
    }
    return;
  }

  const slots = buildTimeSlots(horario.start_time, horario.end_time, 30);
  const [citasRes, bloqueosRes] = await Promise.all([
    apiFetch(`/api/citas?barbero_id=${barberoId}&from=${fecha}&to=${fecha}`),
    apiFetch(`/api/bloqueos?barbero_id=${barberoId}&fecha=${fecha}`)
  ]);
  const citas = citasRes.ok ? await citasRes.json() : [];
  const bloqueos = bloqueosRes.ok ? await bloqueosRes.json() : [];
  renderCalendar({ slots, citas, bloqueos });
};

const renderServices = (services) => {
  if (!serviceList) return;
  if (!services.length) {
    serviceList.innerHTML = "<p class='form-note'>Sin servicios configurados.</p>";
    return;
  }

  serviceList.innerHTML = `
    <div class="grid">
      ${services
        .map(
          (service) => `
        <div class="card">
          <span class="card__tag">${service.categoria || "General"}</span>
          <h3>${service.nombre}</h3>
          <p>${service.duracion_min} min · COP ${service.precio_min || "-"}</p>
          <p class="form-note">${service.activo ? "Activo" : "Inactivo"}</p>
          <div class="form__actions">
            <button class="btn btn--ghost btn--small" data-edit="${service.id}">Editar</button>
            <button class="btn btn--ghost btn--small" data-toggle="${service.id}">
              ${service.activo ? "Ocultar" : "Mostrar"}
            </button>
            <button class="btn btn--ghost btn--small" data-delete="${service.id}">Eliminar</button>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  serviceList.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.edit;
      const service = services.find((item) => String(item.id) === id);
      if (!service || !serviceForm) return;
      serviceForm.querySelector("[name='id']").value = service.id;
      serviceForm.querySelector("[name='nombre']").value = service.nombre;
      serviceForm.querySelector("[name='categoria']").value = service.categoria || "";
      serviceForm.querySelector("[name='descripcion']").value = service.descripcion || "";
      serviceForm.querySelector("[name='duracion_min']").value = service.duracion_min;
      serviceForm.querySelector("[name='precio']").value = service.precio_min || "";
      serviceForm.querySelector("[name='activo']").value = service.activo ? "1" : "0";
    });
  });

  serviceList.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.delete;
      await apiFetch(`/api/servicios/${id}`, { method: "DELETE" });
      await loadServices();
      await loadBarbers();
    });
  });

  serviceList.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.toggle;
      const service = services.find((item) => String(item.id) === id);
      if (!service) return;
      await apiFetch(`/api/servicios/${id}`, {
        method: "PUT",
        json: { activo: service.activo ? 0 : 1 }
      });
      await loadServices();
      await loadBarbers();
    });
  });
};

const loadServices = async () => {
  try {
    const res = await apiFetch("/api/servicios/all");
    const services = await res.json();
    state.services = services;
    renderServices(services);
    renderBarberServiceOptions(getSelectedBarberServiceIds());
    return services;
  } catch (err) {
    renderBarberServiceOptions([]);
    return [];
  }
};


const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const renderGallery = (items = []) => {
  if (!galleryList) return;
  if (!items.length) {
    galleryList.innerHTML = "<p class='form-note'>Sin imágenes cargadas.</p>";
    return;
  }
  galleryList.innerHTML = `
    <div class="grid admin-gallery-grid">
      ${items
        .map(
          (item) => `
        <div class="card">
          <img class="admin-media" src="${item.imagen_data}" alt="${item.titulo || "Foto"}" />
          <h3>${item.titulo || "Imagen"}</h3>
          <p class="form-note">${item.descripcion || ""}</p>
          <div class="form__actions">
            <button class="btn btn--ghost btn--small" data-edit="${item.id}">Editar</button>
            <button class="btn btn--ghost btn--small" data-delete="${item.id}">Eliminar</button>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  galleryList.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.edit;
      const item = items.find((entry) => String(entry.id) === id);
      if (!item || !galleryForm) return;
      galleryForm.querySelector("[name='id']").value = item.id;
      if (gallerySubmit) gallerySubmit.textContent = "Guardar cambios";
      const section = galleryForm.closest(".sub-accordion");
      if (section) section.open = true;
      galleryForm.querySelector("[name='titulo']").value = item.titulo || "";
      galleryForm.querySelector("[name='descripcion']").value = item.descripcion || "";
    });
  });

  galleryList.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.delete;
      await apiFetch(`/api/galeria/${id}`, { method: "DELETE" });
      await loadGallery();
    });
  });
};

const loadGallery = async () => {
  try {
    const res = await apiFetch("/api/galeria");
    const items = res.ok ? await res.json() : [];
    renderGallery(items);
    return items;
  } catch (err) {
    renderGallery([]);
    return [];
  }
};


const seedReviewsIfEmpty = async () => {
  try {
    const res = await fetch("/assets/reviews.json");
    if (!res.ok) return false;
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return false;
    for (const row of rows) {
      await apiFetch("/api/resenas", {
        method: "POST",
        json: {
          nombre: row.author || "Cliente",
          calificacion: Number(row.rating || 5),
          mensaje: row.text || "",
          fuente: row.source || "Google Maps"
        }
      });
    }
    return true;
  } catch (err) {
    return false;
  }
};

const renderReviewsAdmin = (items = []) => {
  if (!reviewList) return;
  if (!items.length) {
    reviewList.innerHTML = "<p class='form-note'>Sin reseñas registradas.</p>";
    return;
  }
  reviewList.innerHTML = `
    <div class="grid">
      ${items
        .map(
          (item) => `
        <div class="card">
          <span class="card__tag">${'&#9733;'.repeat(item.calificacion || 0)} ${item.calificacion || 0}/5</span>
          <h3>${item.nombre || "Cliente"}</h3>
          <p class="form-note">${item.fuente || "Google Maps"}</p>
          <p>${item.mensaje || ""}</p>
          <div class="form__actions">
            <button class="btn btn--ghost btn--small" data-delete="${item.id}">Eliminar</button>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  reviewList.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.delete;
      await apiFetch(`/api/resenas/${id}`, { method: "DELETE" });
      await loadReviewsAdmin();
    });
  });
};

const loadReviewsAdmin = async () => {
  try {
    const res = await apiFetch("/api/resenas");
    let items = res.ok ? await res.json() : [];
    if (!items.length) {
      const seeded = await seedReviewsIfEmpty();
      if (seeded) {
        const reload = await apiFetch("/api/resenas");
        items = reload.ok ? await reload.json() : [];
      }
    }
    renderReviewsAdmin(items);
    return items;
  } catch (err) {
    renderReviewsAdmin([]);
    return [];
  }
};

const renderExperience = (items = []) => {
  if (!experienceList) return;
  state.experience = items;
  if (!items.length) {
    experienceList.innerHTML = "<p class='form-note'>Sin contenido cargado.</p>";
    return;
  }
  experienceList.innerHTML = `
    <div class="grid">
      ${items
        .map(
          (item) => `
        <div class="card">
          <span class="card__tag">${item.seccion}</span>
          <h3>${item.titulo}</h3>
          <p>${item.descripcion}</p>
          <div class="form__actions">
            <button class="btn btn--ghost btn--small" data-edit="${item.seccion}">Editar</button>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  experienceList.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.edit;
      const item = items.find((entry) => entry.seccion === key);
      if (!item || !experienceForm) return;
      experienceForm.querySelector("[name='seccion']").value = item.seccion;
      experienceForm.querySelector("[name='titulo']").value = item.titulo;
      experienceForm.querySelector("[name='descripcion']").value = item.descripcion;
    });
  });
};

const loadExperience = async () => {
  try {
    const res = await apiFetch("/api/experiencia");
    const items = res.ok ? await res.json() : [];
    renderExperience(items);
    return items;
  } catch (err) {
    renderExperience([]);
    return [];
  }
};

const renderBlocks = (blocks) => {
  if (!blockList) return;
  if (!blocks.length) {
    blockList.innerHTML = "<p class='form-note'>Sin bloqueos para esta fecha.</p>";
    return;
  }

  blockList.innerHTML = `
    <div class="grid">
      ${blocks
        .map((block) => {
          const rangeLabel = block.hora_fin ? `${block.hora} - ${block.hora_fin}` : block.hora;
          const weekdayLabel = getBlockWeekdayLabel(block.fecha);
          const dayIndex = new Date(`${block.fecha}T00:00:00`).getDay();
          const isWorkday = dayIndex >= 1 && dayIndex <= 5;
          return `
            <div class="card card--block">
              <div class="card__tag">${escapeHtml(block.fecha)} - ${escapeHtml(rangeLabel)}</div>
              <h3>${escapeHtml(block.motivo || "Bloqueo")}</h3>
              <p class="form-note">${escapeHtml(weekdayLabel)} - Elige si borras solo esta franja o tambien su patron repetido.</p>
              <div class="block-actions">
                <button class="btn btn--ghost btn--small btn--danger" type="button" data-toggle-delete="${block.id}">Eliminar</button>
              </div>
              <div class="block-delete-flow" data-delete-menu="${block.id}" hidden>
                <p class="block-delete-flow__title">Que quieres borrar?</p>
                <div class="block-delete-flow__options">
                  <button class="btn btn--ghost btn--small" type="button" data-delete-scope="single" data-block-id="${block.id}">Solo este</button>
                  <button class="btn btn--ghost btn--small" type="button" data-delete-scope="week" data-block-id="${block.id}">Esta semana</button>
                  ${isWorkday ? `<button class="btn btn--ghost btn--small" type="button" data-delete-scope="workweek" data-block-id="${block.id}">Lunes a viernes</button>` : ""}
                  <button class="btn btn--ghost btn--small" type="button" data-delete-scope="all_days" data-block-id="${block.id}">Todos los dias</button>
                  <button class="btn btn--ghost btn--small" type="button" data-delete-scope="all_weeks" data-block-id="${block.id}">${escapeHtml(getBlockDeleteLabel(block, "all_weeks"))}</button>
                  <button class="btn btn--ghost btn--small" type="button" data-close-delete="${block.id}">Cancelar</button>
                </div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  const closeBlockDeleteMenus = () => {
    blockList.querySelectorAll("[data-delete-menu]").forEach((menu) => {
      menu.hidden = true;
    });
    blockList.querySelectorAll("[data-toggle-delete]").forEach((toggle) => {
      toggle.textContent = "Eliminar";
    });
  };

  blockList.querySelectorAll("[data-toggle-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggleDelete;
      const menu = blockList.querySelector(`[data-delete-menu="${id}"]`);
      const shouldOpen = Boolean(menu?.hidden);
      closeBlockDeleteMenus();
      if (menu && shouldOpen) {
        menu.hidden = false;
        btn.textContent = "Cerrar";
      }
    });
  });

  blockList.querySelectorAll("[data-close-delete]").forEach((btn) => {
    btn.addEventListener("click", closeBlockDeleteMenus);
  });

  blockList.querySelectorAll("[data-delete-scope]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.blockId);
      const scope = btn.dataset.deleteScope;
      const block = blocks.find((item) => item.id === id);
      if (!block) return;

      const confirmed = window.confirm(buildBlockDeletePrompt(block, scope));
      if (!confirmed) return;

      const res = await apiFetch("/api/bloqueos/delete-bulk", {
        method: "POST",
        json: { id, scope }
      });

      if (!res.ok) {
        setNote(blockStatus, await getResponseMessage(res));
        return;
      }

      const data = await res.json();
      closeBlockDeleteMenus();
      await loadBlocks();
      await loadCalendar();
      setNote(blockStatus, data?.message || `Se eliminaron ${data?.deleted || 0} bloqueos.`);
    });
  });
};

const loadBlocks = async () => {
  if (!blockBarber || !blockForm) return;
  const barberoId = blockBarber.value;
  const fecha = blockForm.querySelector("[name='fecha']")?.value;
  if (!barberoId || !fecha) {
    if (blockList) blockList.innerHTML = "<p class='form-note'>Selecciona barbero y fecha.</p>";
    return;
  }
  const res = await apiFetch(`/api/bloqueos?barbero_id=${barberoId}&fecha=${fecha}`);
  const blocks = res.ok ? await res.json() : [];
  renderBlocks(blocks);
};

const setActiveAppointment = (cita) => {
  state.selectedAppointment = cita;
  if (noteTitle) noteTitle.textContent = cita.cliente_nombre;
  if (noteInfo) {
    noteInfo.textContent = `${cita.servicio_nombre} · ${cita.fecha} ${cita.hora} · ${cita.barbero_nombre}`;
  }
  if (noteText) noteText.value = cita.admin_notas || "";
};

const renderHistory = (rows) => {
  if (!clientHistory) return;
  if (!rows.length) {
    clientHistory.innerHTML = "<p class='form-note'>Sin historial disponible.</p>";
    return;
  }
  clientHistory.innerHTML = `
    <div class="grid">
      ${rows
        .map(
          (row) => `
        <div class="card">
          <div class="card__tag">${row.fecha} · ${row.hora}</div>
          <h3>${row.servicio_nombre}</h3>
          <p class="form-note">${row.status}</p>
        </div>
      `
        )
        .join("")}
    </div>
  `;
};

const loadUpcoming = async () => {
  if (!upcomingList) return;
  const res = await apiFetch("/api/citas/upcoming?limit=10");
  const citas = res.ok ? await res.json() : [];
  if (!citas.length) {
    upcomingList.innerHTML = "<p class='form-note'>Sin citas próximas.</p>";
    return;
  }
  upcomingList.innerHTML = `
    <div class="grid">
      ${citas
        .map(
          (cita) => `
        <div class="card" data-cita="${cita.id}">
          <div class="card__tag">${cita.fecha} · ${cita.hora}</div>
          <h3>${cita.cliente_nombre}</h3>
          <p>${cita.servicio_nombre} con ${cita.barbero_nombre}</p>
          <p class="form-note">${cita.status}</p>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  upcomingList.querySelectorAll("[data-cita]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = Number(card.dataset.cita);
      const cita = citas.find((item) => item.id === id);
      if (cita) setActiveAppointment(cita);
    });
  });
};

const loadMetrics = async () => {
  if (!metricsGrid) return;
  const res = await apiFetch("/api/metrics");
  const metrics = res.ok ? await res.json() : { total: 0, pendientes: 0, confirmadas: 0, canceladas: 0 };
  metricsGrid.innerHTML = `
    <div class="card">
      <div class="card__tag">Total</div>
      <h3>${metrics.total}</h3>
    </div>
    <div class="card">
      <div class="card__tag">Pendientes</div>
      <h3>${metrics.pendientes}</h3>
    </div>
    <div class="card">
      <div class="card__tag">Confirmadas</div>
      <h3>${metrics.confirmadas}</h3>
    </div>
    <div class="card">
      <div class="card__tag">Canceladas</div>
      <h3>${metrics.canceladas}</h3>
    </div>
  `;
};

const loadCanceladas = async () => {
  if (!canceladasList) return;
  const res = await apiFetch("/api/citas");
  const citas = res.ok ? await res.json() : [];
  const canceladas = citas.filter((cita) => cita.status === "cancelada");
  if (!canceladas.length) {
    canceladasList.innerHTML = "<p class='form-note'>Sin cancelaciones registradas.</p>";
    return;
  }
  canceladasList.innerHTML = `
    <div class="grid">
      ${canceladas
        .map(
          (cita) => `
        <div class="card">
          <div class="card__tag">${cita.fecha} · ${cita.hora}</div>
          <h3>${cita.cliente_nombre}</h3>
          <p>${cita.servicio_nombre} con ${cita.barbero_nombre}</p>
        </div>
      `
        )
        .join("")}
    </div>
  `;
};

const loadExportOptions = async () => {
  if (!exportMonthSelect && !exportYearSelect && !exportAnnualYearSelect) return;

  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentYear = String(currentDate.getFullYear());

  if (exportMonthSelect) {
    exportMonthSelect.innerHTML = monthOptions
      .map((month) => `<option value="${month.value}">${month.label}</option>`)
      .join("");
    exportMonthSelect.value = currentMonth;
  }

  let years = [currentYear];
  try {
    const res = await apiFetch("/api/citas/export/options");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.years) && data.years.length) {
        years = data.years.map((year) => String(year));
      }
    }
  } catch (err) {
    years = [currentYear];
  }

  if (!years.includes(currentYear)) years.push(currentYear);
  years = [...new Set(years)].sort((a, b) => Number(b) - Number(a));
  const yearOptions = years.map((year) => `<option value="${year}">${year}</option>`).join("");

  if (exportYearSelect) {
    exportYearSelect.innerHTML = yearOptions;
    exportYearSelect.value = currentYear;
  }

  if (exportAnnualYearSelect) {
    exportAnnualYearSelect.innerHTML = yearOptions;
    exportAnnualYearSelect.value = currentYear;
  }
};

const loadUsers = async () => {
  if (!userList) return;
  const res = await apiFetch("/api/users");
  const users = res.ok ? await res.json() : [];
  if (!users.length) {
    userList.innerHTML = "<p class='form-note'>Sin usuarios registrados.</p>";
    return;
  }
  userList.innerHTML = `
    <div class="grid">
      ${users
        .map(
          (user) => `
        <div class="card">
          <span class="card__tag">${user.role}</span>
          <h3>${user.username}</h3>
          <p class="form-note">${user.activo ? "Activo" : "Inactivo"}</p>
          <div class="form__actions">
            <button class="btn btn--ghost btn--small" data-edit="${user.id}">Editar</button>
            <button class="btn btn--ghost btn--small" data-delete="${user.id}">Eliminar</button>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  userList.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.edit;
      const user = users.find((item) => String(item.id) === id);
      if (!user || !userForm) return;
      userForm.querySelector("[name='id']").value = user.id;
      userForm.querySelector("[name='username']").value = user.username;
      userForm.querySelector("[name='role']").value = user.role || "admin";
    });
  });

  userList.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.delete;
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      await loadUsers();
    });
  });
};

const loadAll = async () => {
  await loadServices();
  await loadBarbers();
  await loadHorarios();
  if (calendarDate) {
    const today = new Date().toISOString().slice(0, 10);
    calendarDate.value = calendarDate.value || today;
  }
  await loadCalendar();
  await loadBlocks();
  await loadGallery();
  await loadReviewsAdmin();
  await loadExperience();
  await loadUpcoming();
  await loadMetrics();
  await loadExportOptions();
  await loadCanceladas();
  await loadUsers();
};

if (loginForm) loginForm.addEventListener("submit", handleLogin);
if (logoutBtn) logoutBtn.addEventListener("click", logout);

if (barberForm) {
  barberForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(barberForm);
    const payload = Object.fromEntries(formData.entries());
    const servicio_ids = getSelectedBarberServiceIds();
    const file = barberForm.querySelector("[name='imagen']")?.files?.[0];
    let imagen_data = null;
    if (file) {
      imagen_data = await readFileAsDataURL(file);
    }

    if (payload.id) {
      await apiFetch(`/api/barbers/${payload.id}`, {
        method: "PUT",
        json: {
          nombre: payload.nombre,
          descripcion: payload.descripcion,
          imagen_data,
          activo: Number(payload.activo),
          servicio_ids
        }
      });
    } else {
      await apiFetch("/api/barbers", {
        method: "POST",
        json: {
          nombre: payload.nombre,
          descripcion: payload.descripcion,
          imagen_data,
          activo: Number(payload.activo),
          servicio_ids
        }
      });
    }

    barberForm.reset();
    renderBarberServiceOptions([]);
    await loadBarbers();
  });
}

if (barberClear) {
  barberClear.addEventListener("click", () => {
    if (barberForm) barberForm.reset();
    renderBarberServiceOptions([]);
  });
}

if (horarioSelect) {
  horarioSelect.addEventListener("change", loadHorarios);
}

if (saveHorariosBtn) {
  saveHorariosBtn.addEventListener("click", saveHorarios);
}

if (calendarRefresh) {
  calendarRefresh.addEventListener("click", loadCalendar);
}

if (calendarBarber) {
  calendarBarber.addEventListener("change", loadCalendar);
}

if (calendarDate) {
  calendarDate.addEventListener("change", loadCalendar);
}

if (serviceForm) {
  serviceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(serviceForm);
    const payload = Object.fromEntries(formData.entries());

    const body = {
      nombre: payload.nombre,
      categoria: payload.categoria,
      descripcion: payload.descripcion,
      duracion_min: Number(payload.duracion_min),
      precio_min: payload.precio ? Number(payload.precio) : null,
      precio_max: null,
      activo: Number(payload.activo)
    };

    if (payload.id) {
      await apiFetch(`/api/servicios/${payload.id}`, {
        method: "PUT",
        json: body
      });
    } else {
      await apiFetch("/api/servicios", {
        method: "POST",
        json: body
      });
    }

    serviceForm.reset();
    await loadServices();
    await loadBarbers();
  });
}

if (serviceClear) {
  serviceClear.addEventListener("click", () => {
    if (serviceForm) serviceForm.reset();
  });
}


if (galleryForm) {
  galleryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(galleryForm);
    const payload = Object.fromEntries(formData.entries());
    const file = galleryForm.querySelector("[name='imagen']")?.files?.[0];
    let imagen_data = null;
    if (file) {
      imagen_data = await readFileAsDataURL(file);
    }

    if (payload.id) {
      await apiFetch(`/api/galeria/${payload.id}`, {
        method: "PUT",
        json: {
          titulo: payload.titulo,
          descripcion: payload.descripcion,
          imagen_data
        }
      });
    } else {
      if (!imagen_data) return;
      await apiFetch("/api/galeria", {
        method: "POST",
        json: { titulo: payload.titulo, descripcion: payload.descripcion, imagen_data }
      });
    }

    galleryForm.reset();
    if (gallerySubmit) gallerySubmit.textContent = "Agregar imagen";
    if (galleryForm.querySelector("[name='id']")) galleryForm.querySelector("[name='id']").value = "";
    await loadGallery();
  });
}

if (reviewForm) {
  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(reviewForm);
    const payload = Object.fromEntries(formData.entries());
    await apiFetch("/api/resenas", {
      method: "POST",
      json: {
        nombre: payload.nombre,
        calificacion: Number(payload.calificacion),
        mensaje: payload.mensaje,
        fuente: payload.fuente
      }
    });
    reviewForm.reset();
    await loadReviewsAdmin();
  });
}

if (experienceForm) {
  experienceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(experienceForm);
    const payload = Object.fromEntries(formData.entries());
    await apiFetch("/api/experiencia", {
      method: "PUT",
      json: {
        seccion: payload.seccion,
        titulo: payload.titulo,
        descripcion: payload.descripcion
      }
    });
    await loadExperience();
  });
}

if (blockForm) {
  blockForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (blockStatus) blockStatus.textContent = "";
    const formData = new FormData(blockForm);
    const payload = Object.fromEntries(formData.entries());
    const startDate = payload.fecha;
    const mode = payload.modo || "single";
    const weekday = Number(payload.weekday);
    const rangeDays = 30;
    const startHour = payload.hora;
    const endHour = payload.hora_fin || "";

    if (endHour && timeToMinutes(endHour) <= timeToMinutes(startHour)) {
      if (blockStatus) blockStatus.textContent = "La hora final debe ser mayor que la hora inicial.";
      return;
    }

    const dates = [];
    const start = new Date(`${startDate}T00:00:00`);
    for (let i = 0; i < rangeDays; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const day = date.getDay();
      if (mode === "daily") {
        dates.push(date.toISOString().slice(0, 10));
      } else if (mode === "workweek" && day >= 1 && day <= 5) {
        dates.push(date.toISOString().slice(0, 10));
      } else if (mode === "weekday" && day === weekday) {
        dates.push(date.toISOString().slice(0, 10));
      } else if (mode === "single" && i === 0) {
        dates.push(date.toISOString().slice(0, 10));
      }
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const date of dates) {
      try {
        const res = await apiFetch("/api/bloqueos", {
          method: "POST",
          json: {
            barbero_id: payload.barbero_id,
            fecha: date,
            hora: startHour,
            hora_fin: endHour || null,
            motivo: payload.motivo
          }
        });

        if (res.ok) createdCount += 1;
        else skippedCount += 1;
      } catch (err) {
        skippedCount += 1;
      }
    }

    blockForm.reset();
    if (blockBarber) blockBarber.value = payload.barbero_id;
    const dateInput = blockForm.querySelector("[name='fecha']");
    if (dateInput) {
      dateInput.value = startDate;
    }
    if (blockMode) blockMode.value = "single";
    syncBlockWeekday();
    await loadBlocks();
    await loadCalendar();

    if (blockStatus) {
      if (createdCount) {
        blockStatus.textContent = `Bloqueo guardado en ${createdCount} fecha(s).${skippedCount ? ` ${skippedCount} ya existian o se omitieron por duplicado.` : ""}`;
      } else {
        blockStatus.textContent = "No se generaron nuevos bloqueos porque ya existian en ese rango.";
      }
    }
  });

  const dateInput = blockForm.querySelector("[name='fecha']");
  if (dateInput) {
    dateInput.addEventListener("change", loadBlocks);
    const today = new Date().toISOString().slice(0, 10);
    dateInput.value = dateInput.value || today;
  }
}

if (blockBarber) blockBarber.addEventListener("change", loadBlocks);

if (noteSave) {
  noteSave.addEventListener("click", async () => {
    if (!state.selectedAppointment) return;
    await apiFetch(`/api/citas/${state.selectedAppointment.id}`, {
      method: "PUT",
      json: { admin_notas: noteText.value }
    });
    await loadCalendar();
    await loadUpcoming();
  });
}

if (noteCancel) {
  noteCancel.addEventListener("click", async () => {
    if (!state.selectedAppointment) return;
    await apiFetch(`/api/citas/${state.selectedAppointment.id}`, {
      method: "PUT",
      json: { status: "cancelada" }
    });
    await loadCalendar();
    await loadUpcoming();
    await loadCanceladas();
  });
}

if (noteConfirm) {
  noteConfirm.addEventListener("click", async () => {
    if (!state.selectedAppointment) return;
    await apiFetch(`/api/citas/${state.selectedAppointment.id}`, {
      method: "PUT",
      json: { status: "confirmada" }
    });
    await loadCalendar();
    await loadUpcoming();
  });
}

if (sendWhatsApp) {
  sendWhatsApp.addEventListener("click", () => {
    if (!state.selectedAppointment) return;
    const cita = state.selectedAppointment;
    const phone = (cita.cliente_contacto || "").replace(/\D/g, "");
    if (!phone) return;
    const text = encodeURIComponent(
      `Hola ${cita.cliente_nombre}, tu cita para ${cita.servicio_nombre} es el ${formatDate(
        cita.fecha
      )} a las ${cita.hora}.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  });
}

if (clientSearch) {
  clientSearch.addEventListener("click", async () => {
    if (!clientContact || !clientContact.value) return;
    const res = await apiFetch(`/api/clientes/history?contacto=${encodeURIComponent(clientContact.value)}`);
    const rows = res.ok ? await res.json() : [];
    renderHistory(rows);
  });
}

const downloadExportFile = async (url, fallbackName) => {
  const res = await apiFetch(url);
  if (!res.ok) {
    alert("No se pudo generar la exportacion.");
    return;
  }
  const blob = await res.blob();
  const urlBlob = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const disposition = res.headers.get("Content-Disposition") || "";
  const fileMatch = disposition.match(/filename="?([^"]+)"?/i);
  link.href = urlBlob;
  link.download = fileMatch ? fileMatch[1] : fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(urlBlob);
};

if (exportMonthlyBtn) {
  exportMonthlyBtn.addEventListener("click", async () => {
    const month = exportMonthSelect?.value;
    const year = exportYearSelect?.value;
    if (!month || !year) {
      alert("Selecciona mes y ano para exportar.");
      return;
    }
    await downloadExportFile(
      `/api/citas/export?scope=monthly&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`,
      `old-west-citas-${year}-${month}.xls`
    );
  });
}

if (exportAnnualBtn) {
  exportAnnualBtn.addEventListener("click", async () => {
    const year = exportAnnualYearSelect?.value;
    if (!year) {
      alert("Selecciona un ano para exportar.");
      return;
    }
    await downloadExportFile(
      `/api/citas/export?scope=annual&year=${encodeURIComponent(year)}`,
      `old-west-citas-${year}.xls`
    );
  });
}

if (userForm) {
  userForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(userForm);
    const payload = Object.fromEntries(formData.entries());

    if (payload.id) {
      await apiFetch(`/api/users/${payload.id}`, {
        method: "PUT",
        json: {
          username: payload.username,
          password: payload.password || undefined,
          role: payload.role
        }
      });
    } else {
      await apiFetch("/api/users", {
        method: "POST",
        json: {
          username: payload.username,
          password: payload.password,
          role: payload.role
        }
      });
    }

    userForm.reset();
    await loadUsers();
  });
}

if (userClear) {
  userClear.addEventListener("click", () => {
    if (userForm) userForm.reset();
  });
}

const syncBlockWeekday = () => {
  if (!blockMode || !blockWeekdayWrap) return;
  const mode = blockMode.value;
  const showWeekday = mode === "weekday";
  blockWeekdayWrap.hidden = !showWeekday;
  blockWeekdayWrap.classList.toggle("field--locked", !showWeekday);
  if (blockWeekdaySelect) {
    blockWeekdaySelect.disabled = !showWeekday;
  }
};

if (blockMode && blockWeekdayWrap) {
  blockMode.addEventListener("change", syncBlockWeekday);
  syncBlockWeekday();
}

const token = getToken();
if (token) {
  showAdmin(true);
  loadAll().catch(() => {});
} else {
  showAdmin(false);
}

setupAccordion();
setupSubAccordion();
