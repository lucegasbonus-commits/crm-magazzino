const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();

app.use(express.json());
app.use(express.static("public"));

// DATABASE
const db = new sqlite3.Database("crm.db");

// TABELLE
db.run(`
  CREATE TABLE IF NOT EXISTS clienti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    telefono TEXT,
    email TEXT
  )
`);
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS articoli (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      codice TEXT,
      quantita INTEGER,
      scorta_minima INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS vendite (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      articolo_id INTEGER,
      quantita INTEGER,
      data TEXT
    )
  `);
});

// LISTA ARTICOLI
app.get("/articoli", (req, res) => {
  db.all(`
    SELECT *,
    CASE 
      WHEN quantita <= scorta_minima THEN 'SOTTO SCORTA'
      ELSE 'OK'
    END AS stato
    FROM articoli
  `, (err, rows) => {
    res.json(rows);
  });
});

// CREA ARTICOLO
app.post("/articoli", (req, res) => {
  const { nome, codice, quantita, scorta_minima } = req.body;
  db.run(
    `INSERT INTO articoli (nome, codice, quantita, scorta_minima)
     VALUES (?, ?, ?, ?)`,
    [nome, codice, quantita, scorta_minima],
    () => res.json({ ok: true })
  );
});

// VENDITA
app.post("/vendita", (req, res) => {
  const { articolo_id, quantita } = req.body;

  db.run(
    `INSERT INTO vendite (articolo_id, quantita, data)
     VALUES (?, ?, datetime('now'))`,
    [articolo_id, quantita]
  );

  db.run(
    `UPDATE articoli
     SET quantita = quantita - ?
     WHERE id = ?`,
    [quantita, articolo_id],
    () => res.json({ ok: true })
  );
});
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
  res.send("CRM attivo");
});
// LISTA CLIENTI
app.get("/clienti", (req, res) => {
  db.all("SELECT * FROM clienti", (err, rows) => {
    res.json(rows);
  });
});

// CREA CLIENTE
app.post("/clienti", (req, res) => {
  const { nome, telefono, email } = req.body;
  db.run(
    "INSERT INTO clienti (nome, telefono, email) VALUES (?, ?, ?)",
    [nome, telefono, email],
    () => res.json({ ok: true })
  );
});
// IMPORT CLIENTI DA CSV
app.post("/clienti/import", upload.single("file"), (req, res) => {
  const file = fs.readFileSync(req.file.path, "utf8");
  const righe = file.split("\n");

  righe.slice(1).forEach(riga => {
    const [nome, telefono, email] = riga.split(",");
    if (nome) {
      db.run(
        "INSERT INTO clienti (nome, telefono, email) VALUES (?, ?, ?)",
        [nome.trim(), telefono?.trim(), email?.trim()]
      );
    }
  });

  fs.unlinkSync(req.file.path);
  res.redirect("/clienti.html");
});

app.listen(PORT, () => {
  console.log("CRM attivo sulla porta " + PORT);
});
