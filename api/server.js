const express = require('express');
const path = require('path');
const app = express();

// Utilise le port fourni par l'hébergeur en ligne, ou 3000 en local
//const PORT = process.env.PORT || 3000;

// Remplace app.use(express.static(path.join(__dirname, 'public'))); par :
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Stockage de la partie en mémoire sur le serveur
let etatJeu = {
  B: Array(14).fill(4),
  SC: { sud: 0, nord: 0 },
  J: "SUD",
  FI: false,
  pseudoSud: null,
  pseudoNord: null
};

app.get('/api/songo', (req, res) => {
  res.json(etatJeu);
});

app.post('/api/songo/connexion', (req, res) => {
  const { pseudo, role } = req.body;
  if (role === "SUD" && !etatJeu.pseudoSud) {
    etatJeu.pseudoSud = pseudo;
    return res.json({ success: true, role: "SUD" });
  } else if (role === "NORD" && !etatJeu.pseudoNord) {
    etatJeu.pseudoNord = pseudo;
    return res.json({ success: true, role: "NORD" });
  }
  res.status(400).json({ success: false, message: "Rôle déjà occupé." });
});

app.post('/api/songo/jouer', (req, res) => {
  etatJeu = req.body;
  res.json({ success: true });
});

app.post('/api/songo/reset', (req, res) => {
  etatJeu = { B: Array(14).fill(4), SC: { sud: 0, nord: 0 }, J: "SUD", FI: false, pseudoSud: null, pseudoNord: null };
  res.json({ success: true });
});

module.exports = app;