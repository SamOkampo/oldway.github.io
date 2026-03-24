const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "oldwest2017";

const DB_PATH = path.join(__dirname, "data", "oldwest.db");
const BACKUP_DIR = path.join(__dirname, "data", "backups");

if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"));
}

const db = new sqlite3.Database(DB_PATH);
const tokens = new Map();

app.use(express.json({ limit: "12mb" }));
app.use(express.static(__dirname));

app.get(["/admin", "/gestion"], (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const hashContraseña = (value) => crypto.createHash("sha256").update(value).digest("hex");

const ensureColumn = async (table, column, definition) => {
  const columns = await all(`PRAGMA table_info(${table})`);
  const exists = columns.some((col) => col.name === column);
  if (!exists) {
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

const initDb = async () => {
  await run("PRAGMA foreign_keys = ON");

  await run(`
    CREATE TABLE IF NOT EXISTS barberos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      imagen_data TEXT,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      categoria TEXT DEFAULT 'General',
      duracion_min INTEGER NOT NULL,
      precio_min INTEGER,
      precio_max INTEGER,
      activo INTEGER DEFAULT 1
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS galeria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      imagen_data TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS resenas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      calificacion INTEGER NOT NULL,
      mensaje TEXT NOT NULL,
      fuente TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS experiencia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seccion TEXT NOT NULL UNIQUE,
      titulo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS horarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbero_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_day_off INTEGER DEFAULT 0,
      FOREIGN KEY (barbero_id) REFERENCES barberos(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS barbero_servicios (
      barbero_id INTEGER NOT NULL,
      servicio_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (barbero_id, servicio_id),
      FOREIGN KEY (barbero_id) REFERENCES barberos(id) ON DELETE CASCADE,
      FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS citas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbero_id INTEGER NOT NULL,
      servicio_id INTEGER NOT NULL,
      cliente_nombre TEXT NOT NULL,
      cliente_contacto TEXT,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      notas TEXT,
      status TEXT DEFAULT 'pendiente',
      admin_notas TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
      UNIQUE(barbero_id, fecha, hora),
      FOREIGN KEY (barbero_id) REFERENCES barberos(id) ON DELETE CASCADE,
      FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS bloqueos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbero_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      motivo TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(barbero_id, fecha, hora),
      FOREIGN KEY (barbero_id) REFERENCES barberos(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id INTEGER,
      meta TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
    )
  `);

  await ensureColumn("servicios", "categoria", "TEXT DEFAULT 'General'");
  await ensureColumn("servicios", "descripcion", "TEXT");
  await ensureColumn("barberos", "descripcion", "TEXT");
  await ensureColumn("barberos", "imagen_data", "TEXT");
  await ensureColumn("bloqueos", "hora_fin", "TEXT");
  await ensureColumn("citas", "status", "TEXT DEFAULT 'pendiente'");
  await ensureColumn("citas", "admin_notas", "TEXT");
  await ensureColumn("citas", "updated_at", "TEXT");
  await ensureColumn("resenas", "fuente", "TEXT");

  const servicioCount = await get("SELECT COUNT(*) as total FROM servicios");
  if (servicioCount.total === 0) {
    const seed = [
      ["Corte signature", "Cabello", 40, 20000, 30000],
      ["Combo corte + barba", "Combo", 55, 30000, 40000],
      ["Perfilado de barba", "Barba", 15, 10000, 20000],
      ["Afeitado tradicional", "Barba", 20, 15000, 25000],
      ["Diseños y líneas", "Detalle", 15, 5000, 10000],
      ["Depilación facial", "Extra", 10, 5000, 8000]
    ];

    for (const item of seed) {
      await run(
        "INSERT INTO servicios (nombre, categoria, duracion_min, precio_min, precio_max) VALUES (?, ?, ?, ?, ?)",
        item
      );
    }
  }


  const experienciaCount = await get("SELECT COUNT(*) as total FROM experiencia");
  if (experienciaCount.total === 0) {
    const experienciaSeed = [
      ["historia", "Viejo Oeste", "La identidad Old West vive en cada detalle con técnica, estilo y comunidad."],
      ["filosofia", "Una barbería con alma western", "Estilo, técnica y comunidad en un espacio premium."],
      ["manifiesto", "Pasional, técnico, auténtico", "Cada día nos esforzamos más y más. No es solo un corte, es tu estilo de vida."],
      ["diferenciadores", "Detalle real", "Líneas limpias, ambiente premium y una firma personal."]
    ];
    for (const item of experienciaSeed) {
      await run("INSERT INTO experiencia (seccion, titulo, descripcion) VALUES (?, ?, ?)", item);
    }
  }

  const galeriaCount = await get("SELECT COUNT(*) as total FROM galeria");
  if (galeriaCount.total === 0) {
    const galeriaSeed = [
      ["Corte textured crop", "Textura y fade limpio.", "assets/corte-01.jpg"],
      ["Corte mullet moderno", "Mullet moderno con degradado.", "assets/corte-02.jpg"],
      ["Corte mullet perfil", "Perfil definido con volumen.", "assets/corte-03.jpg"],
      ["Equipo Old West", "El equipo que cuida cada detalle.", "assets/equipo.jpg"],
      ["Logo Old West", "Identidad Old West desde 2017.", "assets/logo-principal-clean.png"],
        ["Emblema Old West", "Estética western con acabado premium.", "assets/logo-alternativo-clean.png"]
    ];
    for (const item of galeriaSeed) {
      await run("INSERT INTO galeria (titulo, descripcion, imagen_data) VALUES (?, ?, ?)", item);
    }
  }

  const resenasCount = await get("SELECT COUNT(*) as total FROM resenas");
  if (resenasCount.total === 0) {
    try {
      const reviewsPath = path.join(__dirname, "assets", "reviews.json");
      const raw = fs.readFileSync(reviewsPath, "utf-8");
      const reviews = JSON.parse(raw);
      for (const review of reviews) {
        const nombre = review.author || "Cliente";
        const calificacion = Number(review.rating || 5);
        const mensaje = review.text || "";
        if (!mensaje) continue;
        const fuente = review.source || "Google Maps";
        await run(
          "INSERT INTO resenas (nombre, calificacion, mensaje, fuente) VALUES (?, ?, ?, ?)",
          [nombre, calificacion, mensaje, fuente]
        );
      }
    } catch (err) {
      // Sin reseñas base si el archivo no existe.
    }
  }

  await run(
    "UPDATE experiencia SET titulo = 'Una barbería con alma western', descripcion = 'Estilo, técnica y comunidad en un espacio premium.' WHERE seccion = 'filosofia'"
  );
  await run(
    "UPDATE experiencia SET titulo = 'Pasional, técnico, auténtico', descripcion = 'Cada día nos esforzamos más y más. No es solo un corte, es tu estilo de vida.' WHERE seccion = 'manifiesto'"
  );
  await run(
    "UPDATE experiencia SET descripcion = 'La identidad Old West vive en cada detalle con técnica, estilo y comunidad.' WHERE seccion = 'historia'"
  );
  await run(
    "UPDATE experiencia SET descripcion = 'Líneas limpias, ambiente premium y una firma personal.' WHERE seccion = 'diferenciadores'"
  );
  await run("UPDATE servicios SET nombre = 'Diseños y líneas' WHERE nombre = 'Disenos y lineas'");
  await run("UPDATE servicios SET nombre = 'Depilación facial' WHERE nombre = 'Depilacion facial'");
  await run(
    "UPDATE galeria SET descripcion = 'Estética western con acabado premium.' WHERE descripcion = 'Estetica western con acabado premium.'"
  );
  await run(
    "UPDATE resenas SET nombre = 'Ricardo Rodríguez' WHERE nombre = 'Ricardo Rodriguez' AND fuente = 'Google Maps'"
  );
  await run(
    "UPDATE resenas SET mensaje = 'Excelente y esmerada atención.' WHERE mensaje = 'Excelente y esmerada atencion.' AND fuente = 'Google Maps'"
  );


  const adminExists = await get("SELECT id FROM usuarios WHERE username = ?", [ADMIN_USER]);
  if (!adminExists) {
    await run(
      "INSERT INTO usuarios (username, password_hash, role) VALUES (?, ?, ?)",
      [ADMIN_USER, hashContraseña(ADMIN_PASS), "admin"]
    );
  }
};

const normalizeIdArray = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0))];
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return normalizeIdArray(parsed);
      }
    } catch (err) {
      return normalizeIdArray(value.split(","));
    }
  }

  return [];
};

const hydrateBarbersWithServices = async (barbers, { onlyActiveServices = false } = {}) => {
  if (!barbers.length) return [];
  const barberIds = barbers.map((barber) => barber.id);
  const placeholders = barberIds.map(() => "?").join(", ");
  const activeClause = onlyActiveServices ? "AND s.activo = 1" : "";
  const rows = await all(
    `
      SELECT
        bs.barbero_id,
        s.id,
        s.nombre,
        s.categoria,
        s.descripcion,
        s.duracion_min,
        s.precio_min,
        s.precio_max,
        s.activo
      FROM barbero_servicios bs
      JOIN servicios s ON s.id = bs.servicio_id
      WHERE bs.barbero_id IN (${placeholders}) ${activeClause}
      ORDER BY s.nombre ASC
    `,
    barberIds
  );

  const map = new Map();
  barberIds.forEach((id) => map.set(id, []));
  rows.forEach((row) => {
    map.get(row.barbero_id)?.push({
      id: row.id,
      nombre: row.nombre,
      categoria: row.categoria,
      descripcion: row.descripcion,
      duracion_min: row.duracion_min,
      precio_min: row.precio_min,
      precio_max: row.precio_max,
      activo: row.activo
    });
  });

  return barbers.map((barber) => {
    const servicios = map.get(barber.id) || [];
    return {
      ...barber,
      servicio_ids: servicios.map((servicio) => servicio.id),
      servicios
    };
  });
};

const setBarberServices = async (barberoId, servicioIds) => {
  const ids = normalizeIdArray(servicioIds);
  await run("DELETE FROM barbero_servicios WHERE barbero_id = ?", [barberoId]);
  for (const servicioId of ids) {
    await run("INSERT OR IGNORE INTO barbero_servicios (barbero_id, servicio_id) VALUES (?, ?)", [barberoId, servicioId]);
  }
  return ids;
};

const barberHasService = async (barberoId, servicioId) => {
  if (!barberoId || !servicioId) return false;
  const row = await get(
    "SELECT 1 as ok FROM barbero_servicios WHERE barbero_id = ? AND servicio_id = ?",
    [barberoId, servicioId]
  );
  return Boolean(row?.ok);
};

const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");
  if (tokens.has(token)) {
    req.user = tokens.get(token);
    return next();
  }
  return res.status(401).json({ error: "No autorizado" });
};

const requireRole = (role) => (req, res, next) => {
  if (req.user?.role === role) return next();
  return res.status(403).json({ error: "Permisos insuficientes" });
};

const logAction = async (req, action, entity, entity_id, meta) => {
  const userId = req.user?.id || null;
  const payload = meta ? JSON.stringify(meta) : null;
  await run(
    "INSERT INTO audit_log (user_id, action, entity, entity_id, meta) VALUES (?, ?, ?, ?, ?)",
    [userId, action, entity, entity_id || null, payload]
  );
};

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Credenciales incompletas" });
  }
  const user = await get("SELECT * FROM usuarios WHERE username = ? AND activo = 1", [username]);
  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
  const hash = hashContraseña(password);
  if (hash !== user.password_hash) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
  const token = crypto.randomBytes(24).toString("hex");
  tokens.set(token, { id: user.id, username: user.username, role: user.role, createdAt: Date.now() });
  return res.json({ token, role: user.role });
});

app.get("/api/users", requireAuth, requireRole("admin"), async (req, res) => {
  const rows = await all("SELECT id, username, role, activo, created_at FROM usuarios ORDER BY id DESC");
  res.json(rows);
});

app.post("/api/users", requireAuth, requireRole("admin"), async (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Datos incompletos" });
  const result = await run(
    "INSERT INTO usuarios (username, password_hash, role) VALUES (?, ?, ?)",
    [username, hashContraseña(password), role || "admin"]
  );
  await logAction(req, "create", "usuarios", result.lastID, { username });
  const row = await get("SELECT id, username, role, activo, created_at FROM usuarios WHERE id = ?", [result.lastID]);
  res.json(row);
});

app.put("/api/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { username, password, role, activo } = req.body || {};
  if (password) {
    await run(
      "UPDATE usuarios SET username = COALESCE(?, username), password_hash = ?, role = COALESCE(?, role), activo = COALESCE(?, activo) WHERE id = ?",
      [username, hashContraseña(password), role, activo, id]
    );
  } else {
    await run(
      "UPDATE usuarios SET username = COALESCE(?, username), role = COALESCE(?, role), activo = COALESCE(?, activo) WHERE id = ?",
      [username, role, activo, id]
    );
  }
  await logAction(req, "update", "usuarios", id, { username, role, activo });
  const row = await get("SELECT id, username, role, activo, created_at FROM usuarios WHERE id = ?", [id]);
  res.json(row);
});

app.delete("/api/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  await run("DELETE FROM usuarios WHERE id = ?", [id]);
  await logAction(req, "delete", "usuarios", id, null);
  res.json({ ok: true });
});

app.get("/api/barbers", async (req, res) => {
  const rows = await all("SELECT * FROM barberos WHERE activo = 1 ORDER BY nombre ASC");
  const hydrated = await hydrateBarbersWithServices(rows, { onlyActiveServices: true });
  res.json(hydrated);
});

app.get("/api/barbers/all", requireAuth, async (req, res) => {
  const rows = await all("SELECT * FROM barberos ORDER BY nombre ASC");
  const hydrated = await hydrateBarbersWithServices(rows);
  res.json(hydrated);
});

app.post("/api/barbers", requireAuth, async (req, res) => {
  const { nombre, descripcion, imagen_data, activo, servicio_ids } = req.body || {};
  if (!nombre) return res.status(400).json({ error: "Nombre requerido" });
  const result = await run("INSERT INTO barberos (nombre, descripcion, imagen_data, activo) VALUES (?, ?, ?, ?)", [
    nombre,
    descripcion || "",
    imagen_data || null,
    activo ?? 1
  ]);
  const assignedServiceIds = await setBarberServices(result.lastID, servicio_ids || []);
  await logAction(req, "create", "barberos", result.lastID, { nombre, activo, servicio_ids: assignedServiceIds });
  const row = await get("SELECT * FROM barberos WHERE id = ?", [result.lastID]);
  const [hydrated] = await hydrateBarbersWithServices([row]);
  res.json(hydrated);
});

app.put("/api/barbers/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, imagen_data, activo, servicio_ids } = req.body || {};
  await run(
    "UPDATE barberos SET nombre = COALESCE(?, nombre), descripcion = COALESCE(?, descripcion), imagen_data = COALESCE(?, imagen_data), activo = COALESCE(?, activo) WHERE id = ?",
    [nombre, descripcion, imagen_data, activo, id]
  );
  let assignedServiceIds = null;
  if (Object.prototype.hasOwnProperty.call(req.body || {}, "servicio_ids")) {
    assignedServiceIds = await setBarberServices(id, servicio_ids || []);
  }
  await logAction(req, "update", "barberos", id, { nombre, activo, servicio_ids: assignedServiceIds });
  const row = await get("SELECT * FROM barberos WHERE id = ?", [id]);
  const [hydrated] = await hydrateBarbersWithServices([row]);
  res.json(hydrated);
});

app.delete("/api/barbers/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  await run("DELETE FROM barberos WHERE id = ?", [id]);
  await logAction(req, "delete", "barberos", id, null);
  res.json({ ok: true });
});

app.get("/api/servicios", async (req, res) => {
  const rows = await all("SELECT * FROM servicios WHERE activo = 1 ORDER BY id ASC");
  res.json(rows);
});

app.get("/api/servicios/all", requireAuth, async (req, res) => {
  const rows = await all("SELECT * FROM servicios ORDER BY id ASC");
  res.json(rows);
});

app.post("/api/servicios", requireAuth, async (req, res) => {
  const { nombre, categoria, descripcion, duracion_min, precio_min, precio_max, activo } = req.body || {};
  if (!nombre || !duracion_min) return res.status(400).json({ error: "Datos incompletos" });
  const result = await run(
    "INSERT INTO servicios (nombre, categoria, descripcion, duracion_min, precio_min, precio_max, activo) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [nombre, categoria || "General", descripcion || "", duracion_min, precio_min || null, precio_max || null, activo ?? 1]
  );
  await logAction(req, "create", "servicios", result.lastID, { nombre });
  const row = await get("SELECT * FROM servicios WHERE id = ?", [result.lastID]);
  res.json(row);
});

app.put("/api/servicios/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria, descripcion, duracion_min, precio_min, precio_max, activo } = req.body || {};
  await run(
    "UPDATE servicios SET nombre = COALESCE(?, nombre), categoria = COALESCE(?, categoria), descripcion = COALESCE(?, descripcion), duracion_min = COALESCE(?, duracion_min), precio_min = COALESCE(?, precio_min), precio_max = COALESCE(?, precio_max), activo = COALESCE(?, activo) WHERE id = ?",
    [nombre, categoria, descripcion, duracion_min, precio_min, precio_max, activo, id]
  );
  await logAction(req, "update", "servicios", id, { nombre });
  const row = await get("SELECT * FROM servicios WHERE id = ?", [id]);
  res.json(row);
});

app.delete("/api/servicios/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  await run("DELETE FROM servicios WHERE id = ?", [id]);
  await logAction(req, "delete", "servicios", id, null);
  res.json({ ok: true });
});

app.get("/api/horarios", requireAuth, async (req, res) => {
  const { barbero_id } = req.query;
  if (!barbero_id) return res.status(400).json({ error: "barbero_id requerido" });
  const rows = await all("SELECT * FROM horarios WHERE barbero_id = ? ORDER BY day_of_week ASC", [barbero_id]);
  res.json(rows);
});

app.post("/api/horarios", requireAuth, async (req, res) => {
  const { barbero_id, day_of_week, start_time, end_time, is_day_off } = req.body || {};
  if (barbero_id == null || day_of_week == null) {
    return res.status(400).json({ error: "Datos incompletos" });
  }
  const result = await run(
    "INSERT INTO horarios (barbero_id, day_of_week, start_time, end_time, is_day_off) VALUES (?, ?, ?, ?, ?)",
    [barbero_id, day_of_week, start_time || "09:00", end_time || "19:00", is_day_off ? 1 : 0]
  );
  await logAction(req, "create", "horarios", result.lastID, { barbero_id, day_of_week });
  const row = await get("SELECT * FROM horarios WHERE id = ?", [result.lastID]);
  res.json(row);
});

app.put("/api/horarios/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { start_time, end_time, is_day_off } = req.body || {};
  await run(
    "UPDATE horarios SET start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time), is_day_off = COALESCE(?, is_day_off) WHERE id = ?",
    [start_time, end_time, is_day_off, id]
  );
  await logAction(req, "update", "horarios", id, { start_time, end_time, is_day_off });
  const row = await get("SELECT * FROM horarios WHERE id = ?", [id]);
  res.json(row);
});

app.delete("/api/horarios/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  await run("DELETE FROM horarios WHERE id = ?", [id]);
  await logAction(req, "delete", "horarios", id, null);
  res.json({ ok: true });
});

app.post("/api/horarios/copy", requireAuth, async (req, res) => {
  const { from_barbero_id, to_barbero_id } = req.body || {};
  if (!from_barbero_id || !to_barbero_id) return res.status(400).json({ error: "Datos incompletos" });
  await run("DELETE FROM horarios WHERE barbero_id = ?", [to_barbero_id]);
  const rows = await all("SELECT day_of_week, start_time, end_time, is_day_off FROM horarios WHERE barbero_id = ?", [from_barbero_id]);
  for (const row of rows) {
    await run(
      "INSERT INTO horarios (barbero_id, day_of_week, start_time, end_time, is_day_off) VALUES (?, ?, ?, ?, ?)",
      [to_barbero_id, row.day_of_week, row.start_time, row.end_time, row.is_day_off]
    );
  }
  await logAction(req, "copy", "horarios", to_barbero_id, { from_barbero_id });
  res.json({ ok: true });
});

app.get("/api/bloqueos", requireAuth, async (req, res) => {
  const { barbero_id, fecha } = req.query;
  if (!barbero_id || !fecha) return res.status(400).json({ error: "Datos incompletos" });
  const rows = await all(
    "SELECT * FROM bloqueos WHERE barbero_id = ? AND fecha = ? ORDER BY hora ASC, hora_fin ASC",
    [barbero_id, fecha]
  );
  res.json(rows);
});

app.post("/api/bloqueos", requireAuth, async (req, res) => {
  const { barbero_id, fecha, hora, hora_fin, motivo } = req.body || {};
  if (!barbero_id || !fecha || !hora) return res.status(400).json({ error: "Datos incompletos" });
  if (hora_fin && timeToMinutes(hora_fin) <= timeToMinutes(hora)) {
    return res.status(400).json({ error: "La hora final debe ser mayor que la hora inicial" });
  }
  try {
    const result = await run(
      "INSERT INTO bloqueos (barbero_id, fecha, hora, hora_fin, motivo) VALUES (?, ?, ?, ?, ?)",
      [barbero_id, fecha, hora, hora_fin || null, motivo || ""]
    );
    await logAction(req, "create", "bloqueos", result.lastID, { barbero_id, fecha, hora, hora_fin });
    const row = await get("SELECT * FROM bloqueos WHERE id = ?", [result.lastID]);
    res.json(row);
  } catch (err) {
    res.status(409).json({ error: "Bloqueo ya existe" });
  }
});

app.post("/api/bloqueos/delete-bulk", requireAuth, async (req, res) => {
  const { id, scope } = req.body || {};
  const validScopes = new Set(["single", "week", "workweek", "all_days", "all_weeks"]);

  if (!id || !validScopes.has(scope)) {
    return res.status(400).json({ error: "Solicitud de borrado invalida" });
  }

  const block = await get("SELECT * FROM bloqueos WHERE id = ?", [id]);
  if (!block) {
    return res.status(404).json({ error: "Bloqueo no encontrado" });
  }

  const baseConditions = [
    "barbero_id = ?",
    "hora = ?",
    "COALESCE(hora_fin, '') = ?",
    "COALESCE(motivo, '') = ?"
  ];
  const baseParams = [block.barbero_id, block.hora, block.hora_fin || "", block.motivo || ""];

  let conditions = [];
  let params = [];
  let message = "";

  if (scope === "single") {
    conditions = ["id = ?"];
    params = [id];
    message = "Se elimino el bloqueo seleccionado.";
  } else if (scope === "week") {
    const weekRange = getWeekRange(block.fecha);
    conditions = [...baseConditions, "fecha BETWEEN ? AND ?"];
    params = [...baseParams, weekRange.start, weekRange.end];
    message = "Se eliminaron los bloqueos coincidentes de esta semana.";
  } else if (scope === "workweek") {
    const dayOfWeek = getDayOfWeek(block.fecha);
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ error: "Este bloqueo no pertenece a lunes a viernes." });
    }
    conditions = [...baseConditions, "fecha >= ?", "CAST(strftime('%w', fecha) AS INTEGER) BETWEEN 1 AND 5"];
    params = [...baseParams, block.fecha];
    message = "Se eliminaron los bloqueos coincidentes de lunes a viernes.";
  } else if (scope === "all_days") {
    conditions = [...baseConditions, "fecha >= ?"];
    params = [...baseParams, block.fecha];
    message = "Se eliminaron los bloqueos coincidentes de todos los dias.";
  } else if (scope === "all_weeks") {
    conditions = [...baseConditions, "fecha >= ?", "CAST(strftime('%w', fecha) AS INTEGER) = ?"];
    params = [...baseParams, block.fecha, getDayOfWeek(block.fecha)];
    message = "Se eliminaron los bloqueos coincidentes de todas las semanas.";
  }

  const result = await run(`DELETE FROM bloqueos WHERE ${conditions.join(" AND ")}`, params);
  await logAction(req, "delete", "bloqueos", id, { scope, deleted: result.changes || 0 });
  res.json({ ok: true, deleted: result.changes || 0, scope, message });
});

app.delete("/api/bloqueos/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  await run("DELETE FROM bloqueos WHERE id = ?", [id]);
  await logAction(req, "delete", "bloqueos", id, null);
  res.json({ ok: true });
});

app.get("/api/citas", requireAuth, async (req, res) => {
  const { from, to, barbero_id } = req.query;
  let query = `
      SELECT citas.*, barberos.nombre as barbero_nombre, servicios.nombre as servicio_nombre
      FROM citas
      JOIN barberos ON barberos.id = citas.barbero_id
      JOIN servicios ON servicios.id = citas.servicio_id
  `;
  const params = [];
  const conditions = [];
  if (from) {
    conditions.push("fecha >= ?");
    params.push(from);
  }
  if (to) {
    conditions.push("fecha <= ?");
    params.push(to);
  }
  if (barbero_id) {
    conditions.push("barbero_id = ?");
    params.push(barbero_id);
  }
  if (conditions.length) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " ORDER BY fecha DESC, hora DESC";
  const rows = await all(query, params);
  res.json(rows);
});

app.get("/api/citas/upcoming", requireAuth, async (req, res) => {
  const limit = Number(req.query.limit || 10);
  const rows = await all(
    `
      SELECT citas.*, barberos.nombre as barbero_nombre, servicios.nombre as servicio_nombre
      FROM citas
      JOIN barberos ON barberos.id = citas.barbero_id
      JOIN servicios ON servicios.id = citas.servicio_id
      WHERE status != 'cancelada'
      ORDER BY fecha ASC, hora ASC
      LIMIT ?
    `,
    [limit]
  );
  res.json(rows);
});

app.post("/api/citas", async (req, res) => {
  const { barbero_id, servicio_id, cliente_nombre, cliente_contacto, fecha, hora, notas } = req.body || {};
  if (!barbero_id || !servicio_id || !cliente_nombre || !fecha || !hora) {
    return res.status(400).json({ error: "Datos incompletos" });
  }
  const canPerform = await barberHasService(barbero_id, servicio_id);
  if (!canPerform) {
    return res.status(400).json({ error: "Ese servicio no está asignado al barbero seleccionado" });
  }
  const available = await buildAvailability({ barbero_id, fecha, servicio_id });
  if (!available.includes(hora)) {
    return res.status(409).json({ error: "Hora no disponible" });
  }
  try {
    await run(
      "INSERT INTO citas (barbero_id, servicio_id, cliente_nombre, cliente_contacto, fecha, hora, notas, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')",
      [barbero_id, servicio_id, cliente_nombre, cliente_contacto || "", fecha, hora, notas || ""]
    );
    res.json({ ok: true });
  } catch (err) {
    if (String(err).includes("UNIQUE")) {
      return res.status(409).json({ error: "Hora no disponible" });
    }
    res.status(500).json({ error: "Error al guardar cita" });
  }
});

app.put("/api/citas/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { barbero_id, servicio_id, fecha, hora, status, admin_notas } = req.body || {};

  if (barbero_id || servicio_id || fecha || hora) {
    const current = await get("SELECT * FROM citas WHERE id = ?", [id]);
    if (!current) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    const nextBarberoId = barbero_id ?? current.barbero_id;
    const nextServicioId = servicio_id ?? current.servicio_id;
    const nextFecha = fecha ?? current.fecha;
    const nextHora = hora ?? current.hora;
    const canPerform = await barberHasService(nextBarberoId, nextServicioId);
    if (!canPerform) {
      return res.status(400).json({ error: "Ese servicio no está asignado al barbero seleccionado" });
    }

    const available = await buildAvailability({
      barbero_id: nextBarberoId,
      fecha: nextFecha,
      servicio_id: nextServicioId
    });
    const sameSlot =
      String(nextBarberoId) === String(current.barbero_id) &&
      nextFecha === current.fecha &&
      nextHora === current.hora;
    if (!sameSlot && !available.includes(nextHora)) {
      return res.status(409).json({ error: "Hora no disponible" });
    }
  }

  await run(
    "UPDATE citas SET barbero_id = COALESCE(?, barbero_id), servicio_id = COALESCE(?, servicio_id), fecha = COALESCE(?, fecha), hora = COALESCE(?, hora), status = COALESCE(?, status), admin_notas = COALESCE(?, admin_notas), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [barbero_id, servicio_id, fecha, hora, status, admin_notas, id]
  );
  await logAction(req, "update", "citas", id, { status, fecha, hora });
  const row = await get("SELECT * FROM citas WHERE id = ?", [id]);
  res.json(row);
});

app.get("/api/citas/export", requireAuth, async (req, res) => {
  const { scope = "monthly", month, year } = req.query;
  const monthNames = {
    "01": "Enero",
    "02": "Febrero",
    "03": "Marzo",
    "04": "Abril",
    "05": "Mayo",
    "06": "Junio",
    "07": "Julio",
    "08": "Agosto",
    "09": "Septiembre",
    "10": "Octubre",
    "11": "Noviembre",
    "12": "Diciembre"
  };
  const conditions = [];
  const params = [];

  if (scope === "monthly") {
    if (!year || !month) {
      return res.status(400).json({ error: "Debes enviar ano y mes para exportar el reporte mensual." });
    }
    conditions.push("substr(citas.fecha, 1, 7) = ?");
    params.push(`${year}-${month}`);
  } else if (scope === "annual") {
    if (!year) {
      return res.status(400).json({ error: "Debes enviar el ano para exportar el reporte anual." });
    }
    conditions.push("substr(citas.fecha, 1, 4) = ?");
    params.push(String(year));
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await all(
    `
      SELECT
        citas.id,
        citas.fecha,
        citas.hora,
        citas.status,
        citas.cliente_nombre,
        citas.cliente_contacto,
        citas.notas,
        citas.admin_notas,
        citas.created_at,
        citas.updated_at,
        servicios.nombre as servicio,
        servicios.categoria as servicio_categoria,
        servicios.duracion_min as servicio_duracion,
        servicios.precio_min as servicio_precio,
        barberos.nombre as barbero
      FROM citas
      JOIN barberos ON barberos.id = citas.barbero_id
      JOIN servicios ON servicios.id = citas.servicio_id
      ${whereClause}
      ORDER BY citas.fecha DESC, citas.hora DESC
    `,
    params
  );

  const statusMap = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    cancelada: "Cancelada"
  };
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const getDayName = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(`${dateValue}T00:00:00`);
    return dayNames[date.getDay()] || "";
  };
  const formatDate = (dateValue) => {
    if (!dateValue) return "";
    const [yearValue, monthValue, dayValue] = String(dateValue).slice(0, 10).split("-");
    return yearValue && monthValue && dayValue ? `${dayValue}/${monthValue}/${yearValue}` : String(dateValue);
  };
  const formatDateTime = (dateValue) => {
    if (!dateValue) return "";
    const match = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (!match) return String(dateValue);
    const [, yearValue, monthValue, dayValue, hours, minutes] = match;
    return `${dayValue}/${monthValue}/${yearValue} ${hours}:${minutes}`;
  };
  const formatPrice = (value) => new Intl.NumberFormat("es-CO").format(Number(value || 0));
  const generatedAt = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date());
  const totalIngreso = rows.reduce((sum, row) => sum + Number(row.servicio_precio || 0), 0);
  const filenameDate = new Date().toISOString().slice(0, 10);
  const periodLabel =
    scope === "annual"
      ? `Anual ${year}`
      : `${monthNames[month] || "Mes"} ${year || ""}`.trim();
  const fileName =
    scope === "annual"
      ? `old-west-citas-anual-${year || filenameDate}.xls`
      : `old-west-citas-${year || filenameDate}-${month || "00"}.xls`;

  const statusClassMap = {
    Pendiente: "status status--pending",
    Confirmada: "status status--confirmed",
    Cancelada: "status status--cancelled"
  };

  const rowMarkup = rows.length
    ? rows
        .map((row) => {
          const statusLabel = statusMap[row.status] || row.status;
          return `
            <tr>
              <td class="cell-center">${escapeHtml(row.id)}</td>
              <td class="text-cell">${escapeHtml(getDayName(row.fecha))}</td>
              <td class="text-cell">${escapeHtml(formatDate(row.fecha))}</td>
              <td class="text-cell">${escapeHtml(row.hora)}</td>
              <td><span class="${statusClassMap[statusLabel] || "status"}">${escapeHtml(statusLabel)}</span></td>
              <td>${escapeHtml(row.cliente_nombre)}</td>
              <td class="text-cell">${escapeHtml(row.cliente_contacto)}</td>
              <td>${escapeHtml(row.barbero)}</td>
              <td>${escapeHtml(row.servicio)}</td>
              <td>${escapeHtml(row.servicio_categoria)}</td>
              <td class="cell-center">${escapeHtml(row.servicio_duracion)}</td>
              <td class="cell-price">COP ${escapeHtml(formatPrice(row.servicio_precio))}</td>
              <td>${escapeHtml(row.notas)}</td>
              <td>${escapeHtml(row.admin_notas)}</td>
              <td class="text-cell">${escapeHtml(formatDateTime(row.created_at))}</td>
              <td class="text-cell">${escapeHtml(formatDateTime(row.updated_at))}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="16" class="empty-row">Sin citas registradas para este periodo.</td>
      </tr>
    `;

  const workbook = `
    <html xmlns:o="urn:schemás-microsoft-com:office:office" xmlns:x="urn:schemás-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <meta name="ProgId" content="Excel.Sheet" />
        <meta name="Generator" content="Old West Barbería" />
        <style>
          body {
            font-family: Calibri, Arial, sans-serif;
            color: #1d120d;
            background: #f6efe5;
            margin: 18px;
          }
          .report-title {
            font-size: 24px;
            font-weight: 700;
            color: #2d160f;
            margin-bottom: 6px;
          }
          .report-subtitle {
            font-size: 12px;
            color: #7b5b46;
            margin-bottom: 18px;
          }
          .summary-table {
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 18px;
          }
          .summary-table td {
            padding: 10px 14px;
            border: 1px solid #d8c5ad;
          }
          .summary-label {
            background: #2c1811;
            color: #f8efe2;
            font-weight: 700;
            width: 180px;
          }
          .summary-value {
            background: #fffaf2;
            width: 220px;
          }
          table.sheet {
            border-collapse: collapse;
            table-layout: fixed;
            width: 100%;
            background: #fffaf4;
          }
          table.sheet th {
            background: #2c1811;
            color: #f9f1e3;
            border: 1px solid #b08a63;
            padding: 10px 8px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          table.sheet td {
            border: 1px solid #dbc7ad;
            padding: 9px 8px;
            vertical-align: top;
            background: #fffaf4;
            font-size: 11px;
            word-wrap: break-word;
          }
          table.sheet tr:nth-child(even) td {
            background: #f7efe4;
          }
          .cell-center {
            text-align: center;
          }
          .cell-price {
            background: #f3ead7;
            color: #5f3b20;
            font-weight: 700;
          }
          .text-cell {
            mso-number-format: "\\@";
            white-space: nowrap;
          }
          .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 700;
            border: 1px solid #ccb596;
            background: #efe3d0;
            color: #5b4332;
          }
          .status--pending {
            background: #f7ecd7;
            color: #7a561f;
            border-color: #dfc38a;
          }
          .status--confirmed {
            background: #ddeee2;
            color: #25533b;
            border-color: #9bc2a7;
          }
          .status--cancelled {
            background: #f2dede;
            color: #7b2f2f;
            border-color: #d9a4a4;
          }
          .empty-row {
            text-align: center;
            font-weight: 700;
            color: #7b5b46;
            background: #f5ebdf;
            padding: 18px;
          }
        </style>
      </head>
      <body>
        <div class="report-title">Old West Barbería · Reporte de citas</div>
        <div class="report-subtitle">Base exportada para Excel con formato premium</div>

        <table class="summary-table">
          <tr><td class="summary-label">Reporte</td><td class="summary-value">Old West Barbería</td></tr>
          <tr><td class="summary-label">Periodo</td><td class="summary-value">${escapeHtml(periodLabel)}</td></tr>
          <tr><td class="summary-label">Generado</td><td class="summary-value">${escapeHtml(generatedAt)}</td></tr>
          <tr><td class="summary-label">Total de citas</td><td class="summary-value">${escapeHtml(rows.length)}</td></tr>
          <tr><td class="summary-label">Ingreso potencial</td><td class="summary-value">COP ${escapeHtml(formatPrice(totalIngreso))}</td></tr>
        </table>

        <table class="sheet">
          <colgroup>
            <col style="width:55px" />
            <col style="width:95px" />
            <col style="width:110px" />
            <col style="width:75px" />
            <col style="width:110px" />
            <col style="width:190px" />
            <col style="width:140px" />
            <col style="width:150px" />
            <col style="width:180px" />
            <col style="width:120px" />
            <col style="width:100px" />
            <col style="width:120px" />
            <col style="width:220px" />
            <col style="width:220px" />
            <col style="width:150px" />
            <col style="width:150px" />
          </colgroup>
          <thead>
            <tr>
              <th>ID</th>
              <th>Día</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estado</th>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Barbero</th>
              <th>Servicio</th>
              <th>Categoría</th>
              <th>Duración</th>
              <th>Precio</th>
              <th>Notas cliente</th>
              <th>Notas internas</th>
              <th>Creada</th>
              <th>Actualizada</th>
            </tr>
          </thead>
          <tbody>
            ${rowMarkup}
          </tbody>
        </table>
      </body>
    </html>
  `;

  res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(`\ufeff${workbook}`);
});

app.get("/api/citas/export/options", requireAuth, async (req, res) => {
  const rows = await all(
    `
      SELECT DISTINCT substr(fecha, 1, 4) as year
      FROM citas
      WHERE fecha IS NOT NULL AND fecha != ''
      ORDER BY year DESC
    `
  );
  const currentYear = String(new Date().getFullYear());
  const years = [...new Set([currentYear, ...rows.map((row) => String(row.year)).filter(Boolean)])].sort(
    (a, b) => Number(b) - Number(a)
  );
  res.json({ years });
});

app.get("/api/clientes/history", requireAuth, async (req, res) => {
  const { contacto } = req.query;
  if (!contacto) return res.status(400).json({ error: "contacto requerido" });
  const rows = await all(
    `
      SELECT citas.*, servicios.nombre as servicio_nombre
      FROM citas
      JOIN servicios ON servicios.id = citas.servicio_id
      WHERE cliente_contacto = ?
      ORDER BY fecha DESC, hora DESC
    `,
    [contacto]
  );
  res.json(rows);
});


app.get("/api/galeria", async (req, res) => {
  const rows = await all("SELECT * FROM galeria ORDER BY id DESC");
  res.json(rows);
});

app.post("/api/galeria", requireAuth, async (req, res) => {
  const { titulo, descripcion, imagen_data } = req.body || {};
  if (!titulo || !imagen_data) return res.status(400).json({ error: "Datos incompletos" });
  const result = await run(
    "INSERT INTO galeria (titulo, descripcion, imagen_data) VALUES (?, ?, ?)",
    [titulo, descripcion || "", imagen_data]
  );
  const row = await get("SELECT * FROM galeria WHERE id = ?", [result.lastID]);
  res.json(row);
});

app.put("/api/galeria/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, imagen_data } = req.body || {};
  if (!titulo || !descripcion) return res.status(400).json({ error: "Datos incompletos" });
  await run(
    "UPDATE galeria SET titulo = COALESCE(?, titulo), descripcion = COALESCE(?, descripcion), imagen_data = COALESCE(?, imagen_data) WHERE id = ?",
    [titulo, descripcion, imagen_data, id]
  );
  const row = await get("SELECT * FROM galeria WHERE id = ?", [id]);
  res.json(row);
});

app.delete("/api/galeria/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  await run("DELETE FROM galeria WHERE id = ?", [id]);
  res.json({ ok: true });
});

app.get("/api/resenas", async (req, res) => {
  const rows = await all("SELECT * FROM resenas ORDER BY id DESC");
  res.json(rows);
});

app.post("/api/resenas", requireAuth, async (req, res) => {
  const { nombre, calificacion, mensaje, fuente } = req.body || {};
  if (!nombre || !calificacion || !mensaje) return res.status(400).json({ error: "Datos incompletos" });
  const result = await run(
    "INSERT INTO resenas (nombre, calificacion, mensaje, fuente) VALUES (?, ?, ?, ?)",
    [nombre, calificacion, mensaje, fuente || "Google Maps"]
  );
  const row = await get("SELECT * FROM resenas WHERE id = ?", [result.lastID]);
  res.json(row);
});

app.delete("/api/resenas/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  await run("DELETE FROM resenas WHERE id = ?", [id]);
  res.json({ ok: true });
});

app.get("/api/experiencia", async (req, res) => {
  const rows = await all("SELECT * FROM experiencia ORDER BY id ASC");
  res.json(rows);
});

app.put("/api/experiencia", requireAuth, async (req, res) => {
  const { seccion, titulo, descripcion } = req.body || {};
  if (!seccion || !titulo || !descripcion) return res.status(400).json({ error: "Datos incompletos" });
  await run(
    "INSERT INTO experiencia (seccion, titulo, descripcion) VALUES (?, ?, ?) ON CONFLICT(seccion) DO UPDATE SET titulo = excluded.titulo, descripcion = excluded.descripcion, updated_at = CURRENT_TIMESTAMP",
    [seccion, titulo, descripcion]
  );
  const row = await get("SELECT * FROM experiencia WHERE seccion = ?", [seccion]);
  res.json(row);
});

app.get("/api/metrics", requireAuth, async (req, res) => {
  const totalCitas = await get("SELECT COUNT(*) as total FROM citas");
  const pendientes = await get("SELECT COUNT(*) as total FROM citas WHERE status = 'pendiente'");
  const confirmadas = await get("SELECT COUNT(*) as total FROM citas WHERE status = 'confirmada'");
  const canceladas = await get("SELECT COUNT(*) as total FROM citas WHERE status = 'cancelada'");
  res.json({
    total: totalCitas.total,
    pendientes: pendientes.total,
    confirmadas: confirmadas.total,
    canceladas: canceladas.total
  });
});

app.get("/api/audit", requireAuth, requireRole("admin"), async (req, res) => {
  const limit = Number(req.query.limit || 50);
  const rows = await all(
    `
      SELECT audit_log.*, usuarios.username
      FROM audit_log
      LEFT JOIN usuarios ON usuarios.id = audit_log.user_id
      ORDER BY audit_log.id DESC
      LIMIT ?
    `,
    [limit]
  );
  res.json(rows);
});

const timeToMinutes = (value) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const getDayOfWeek = (dateValue) => new Date(`${dateValue}T12:00:00`).getDay();

const getWeekRange = (dateValue) => {
  const date = new Date(`${dateValue}T12:00:00`);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
};

const blockOverlapsSlot = (block, slotStart, slotDuration) => {
  if (!block?.hora) return false;
  const blockStart = timeToMinutes(block.hora);
  if (!block.hora_fin) {
    return slotStart === blockStart;
  }
  const blockEnd = timeToMinutes(block.hora_fin);
  const slotEnd = slotStart + slotDuration;
  return slotStart < blockEnd && slotEnd > blockStart;
};

const buildAvailability = async ({ barbero_id, fecha, servicio_id }) => {
  const dateObj = new Date(`${fecha}T00:00:00`);
  const dayOfWeek = dateObj.getDay();
  const horario = await get(
    "SELECT * FROM horarios WHERE barbero_id = ? AND day_of_week = ?",
    [barbero_id, dayOfWeek]
  );

  if (!horario || horario.is_day_off) {
    return [];
  }

  if (servicio_id) {
    const allowed = await barberHasService(barbero_id, servicio_id);
    if (!allowed) {
      return [];
    }
  }

  const service = servicio_id ? await get("SELECT duracion_min FROM servicios WHERE id = ?", [servicio_id]) : null;
  const step = service?.duracion_min || 30;

  const start = timeToMinutes(horario.start_time);
  const end = timeToMinutes(horario.end_time);

  const booked = await all(
    "SELECT hora FROM citas WHERE barbero_id = ? AND fecha = ? AND status != 'cancelada'",
    [barbero_id, fecha]
  );
  const blocked = await all("SELECT hora, hora_fin FROM bloqueos WHERE barbero_id = ? AND fecha = ?", [barbero_id, fecha]);
  const bookedSet = new Set(booked.map((row) => row.hora));

  const slots = [];
  for (let t = start; t + step <= end; t += step) {
    const time = minutesToTime(t);
    const blockedByRange = blocked.some((block) => blockOverlapsSlot(block, t, step));
    if (!bookedSet.has(time) && !blockedByRange) {
      slots.push(time);
    }
  }

  return slots;
};

app.get("/api/availability", async (req, res) => {
  const { barbero_id, fecha, servicio_id } = req.query;
  if (!barbero_id || !fecha) {
    return res.status(400).json({ error: "barbero_id y fecha requeridos" });
  }
  const slots = await buildAvailability({ barbero_id, fecha, servicio_id });
  res.json(slots);
});

app.get("/api/availability-range", async (req, res) => {
  const { barbero_id, start, days, servicio_id } = req.query;
  if (!barbero_id || !start) {
    return res.status(400).json({ error: "barbero_id y start requeridos" });
  }
  const totalDays = Number(days || 7);
  const results = {};
  for (let i = 0; i < totalDays; i += 1) {
    const date = new Date(`${start}T00:00:00`);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    const slots = await buildAvailability({ barbero_id, fecha: key, servicio_id });
    results[key] = slots;
  }
  res.json(results);
});

app.post("/api/backup", requireAuth, requireRole("admin"), async (req, res) => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.db`);
  fs.copyFileSync(DB_PATH, backupPath);
  await logAction(req, "backup", "db", null, { backupPath });
  res.json({ ok: true, backupPath });
});

const scheduleBackup = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.db`);
  fs.copyFileSync(DB_PATH, backupPath);
};

setInterval(scheduleBackup, 1000 * 60 * 60 * 24);

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor listo en http://localhost:${PORT}`);
  });
});
