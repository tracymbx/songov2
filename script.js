document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-creer").addEventListener("click", creerPartie);
    document.getElementById("btn-rejoindre").addEventListener("click", rejoindrePartie);
});

async function creerPartie() {
    const pseudo = document.getElementById("pseudo").value || "Joueur";
    const idAuto = "SONGO-" + Date.now().toString().slice(-5);
    
    try {
        const res = await fetch('/api/songo/creer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idPartie: idAuto, pseudo: pseudo })
        });
        
        if (res.ok) {
            document.getElementById("accueil").style.display = "none";
            document.getElementById("jeu").style.display = "block";
            document.getElementById("inf-id").textContent = "ID Partie: " + idAuto;
            genererGrille();
        }
    } catch (e) { alert("Erreur serveur"); }
}

function genererGrille() {
    const grille = document.getElementById("grille");
    grille.innerHTML = "";
    // Création des 14 cases du plateau
    for (let i = 0; i < 14; i++) {
        const c = document.createElement("div");
        c.className = "case";
        c.textContent = "5"; // Distribution initiale
        grille.appendChild(c);
    }
}

async function rejoindrePartie() {
    const id = document.getElementById("partie-id").value;
    if (!id) return alert("Entrez un ID valide");
    
    document.getElementById("accueil").style.display = "none";
    document.getElementById("jeu").style.display = "block";
    document.getElementById("inf-id").textContent = "ID Partie: " + id;
    genererGrille();
}