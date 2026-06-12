let idPartie = "";
let role = "";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-creer").addEventListener("click", creerPartie);
    document.getElementById("btn-rejoindre").addEventListener("click", rejoindrePartie);
});

async function creerPartie() {
    
    const pseudo = document.getElementById("pseudo").value || "Joueur Sud";
    
    const idAuto = "SONGO-" + Date.now().toString().slice(-5);
    
    try {
        
        const res = await fetch('/api/songo/connexion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                idPartie: idAuto, 
                pseudo: pseudo, 
                role: "SUD" 
            })
        });
        
        const data = await res.json();

        if (data.success) {
            
            idPartie = idAuto;
            role = "SUD";
            monTour = true; // Le créateur commence au Songo

            document.getElementById("accueil").style.display = "none";
            document.getElementById("jeu").style.display = "flex"; // Ton CSS utilise flex pour #jeu
            
            document.getElementById("inf-id").innerHTML = `<strong>${idPartie}</strong>`;
            document.getElementById("msg").textContent = "Partie créée. En attente du Joueur Nord (Adversaire)...";

            genererGrille();
            intervalleSynchronisation = setInterval(recupererEtatDuServeur, 2000);
        } else {
            alert("Erreur lors de la création : " + data.message);
        }
    } catch (e) { 
        alert("Erreur de connexion avec le serveur Vercel"); 
    }
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