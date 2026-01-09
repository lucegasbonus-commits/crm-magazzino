const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();

app.use(express.json());

// DATABASE
const db = new sqlite3.Database("crm.db");

// TABELLE
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

app.listen(3000, () => {
  console.log("CRM attivo su http://localhost:3000");
});
