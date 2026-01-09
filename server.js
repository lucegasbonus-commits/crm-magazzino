const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

// HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// CLIENTI
app.get("/clienti", (req, res) => {
  res.sendFile(path.join(__dirname, "clienti.html"));
});

// IMPORT CSV CLIENTI
app.post("/import-clienti", upload.single("file"), (req, res) => {
  res.send("File caricato correttamente");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("CRM avviato sulla porta " + PORT);
});
