// Sticky nav blur on scroll
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav");

// Mobile menu toggle
if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("nav--open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navMenu.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      navMenu.classList.remove("nav--open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const onScroll = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

window.addEventListener("scroll", onScroll);
window.addEventListener("load", onScroll);

// Servicios dinamicos (publico)
const servicesPreview = document.querySelector(".js-services-preview");
const servicesCatalog = document.querySelector(".js-services-catalog");
const barbersSection = document.querySelector(".js-barbers-section");
const barbersTrack = document.querySelector(".js-barbers-track");

const gallerySelect = document.querySelector(".js-gallery-select");
const galleryPreview = document.querySelector(".js-gallery-preview");
const galleryFrame = document.querySelector(".gallery-preview");
const galleryTitle = document.querySelector(".js-gallery-title");
const galleryDesc = document.querySelector(".js-gallery-desc");
const experienceTitleNodes = document.querySelectorAll("[data-exp-title]");
const experienceTextNodes = document.querySelectorAll("[data-exp-text]");

const defaultServices = [
  {
    nombre: "Corte signature",
    categoria: "Cabello",
    duracion_min: 40,
    precio_min: 20000,
    descripcion: "Corte clásico o moderno con acabado limpio."
  },
  {
    nombre: "Combo corte + barba",
    categoria: "Combo",
    duracion_min: 55,
    precio_min: 30000,
    descripcion: "Servicio completo con perfilado profesional."
  },
  {
    nombre: "Perfilado de barba",
    categoria: "Barba",
    duracion_min: 15,
    precio_min: 10000,
    descripcion: "Perfilado preciso y acabado limpio."
  },
  {
    nombre: "Afeitado tradicional",
    categoria: "Barba",
    duracion_min: 20,
    precio_min: 15000,
    descripcion: "Afeitado clásico con toalla caliente."
  },
  {
    nombre: "Diseños y líneas",
    categoria: "Detalle",
    duracion_min: 15,
    precio_min: 5000,
    descripcion: "Detalles personalizados para tu estilo."
  },
  {
    nombre: "Depilación facial",
    categoria: "Extra",
    duracion_min: 10,
    precio_min: 5000,
    descripcion: "Acabado facial prolijo y rápido."
  }
];

const formatPrice = (value) => {
  if (!value) return "Consultar";
  return `COP ${new Intl.NumberFormat("es-CO").format(value)}`;
};

const serviceCopy = (service) => {
  if (service.descripcion) return service.descripcion;
  const name = (service.nombre || "").toLowerCase();
  if (name.includes("combo")) return "Servicio completo con perfilado profesional.";
  if (name.includes("barba")) return "Perfilado preciso y acabado limpio.";
  if (name.includes("afeitado")) return "Afeitado tradicional con toalla caliente.";
  if (name.includes("diseño") || name.includes("línea")) return "Detalles personalizados para tu estilo.";
  if (name.includes("depilación") || name.includes("depilación")) return "Acabado facial prolijo y rápido.";
  return "Servicio premium con detalle artesanal.";
};

const renderServiceCard = (service, showTag) => {
  const tag = service.categoria || "Servicio";
  const price = formatPrice(service.precio_min);
  const duration = service.duracion_min ? `${service.duracion_min} min` : "Tiempo estimado";
  return `
    <article class="card">
      ${showTag ? `<span class="card__tag">${tag}</span>` : ""}
      <h3>${service.nombre}</h3>
      <p>${serviceCopy(service)}</p>
      <div class="card__meta">
        <span>${duration}</span>
        <span>${price}</span>
      </div>
    </article>
  `;
};

const loadPublicServices = async () => {
  if (!servicesPreview && !servicesCatalog) return;
  try {
    const res = await fetch("/api/servicios");
    if (!res.ok) return;
    const services = await res.json();
    const finalServices = services.length ? services : defaultServices;
    if (servicesPreview) {
      servicesPreview.innerHTML = finalServices
        .slice(0, 4)
        .map((service) => renderServiceCard(service, false))
        .join("");
    }
    if (servicesCatalog) {
      servicesCatalog.innerHTML = finalServices.map((service) => renderServiceCard(service, true)).join("");
    }
  } catch (err) {
    const finalServices = defaultServices;
    if (servicesPreview) {
      servicesPreview.innerHTML = finalServices
        .slice(0, 4)
        .map((service) => renderServiceCard(service, false))
        .join("");
    }
    if (servicesCatalog) {
      servicesCatalog.innerHTML = finalServices.map((service) => renderServiceCard(service, true)).join("");
    }
  }
};

loadPublicServices();

const renderBarberCard = (barber) => {
  const image = barber.imagen_data || "assets/logo-principal-clean.png";
  const description = barber.descripcion || "Barbero Old West Barbería.";
  const serviceItems = barber.servicios || [];
  const visibleServices = serviceItems.slice(0, 2);
  const hiddenServices = serviceItems.slice(2);
  const visibleServicesMarkup = visibleServices.length
    ? visibleServices.map((service) => `<span class="barber-showcase__service">${service.nombre}</span>`).join("")
    : `<span class="barber-showcase__service barber-showcase__service--empty">Sin servicios asignados</span>`;
  const hiddenServicesMarkup = hiddenServices.length
    ? `
      <details class="barber-showcase__more">
        <summary class="barber-showcase__more-toggle" aria-label="Ver más servicios de ${barber.nombre}">
          +${hiddenServices.length} servicio${hiddenServices.length > 1 ? "s" : ""}
        </summary>
        <div class="barber-showcase__more-list">
          ${hiddenServices.map((service) => `<span class="barber-showcase__service">${service.nombre}</span>`).join("")}
        </div>
      </details>
    `
    : "";
  const bookingUrl = `agendamiento.html?barbero_id=${encodeURIComponent(barber.id)}`;
  return `
    <figure class="carousel__item barber-showcase__card">
      <img src="${image}" alt="${barber.nombre}" loading="lazy" />
      <figcaption class="barber-showcase__copy">
        <strong>${barber.nombre}</strong>
        <div class="barber-showcase__services">${visibleServicesMarkup}</div>
        ${hiddenServicesMarkup}
        <p>${description}</p>
        <a class="btn btn--primary btn--small barber-showcase__cta" href="${bookingUrl}">Reservar cita con este barbero</a>
      </figcaption>
    </figure>
  `;
};

const getVisibleBarberCards = () => {
  if (window.innerWidth <= 620) return 1;
  if (window.innerWidth <= 860) return 2;
  return 4;
};

const updateBarberCarouselNavigation = () => {
  const barberCarousel = document.querySelector(".carousel--barbers");
  if (!barberCarousel || !barbersTrack) return;
  const buttons = barberCarousel.querySelectorAll("[data-carousel]");
  const totalItems = barbersTrack.querySelectorAll(".carousel__item").length;
  const shouldShowButtons = totalItems > getVisibleBarberCards();

  barberCarousel.classList.toggle("carousel--static", !shouldShowButtons);
  buttons.forEach((button) => {
    button.hidden = !shouldShowButtons;
    button.setAttribute("aria-hidden", String(!shouldShowButtons));
  });
};

const loadPublicBarbers = async () => {
  if (!barbersSection || !barbersTrack) return;
  try {
    const res = await fetch("/api/barbers");
    if (!res.ok) return;
    const barbers = await res.json();
    if (!barbers.length) {
      barbersSection.hidden = true;
      return;
    }
    barbersTrack.innerHTML = barbers.map(renderBarberCard).join("");
    barbersSection.hidden = false;
    updateBarberCarouselNavigation();
  } catch (err) {
    barbersSection.hidden = true;
  }
};

loadPublicBarbers();
window.addEventListener("resize", updateBarberCarouselNavigation);

// Reviews (Google Maps + Instagram)
const reviewContainers = document.querySelectorAll(".js-reviews");

const renderRating = (value) => {
  if (!value) return "";
  const total = Math.max(0, Math.min(5, Number(value)));
  const filled = Math.round(total);
  const empty = Math.max(0, 5 - filled);
  return `${"&#9733;".repeat(filled)}${"&#9734;".repeat(empty)}`;
};

const renderReview = (review) => {
  const score = review.rating ? `${Number(review.rating).toFixed(1)}/5` : "";
  return `
    <article class="review-card">
      <div class="review-meta">
        <span>${review.author || "Cliente"}</span>
        <span class="review-rating">${renderRating(review.rating)} <em>${score}</em></span>
      </div>
      <p>${review.text}</p>
      <div class="review-meta">
        <span class="review-source">Fuente: ${review.source || "Google Maps"}</span>
        <span>${review.date || ""}</span>
      </div>
    </article>
  `;
};

const formatReviewDate = (value) => {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(value))) return String(value);

  const parsed = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return String(value);

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(parsed);
};

const normalizeReview = (item) => ({
  author: item.author || item.nombre || "Cliente",
  rating: item.rating || item.calificacion || 0,
  text: item.text || item.mensaje || "",
  date: formatReviewDate(item.date || item.created_at || ""),
  source: item.fuente || item.source || (item.nombre ? "Reseñas internas" : "Google Maps")
});

const loadReviews = async () => {
  if (!reviewContainers.length) return;
  let reviews = [];
  try {
    const apiRes = await fetch("/api/resenas");
    if (apiRes.ok) {
      const apiRows = await apiRes.json();
      reviews = apiRows.map(normalizeReview);
    }
  } catch (err) {
    // ignore
  }

  if (!reviews.length) {
    try {
      const res = await fetch("/assets/reviews.json");
      if (!res.ok) throw new Error("no reviews");
      const rows = await res.json();
      reviews = rows.map(normalizeReview);
    } catch (err) {
      reviews = [];
    }
  }

  reviewContainers.forEach((container) => {
    const limit = Number(container.dataset.limit || reviews.length);
    const items = reviews.slice(0, limit);
    if (!items.length) {
      container.innerHTML = "<p class='form-note'>Reseñas en actualización.</p>";
      return;
    }
    container.innerHTML = items.map(renderReview).join("");
  });
};

loadReviews();

const loadExperienceContent = async () => {
  if (!experienceTitleNodes.length && !experienceTextNodes.length) return;

  try {
    const res = await fetch("/api/experiencia");
    if (!res.ok) return;

    const items = await res.json();
    if (!Array.isArray(items) || !items.length) return;

    const map = new Map(items.map((item) => [item.seccion, item]));

    experienceTitleNodes.forEach((node) => {
      const item = map.get(node.dataset.expTitle);
      if (item?.titulo) node.textContent = item.titulo;
    });

    experienceTextNodes.forEach((node) => {
      const item = map.get(node.dataset.expText);
      if (item?.descripcion) node.textContent = item.descripcion;
    });
  } catch (err) {
    // ignore
  }
};

loadExperienceContent();

const renderGalleryOption = (item, index) => {
  const label = item.titulo || `Imagen ${index + 1}`;
  return `<option value="${item.id}">${label}</option>`;
};

const setGalleryPreview = (item) => {
  if (!item || !galleryPreview) return;
  galleryPreview.classList.remove("is-active");
  requestAnimationFrame(() => {
    galleryPreview.src = item.imagen_data;
    galleryPreview.alt = item.titulo || "Galería Old West";
    if (galleryTitle) galleryTitle.textContent = item.titulo || "Galería";
    if (galleryDesc) galleryDesc.textContent = item.descripcion || "";
    galleryPreview.classList.add("is-active");
  });
};

const loadGallery = async () => {
  if (!gallerySelect || !galleryPreview) return;
  try {
    const res = await fetch("/api/galeria");
    if (!res.ok) return;
    const items = await res.json();
    if (!items.length) return;
    gallerySelect.innerHTML = `<option value="">Selecciona una imagen</option>` +
      items.map(renderGalleryOption).join("");

    const first = items[0];
    setGalleryPreview(first);
    gallerySelect.value = String(first.id);

    gallerySelect.addEventListener("change", () => {
      const selected = items.find((item) => String(item.id) === gallerySelect.value);
      if (selected) setGalleryPreview(selected);
    });
  } catch (err) {
    // fallback
  }
};

loadGallery();



// WhatsApp form handler (agendamiento + contacto)
const forms = document.querySelectorAll(".js-whatsapp-form");

forms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const phone = form.dataset.phone || "573229091440";
    const name = form.querySelector("[name='nombre']")?.value.trim();
    const service = form.querySelector("[name='servicio']")?.value.trim();
    const date = form.querySelector("[name='fecha']")?.value;
    const time = form.querySelector("[name='hora']")?.value;
    const contact = form.querySelector("[name='medio']")?.value.trim();
    const message = form.querySelector("[name='mensaje']")?.value.trim();

    const parts = [];
    if (name) {
      parts.push(`Hola, soy ${name}.`);
    }
    if (service) {
      parts.push(`Quiero agendar ${service}.`);
    }
    if (date) {
      parts.push(`Fecha: ${date}.`);
    }
    if (time) {
      parts.push(`Hora: ${time}.`);
    }
    if (contact) {
      parts.push(`Contacto: ${contact}.`);
    }
    if (message) {
      parts.push(`Mensaje: ${message}`);
    }

    const text = encodeURIComponent(parts.join(" "));
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  });
});

// Booking form with calendar availability
const bookingForm = document.querySelector(".js-booking-form");

if (bookingForm) {
  const barberoSelect = bookingForm.querySelector("[name='barbero_id']");
  const servicioSelect = bookingForm.querySelector("[name='servicio_id']");
  const barberNote = bookingForm.querySelector(".js-booking-barber-note");
  const serviceNote = bookingForm.querySelector(".js-booking-service-note");
  const dateInput = bookingForm.querySelector(".js-booking-date");
  const timeInput = bookingForm.querySelector(".js-booking-time");
  const statusEl = bookingForm.querySelector(".js-booking-status");
  const calendarDays = bookingForm.querySelector(".js-cal-days");
  const calendarRange = bookingForm.querySelector(".js-cal-range");
  const prevBtn = bookingForm.querySelector(".js-cal-prev");
  const nextBtn = bookingForm.querySelector(".js-cal-next");
  const slotGrid = bookingForm.querySelector(".js-slot-grid");
  const slotStatus = bookingForm.querySelector(".js-slot-status");
  const selectionText = bookingForm.querySelector(".js-booking-selection");

  let availability = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let currentStart = new Date(today);
  let selectedDate = "";
  let selectedTime = "";
  const todayISO = today.toISOString().slice(0, 10);
  const bookingParams = new URLSearchParams(window.location.search);
  const presetBarberId = bookingParams.get("barbero_id") || "";
  let bookingBarbers = [];
  const timeToMinutes = (value) => {
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
  };

  const toISO = (date) => date.toISOString().slice(0, 10);
  const formatLabel = (dateStr) => {
    const date = new Date(`${dateStr}T00:00:00`);
    const day = date.toLocaleDateString("es-CO", { weekday: "short" });
    const dayNum = date.getDate();
    return `${day} ${dayNum}`;
  };

  const setSelection = () => {
    if (!selectionText) return;
    if (selectedDate && selectedTime) {
      selectionText.textContent = `Seleccionado: ${selectedDate} a las ${selectedTime}.`;
    } else if (selectedDate) {
      selectionText.textContent = `Seleccionado: ${selectedDate}.`;
    } else {
      selectionText.textContent = "";
    }
  };

  const getCurrentBarber = () =>
    bookingBarbers.find((barber) => String(barber.id) === String(barberoSelect.value));

  const setBarberLockState = (locked) => {
    if (!barberoSelect) return;
    barberoSelect.disabled = locked;
    barberoSelect.dataset.locked = locked ? "true" : "false";
    barberoSelect.closest(".field")?.classList.toggle("field--locked", locked);
    if (barberNote) {
      barberNote.textContent = locked ? "Barbero preseleccionado desde Nuestros barberos." : "";
    }
  };

  const renderServicesForBarber = (preferredServiceId = "") => {
    const barber = getCurrentBarber();
    const services = barber?.servicios || [];

    if (!services.length) {
      servicioSelect.innerHTML = `<option value="">Sin servicios disponibles para este barbero</option>`;
      servicioSelect.value = "";
      servicioSelect.disabled = true;
      servicioSelect.closest(".field")?.classList.add("field--locked");
      if (serviceNote) {
        serviceNote.textContent = "Este barbero no tiene servicios habilitados por ahora.";
      }
      return;
    }

    servicioSelect.disabled = false;
    servicioSelect.closest(".field")?.classList.remove("field--locked");
    if (serviceNote) {
      serviceNote.textContent = "Solo verás servicios disponibles para el barbero seleccionado.";
    }
    servicioSelect.innerHTML = services
      .map((service) => `<option value="${service.id}">${service.nombre}</option>`)
      .join("");

    const hasPreferred = services.some((service) => String(service.id) === String(preferredServiceId));
    servicioSelect.value = hasPreferred ? String(preferredServiceId) : String(services[0].id);
  };

  const renderSlots = (dateStr) => {
    if (!slotGrid || !slotStatus) return;
    const slots = availability[dateStr] || [];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    slotGrid.innerHTML = "";
    if (!slots.length) {
      slotStatus.textContent = "Sin horas disponibles para esta fecha.";
      return;
    }
    const availableSlots =
      dateStr === todayISO
        ? slots.filter((slot) => timeToMinutes(slot) >= currentMinutes)
        : slots;
    slotStatus.textContent = `${availableSlots.length} horas disponibles.`;
    slotGrid.innerHTML = slots
      .map((slot) => {
        const isPast = dateStr === todayISO && timeToMinutes(slot) < currentMinutes;
        const classes = isPast ? "slot-btn is-disabled" : "slot-btn";
        const label = isPast ? `${slot} · No disponible` : slot;
        return `<button class="${classes}" type="button" data-time="${slot}" ${
          isPast ? "disabled" : ""
        }>${label}</button>`;
      })
      .join("");

    slotGrid.querySelectorAll(".slot-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("is-disabled")) return;
        selectedTime = btn.dataset.time;
        timeInput.value = selectedTime;
        slotGrid.querySelectorAll(".slot-btn").forEach((item) => item.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        setSelection();
      });
    });
  };

  const renderDays = () => {
    if (!calendarDays || !calendarRange) return;
    const dates = Object.keys(availability);
    const first = dates[0];
    const last = dates[dates.length - 1];
    calendarRange.textContent = first && last ? `${first} · ${last}` : "Semana";

    calendarDays.innerHTML = dates
      .map((dateStr) => {
        const slots = availability[dateStr] || [];
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const availableSlots =
          dateStr === todayISO
            ? slots.filter((slot) => timeToMinutes(slot) >= currentMinutes)
            : slots;
        const disabled = slots.length === 0 || dateStr < todayISO ? "is-disabled" : "";
        const selected = dateStr === selectedDate ? "is-selected" : "";
        return `
          <button class="day-card ${disabled} ${selected}" type="button" data-date="${dateStr}">
            <span>${formatLabel(dateStr)}</span>
            <strong>${availableSlots.length} hrs</strong>
          </button>
        `;
      })
      .join("");

    calendarDays.querySelectorAll(".day-card").forEach((card) => {
      card.addEventListener("click", () => {
        if (card.classList.contains("is-disabled")) return;
        selectedDate = card.dataset.date;
        dateInput.value = selectedDate;
        selectedTime = "";
        timeInput.value = "";
        calendarDays.querySelectorAll(".day-card").forEach((item) => item.classList.remove("is-selected"));
        card.classList.add("is-selected");
        renderSlots(selectedDate);
        setSelection();
      });
    });
  };

  const refreshAvailability = async () => {
    const barberoId = barberoSelect.value;
    const servicioId = servicioSelect.value;
    if (!barberoId || !servicioId) {
      availability = {};
      selectedDate = "";
      selectedTime = "";
      dateInput.value = "";
      timeInput.value = "";
      if (calendarDays) calendarDays.innerHTML = "";
      if (slotGrid) slotGrid.innerHTML = "";
      if (slotStatus) {
        slotStatus.textContent = barberoId
          ? "Este barbero no tiene servicios disponibles."
          : "Selecciona barbero y servicio para ver la agenda.";
      }
      if (calendarRange) calendarRange.textContent = "Semana";
      setSelection();
      return;
    }

    const start = toISO(currentStart);
    const res = await fetch(
      `/api/availability-range?barbero_id=${barberoId}&start=${start}&days=7&servicio_id=${servicioId}`
    );
    availability = (await res.json()) || {};

    const dates = Object.keys(availability);
    selectedDate = dates.includes(todayISO) ? todayISO : dates.find((dateStr) => dateStr >= todayISO) || "";
    dateInput.value = selectedDate;
    selectedTime = "";
    timeInput.value = "";
    renderDays();
    if (selectedDate) {
      renderSlots(selectedDate);
    } else if (slotStatus) {
      slotStatus.textContent = "Sin disponibilidad para esta semana.";
    }
    setSelection();

    if (prevBtn) {
      const isAtStart = toISO(currentStart) <= todayISO;
      prevBtn.disabled = isAtStart;
      prevBtn.classList.toggle("is-disabled", isAtStart);
    }
  };

  const loadOptions = async () => {
    const barberosRes = await fetch("/api/barbers");
    const barberos = await barberosRes.json();
    bookingBarbers = barberos;

    barberoSelect.innerHTML = barberos.length
      ? barberos.map((b) => `<option value="${b.id}">${b.nombre}</option>`).join("")
      : `<option value="">Sin barberos disponibles</option>`;

    if (barberos.length === 0 && statusEl) {
      statusEl.textContent = "Aún no hay barberos registrados en el sistema.";
    }

    const presetBarber = barberos.find((barber) => String(barber.id) === String(presetBarberId));
    if (presetBarber) {
      barberoSelect.value = String(presetBarber.id);
      setBarberLockState(true);
      if (statusEl) {
        statusEl.textContent = `Barbero seleccionado: ${presetBarber.nombre}.`;
        statusEl.style.color = "#fff7e8";
      }
    } else {
      setBarberLockState(false);
      if (barberos.length) {
        barberoSelect.value = String(barberos[0].id);
      }
    }

    renderServicesForBarber();
  };

  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (statusEl) statusEl.textContent = "";

    if (!dateInput.value || !timeInput.value) {
      if (statusEl) {
        statusEl.textContent = "Selecciona fecha y hora antes de confirmar.";
        statusEl.style.color = "#d6b06b";
      }
      return;
    }

    const formData = new FormData(bookingForm);
    const payload = Object.fromEntries(formData.entries());
    payload.barbero_id = barberoSelect.value;
    payload.servicio_id = servicioSelect.value;

    if (!payload.servicio_id) {
      if (statusEl) {
        statusEl.textContent = "Este barbero no tiene servicios habilitados para reservar.";
        statusEl.style.color = "#d6b06b";
      }
      return;
    }

    const res = await fetch("/api/citas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.status === 409) {
      if (statusEl) {
        statusEl.textContent = "Esa hora ya no estÃ¡ disponible.";
        statusEl.style.color = "#d6b06b";
      }
      await refreshAvailability();
      return;
    }

    if (!res.ok) {
      let message = "No pudimos registrar la cita. Inténtalo de nuevo.";
      try {
        const errorData = await res.json();
        if (errorData?.error) message = errorData.error;
      } catch (err) {
        // ignore
      }
      if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = "#d6b06b";
      }
      return;
    }

    if (statusEl) {
      statusEl.textContent = "Cita registrada. Te contactaremos para confirmar.";
      statusEl.style.color = "#fff7e8";
    }

    const lockedBarberId = barberoSelect.value;
    bookingForm.reset();
    if (barberoSelect.disabled) {
      barberoSelect.value = lockedBarberId;
    } else if (bookingBarbers.length) {
      barberoSelect.value = String(bookingBarbers[0].id);
    }
    renderServicesForBarber();
    selectedDate = "";
    selectedTime = "";
    currentStart = new Date(today);
    await refreshAvailability();
  });

  barberoSelect.addEventListener("change", () => {
    currentStart = new Date(today);
    renderServicesForBarber();
    refreshAvailability();
  });
  servicioSelect.addEventListener("change", refreshAvailability);

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const prev = new Date(currentStart);
      prev.setDate(prev.getDate() - 7);
      currentStart = prev < today ? new Date(today) : prev;
      refreshAvailability();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentStart.setDate(currentStart.getDate() + 7);
      refreshAvailability();
    });
  }

  loadOptions().then(refreshAvailability);
}

// Simple carousel controls
const carousels = document.querySelectorAll(".carousel");

carousels.forEach((carousel) => {
  const track = carousel.querySelector(".js-carousel");
  const buttons = carousel.querySelectorAll("[data-carousel]");
  if (!track || !buttons.length) return;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const direction = button.dataset.carousel === "next" ? 1 : -1;
        const item = track.querySelector(".carousel__item");
        const gap = Number.parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap || "16");
        const scrollAmount = item ? item.clientWidth + gap : 260;
        track.scrollBy({ left: scrollAmount * direction, behavior: "smooth" });
      });
    });
  });
