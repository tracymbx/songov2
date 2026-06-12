// ==========================================
// 1. VARIABLES GLOBALES & SENS TRIGONOMÉTRIQUE
// ==========================================
let idPartie = "";
let role = ""; // "SUD" ou "NORD"
let monPseudo = "";
let etatJeu = {
  B: Array(14).fill(5), // 14 cases contenant 5 billes au départ
  scores: { sud: 0, nord: 0 },
  tour: "SUD",
  joueurs: { sud: "En attente...", nord: "En attente..." }
};

// Sens trigonométrique traditionnel :
// SUD (bas) progresse de gauche à droite (cases 7 à 13)
// NORD (haut) progresse de droite à gauche (cases 6 à 0)
const ROUTE = [7, 8, 9, 10, 11, 12, 13, 6, 5, 4, 3, 2, 1, 0];

const suiv = p => ROUTE[(ROUTE.indexOf(p) + 1) % 14];
const prec = p => ROUTE[(ROUTE.indexOf(p) - 1 + 14) % 14];

// ==========================================
// 2. ATTACHE DES ÉVÉNEMENTS AU CHARGEMENT
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Liaison avec les ID réels de ton fichier HTML
  document.getElementById("btn-creer").onclick = creerPartie;
  document.getElementById("btn-rejoindre").onclick = rejoindrePartie;
  document.getElementById("btn-quitter").onclick = () => location.reload();
});

// ==========================================
// 3. LOGIQUE DE SESSIONS (MUTLIJOUEUR)
// ==========================================
async function creerPartie() {
  const pseudoInput = document.getElementById("pseudo").value.trim();
  monPseudo = pseudoInput || "Joueur SUD";
  role = "SUD";

  // Auto-incrémentation automatique de l'ID basée sur l'heure
  const idAuto = "SONGO-" + Date.now().toString().slice(-5);

  try {
    let res = await fetch('/api/songo/creer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idPartie: idAuto, pseudo: monPseudo })
    });
    
    if (res.ok) {
      let data = await res.json();
      idPartie = data.idPartie;
      
      // On bascule l'affichage et on génère immédiatement la table
      afficherEcranJeu();
      // On lance la boucle de synchronisation toutes les secondes
      setInterval(fetchEtat, 1000); 
    } else {
      document.getElementById("msg-accueil").textContent = "Erreur lors de la création de la partie.";
    }
  } catch (err) {
    document.getElementById("msg-accueil").textContent = "Le serveur Node.js ne répond pas.";
  }
}

async function rejoindrePartie() {
  const pseudoInput = document.getElementById("pseudo").value.trim();
  const idInput = document.getElementById("partie-id").value.trim();
  
  if (!idInput) {
    alert("Veuillez coller l'ID de la partie à rejoindre.");
    return;
  }

  monPseudo = pseudoInput || "Joueur NORD";
  role = "NORD";
  idPartie = idInput.toUpperCase();

  try {
    let res = await fetch('/api/songo/rejoindre', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idPartie: idPartie, pseudo: monPseudo })
    });

    if (res.ok) {
      afficherEcranJeu();
      setInterval(fetchEtat, 1000);
    } else {
      document.getElementById("msg-accueil").textContent = "Impossible de rejoindre. Vérifiez l'ID.";
    }
  } catch (err) {
    document.getElementById("msg-accueil").textContent = "Erreur de connexion au serveur.";
  }
}

// ==========================================
// 4. CONSTRUCTION ET DESSIN DU PLATEAU HTML
// ==========================================
function afficherEcranJeu() {
  document.getElementById("accueil").style.display = "none";
  document.getElementById("jeu").style.display = "block";
  
  document.getElementById("inf-id").textContent = idPartie;
  document.getElementById("inf-role").textContent = role;

  // On injecte les cases dans les zones de ton HTML (rn pour Nord, rs pour Sud)
  genererCasesPlateau();
  redessinerPlateau();
}

function genererCasesPlateau() {
  const zoneNord = document.getElementById("rn");
  const zoneSud = document.getElementById("rs");
  
  if (!zoneNord || !zoneSud) return;
  zoneNord.innerHTML = "";
  zoneSud.innerHTML = "";

  // Génération de la rangée NORD (cases 0 à 6)
  for (let i = 0; i <= 6; i++) {
    zoneNord.appendChild(creerCaseHTML(i));
  }

  // Génération de la rangée SUD (cases 7 à 13)
  for (let i = 7; i <= 13; i++) {
    zoneSud.appendChild(creerCaseHTML(i));
  }
}

function creerCaseHTML(index) {
  const c = document.createElement("div");
  c.className = "case";
  c.id = "case-" + index;
  c.onclick = () => jouerCoup(index);

  // Un petit indicateur de texte pour déboguer le numéro de case si besoin
  c.setAttribute("data-index", index);

  // Conteneur interne où vont apparaître les billes
  const conteneurBilles = document.createElement("div");
  conteneurBilles.className = "billes-container";
  conteneurBilles.id = "billes-" + index;

  c.appendChild(conteneurBilles);
  return c;
}

function redessinerPlateau() {
  // Dessin ou rafraîchissement des ronds de billes
  for (let i = 0; i < 14; i++) {
    const conteneur = document.getElementById("billes-" + i);
    if (!conteneur) continue;
    
    const totalBilles = etatJeu.B[i];
    conteneur.innerHTML = ""; // Nettoyage de l'ancien rendu
    
    for (let b = 0; b < totalBilles; b++) {
      const bille = document.createElement("div");
      bille.className = "bille";
      conteneur.appendChild(bille);
    }
  }

  // Mise à jour des en-têtes et des scores réels
  document.getElementById("vsud").textContent = etatJeu.scores.sud;
  document.getElementById("vnord").textContent = etatJeu.scores.nord;
  document.getElementById("inf-j").textContent = etatJeu.tour;

  // Mise à jour des noms des joueurs
  document.getElementById("lsud").textContent = etatJeu.joueurs.sud + " (SUD)";
  document.getElementById("lnord").textContent = etatJeu.joueurs.nord + " (NORD)";

  // Message de statut
  const msgZone = document.getElementById("msg");
  if (etatJeu.joueurs.nord === "En attente...") {
    msgZone.textContent = "En attente du deuxième joueur... Partagez l'ID : " + idPartie;
  } else {
    msgZone.textContent = `Match lancé ! Tour de : ${etatJeu.tour}`;
  }
}

// ==========================================
// 5. SYNCHRONISATION DES COUPS
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
    console.log("Synchro en attente...");
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
    console.error("Erreur d'envoi du coup:", err);
  }
}