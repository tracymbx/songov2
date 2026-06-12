let idPartie = "";
let role = "";

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
            idPartie = idAuto;
            role = "SUD";
            document.getElementById("accueil").style.display = "none";
            document.getElementById("jeu").style.display = "block";
            document.getElementById("inf-id").textContent = "ID: " + idPartie;
            genererGrille();
        }
    } catch (e) { alert("Erreur de connexion"); }
}

function genererGrille() {
    const grille = document.getElementById("grille");
    grille.innerHTML = "";
    for (let i = 0; i < 14; i++) {
        const caseDiv = document.createElement("div");
        caseDiv.className = "case";
        caseDiv.id = "case-" + i;
        caseDiv.textContent = "5"; // Bille initiale
        grille.appendChild(caseDiv);
    }
}

async function rejoindrePartie() {
    const idInput = document.getElementById("partie-id").value;
    if(!idInput) return alert("Entrez un ID");
    idPartie = idInput;
    role = "NORD";
    document.getElementById("accueil").style.display = "none";
    document.getElementById("jeu").style.display = "block";
    genererGrille();
}