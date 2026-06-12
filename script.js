// ==========================================
// 1. VARIABLES GLOBALES & SENS TRIGONOMÉTRIQUE
// ==========================================
let idPartie = "";
let role = ""; // "SUD" ou "NORD"
let NJ = { sud: "Joueur SUD", nord: "En attente..." };
let etatJeu = {
  B: Array(14).fill(5), // 14 cases avec 5 billes initiales
  scores: { sud: 0, nord: 0 },
  tour: "SUD",
  joueurs: { sud: "En attente...", nord: "En attente..." }
};

// Sens trigonométrique traditionnel : 
// SUD (bas) progresse de gauche à droite (indices 7 à 13)
// NORD (haut) progresse de droite à gauche (indices 6 à 0)
const ROUTE = [7, 8, 9, 10, 11, 12, 13, 6, 5, 4, 3, 2, 1, 0];

const suiv = p => ROUTE[(ROUTE.indexOf(p) + 1) % 14];
const prec = p => ROUTE[(ROUTE.indexOf(p) - 1 + 14) % 14];

// ==========================================
// 2. INITIALISATION AU CHARGEMENT
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Liaison du bouton "Rejoindre" si l'ID est configuré dans le HTML
  const btnRejoindre = document.getElementById("btn-rejoindre");
  if (btnRejoindre) btnRejoindre.onclick = rejoindrePartie;

  // Générer immédiatement les conteneurs de la table de jeu en arrière-plan
  genererPlateauHTML();
});

function genererPlateauHTML() {
  const grille = document.getElementById("grille-songo");
  if (!grille) return;
  grille.innerHTML = ""; 

  // Ligne du NORD (Indices 0 à 6)
  const rangeeNord = document.createElement("div");
  rangeeNord.className = "rangee nord";
  for (let i = 0; i <= 6; i++) {
    rangeeNord.appendChild(creerCaseHTML(i));
  }

  // Ligne du SUD (Indices 7 à 13)
  const rangeeSud = document.createElement("div");
  rangeeSud.className = "rangee sud";
  for (let i = 7; i <= 13; i++) {
    rangeeSud.appendChild(creerCaseHTML(i));
  }

  grille.appendChild(rangeeNord);
  grille.appendChild(rangeeSud);
}

function creerCaseHTML(index) {
  const c = document.createElement("div");
  c.className = "case";
  c.id = "case-" + index;
  c.onclick = () => jouerCoup(index);

  const label = document.createElement("span");
  label.className = "label-case";
  label.textContent = (index < 7 ? "N" : "S") + (index < 7 ? index + 1 : index - 6);
  
  const conteneurBilles = document.createElement("div");
  conteneurBilles.className = "billes-container";
  conteneurBilles.id = "billes-" + index;

  c.appendChild(label);
  c.appendChild(conteneurBilles);
  return c;
}

// ==========================================
// 3. FONCTIONS DE SESSIONS (CREER / REJOINDRE)
// ==========================================

// Cette fonction est directement appelée par le bouton "Créer une nouvelle partie" (onclick="dem()")
async function dem() {
  // Récupération via l'ID exact "ns" présent sur ton écran
  const pseudoInput = document.getElementById("ns") ? document.getElementById("ns").value.trim() : "";
  NJ.sud = pseudoInput || "Joueur SUD";
  role = "SUD";

  // Auto-incrémentation automatique de l'ID via un identifiant temporel court
  const idAuto = "SONGO-" + Date.now().toString().slice(-5);

  try {
    let res = await fetch('/api/songo/creer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idPartie: idAuto, pseudo: NJ.sud })
    });
    
    if (res.ok) {
      let data = await res.json();
      idPartie = data.idPartie;
      
      // Permuter les écrans d'affichage
      afficherEcranJeu();
      
      // Lancer la synchronisation temps réel
      setInterval(fetchEtat, 1000); 
    } else {
      alert("Erreur retournée par le serveur.");
    }
  } catch (err) {
    console.error("Erreur de communication avec l'API:", err);
    alert("Le serveur Node.js ne répond pas.");
  }
}

async function rejoindrePartie() {
  const pseudoInput = document.getElementById("ns") ? document.getElementById("ns").value.trim() : "";
  const idInput = document.getElementById("id-partie-input") ? document.getElementById("id-partie-input").value.trim() : "";
  
  if (!idInput) {
    alert("Veuillez entrer un ID de partie valide");
    return;
  }

  NJ.nord = pseudoInput || "Joueur NORD";
  role = "NORD";
  idPartie = idInput.toUpperCase();

  try {
    let res = await fetch('/api/songo/rejoindre', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idPartie: idPartie, pseudo: NJ.nord })
    });

    if (res.ok) {
      afficherEcranJeu();
      setInterval(fetchEtat, 1000);
    } else {
      alert("Impossible de rejoindre. Vérifiez l'ID de la partie.");
    }
  } catch (err) {
    console.error("Erreur de connexion:", err);
  }
}

function afficherEcranJeu() {
  // Masquer l'accueil, afficher la table complète de Songo
  if (document.getElementById("accueil")) document.getElementById("accueil").style.display = "none";
  if (document.getElementById("jeu")) document.getElementById("jeu").style.display = "block";
  
  // Remplissage des blocs d'information de l'entête
  const infoPartie = document.getElementById("info-partie");
  if (infoPartie) infoPartie.textContent = idPartie;
  
  const monRole = document.getElementById("mon-role");
  if (monRole) monRole.textContent = role;

  redessinerPlateau();
}

// ==========================================
// 4. SYNCHRONISATION & LOGIQUE DE JEU
// ==========================================
async function fetchEtat() {
  if (!idPartie) return;
  try {
    let res = await fetch(`/api/songo/etat?idPartie=${idPartie}`);
    if (res.ok) {
      etatJeu = await res.json();
      redessinerPlateau();
    }
  } catch (err) {
    console.warn("Actualisation de l'état en attente...");
  }
}

function redessinerPlateau() {
  // Dessiner dynamiquement les billes dans chaque trou de la table
  for (let i = 0; i < 14; i++) {
    const conteneur = document.getElementById("billes-" + i);
    if (!conteneur) continue;
    
    const nbrBillesActuel = etatJeu.B[i];
    conteneur.innerHTML = "";
    
    for (let b = 0; b < nbrBillesActuel; b++) {
      const billeHTML = document.createElement("div");
      billeHTML.className = "bille";
      conteneur.appendChild(billeHTML);
    }
  }

  // Mise à jour des scores et des textes de suivi du tour
  if (document.getElementById("score-sud")) document.getElementById("score-sud").textContent = etatJeu.scores.sud;
  if (document.getElementById("score-nord")) document.getElementById("score-nord").textContent = etatJeu.scores.nord;
  if (document.getElementById("statut-tour")) document.getElementById("statut-tour").textContent = etatJeu.tour;

  const msgZone = document.getElementById("message-statut");
  if (msgZone) {
    if (etatJeu.joueurs.nord === "En attente...") {
      msgZone.textContent = "En attente du deuxième joueur... ID à partager : " + idPartie;
    } else {
      msgZone.textContent = `Match : ${etatJeu.joueurs.sud} (SUD) VS ${etatJeu.joueurs.nord} (NORD) | Tour : ${etatJeu.tour}`;
    }
  }
}

async function jouerCoup(indexCase) {
  if (etatJeu.tour !== role) return;
  if (role === "SUD" && (indexCase < 7 || indexCase > 13)) return;
  if (role === "NORD" && (indexCase < 0 || indexCase > 6)) return;
  if (etatJeu.B[indexCase] === 0) return;

  try {
    let res = await fetch('/api/songo/jouer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idPartie: idPartie, role: role, index: indexCase })
    });
    if (res.ok) {
      etatJeu = await res.json();
      redessinerPlateau();
    }
  } catch (err) {
    console.error("Erreur lors de l'exécution du coup:", err);
  }
}