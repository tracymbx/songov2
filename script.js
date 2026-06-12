let idPartie = "";
let role = "";
let etatJeu = { B: Array(14).fill(5), scores: { sud: 0, nord: 0 }, tour: "SUD", joueurs: { sud: "...", nord: "..." } };

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-creer").onclick = creerPartie;
  document.getElementById("btn-rejoindre").onclick = rejoindrePartie;
});

async function creerPartie() {
  const pseudo = document.getElementById("pseudo").value.trim() || "Joueur";
  const idAuto = "SONGO-" + Date.now().toString().slice(-5);

  try {
    let res = await fetch('/api/songo/creer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idPartie: idAuto, pseudo: pseudo })
    });
    if (res.ok) {
      idPartie = idAuto;
      role = "SUD";
      document.getElementById("accueil").style.display = "none";
      document.getElementById("jeu").style.display = "block";
      document.getElementById("inf-id").textContent = idPartie;
      document.getElementById("inf-role").textContent = role;
      setInterval(fetchEtat, 1000);
    }
  } catch (err) { alert("Erreur serveur"); }
}

async function fetchEtat() {
  if (!idPartie) return;
  let res = await fetch(`/api/songo/etat?idPartie=${idPartie}`);
  if (res.ok) {
    etatJeu = await res.json();
    redessinerPlateau();
  }
}

function redessinerPlateau() {
  // Logique de rendu des billes dans les cases
  for (let i = 0; i < 14; i++) {
    const conteneur = document.getElementById("billes-" + i); // Assure-toi que tes cases ont ces ID
    if(conteneur) conteneur.innerHTML = etatJeu.B[i]; 
  }
}