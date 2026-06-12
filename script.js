var B = [], SC = {sud:0, nord:0}, J = "SUD", FI = false;
var MON_PSEUDO = "Joueur", MON_ROLE = null; 
var ROULAGE = null;

const ROUTE = [7, 8, 9, 10, 11, 12, 13, 6, 5, 4, 3, 2, 1, 0];
const suiv = p => ROUTE[(ROUTE.indexOf(p) + 1) % 14];
const prec = p => ROUTE[(ROUTE.indexOf(p) - 1 + 14) % 14];
const estAdv = (p, j) => j === "SUD" ? (p >= 0 && p <= 6) : (p >= 7 && p <= 13);
const cVide = j => B.slice(j === "NORD" ? 0 : 7, j === "NORD" ? 7 : 14).every(v => v === 0);

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-creer").onclick = () => seConnecter("SUD");
  document.getElementById("btn-rejoindre").onclick = () => seConnecter("NORD");
  document.getElementById("btn-quitter").onclick = quitterPartie;
});

// --- LES FONCTIONS AJAX CORRIGÉES POUR VERCEL ---

async function fetchEtat() {
  if (FI) return;
  try {
    let res = await fetch('/api/songo');
    let data = await res.json();
    if (data) syncJeu(data);
  } catch (e) { console.error("Erreur Ajax", e); }
}

async function pushEtat(nouvelEtat) {
  try {
    await fetch('/api/songo/jouer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nouvelEtat)
    });
  } catch (e) { console.error("Erreur Ajax", e); }
}

async function seConnecter(role) {
  MON_PSEUDO = document.getElementById("pseudo").value.trim() || ("Joueur " + role);
  MON_ROLE = role;
  try {
    let res = await fetch('/api/songo/connexion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pseudo: MON_PSEUDO, role: MON_ROLE })
    });
    let data = await res.json();
    if (data.success) {
      document.getElementById("accueil").style.display = "none";
      document.getElementById("jeu").style.display = "flex";
      document.getElementById("inf-id").textContent = "Serveur Node";
      document.getElementById("inf-role").textContent = MON_ROLE;
      ROULAGE = setInterval(fetchEtat, 1500); // Polling toutes les 1.5s
    }
  } catch (e) { alert("Le serveur Node.js ne répond pas."); }
}

async function quitterPartie() {
  clearInterval(ROULAGE);
  await fetch('/api/songo/reset', { method: 'POST' });
  document.getElementById("jeu").style.display = "none";
  document.getElementById("accueil").style.display = "flex";
}

// --- LOGIQUE MULTIJOUEUR ET RENDU DU PLATEAU ---

function syncJeu(data) {
  B = data.B; SC = data.SC; J = data.J; FI = data.FI;
  document.getElementById("lsud").textContent = data.pseudoSud ? data.pseudoSud + " (SUD)" : "En attente...";
  document.getElementById("lnord").textContent = data.pseudoNord ? data.pseudoNord + " (NORD)" : "En attente...";
  document.getElementById("inf-j").textContent = `${J === "SUD" ? data.pseudoSud : (data.pseudoNord || "NORD")} (${J})`;
  
  if (!data.pseudoSud || !data.pseudoNord) {
    setMsg("⏳ En attente de l'autre joueur...");
  } else {
    setMsg(J === MON_ROLE ? "🟢 À vous de jouer !" : "🚨 L'adversaire réfléchit...");
  }
  draw(); majSC();
  if (FI) { clearInterval(ROULAGE); setMsg("🏆 Partie Terminée !"); }
}

function jouer(idx){
  if(FI || J !== MON_ROLE) return;
  if((J === "SUD" && (idx < 7 || idx > 13)) || (J === "NORD" && (idx < 0 || idx > 6))) return;
  if(B[idx] === 0) return;
  if(((J === "SUD" && idx === 13) || (J === "NORD" && idx === 0)) && B[idx] <= 2) return setMsg("🚫 Interdit d'envahir à moins de 3 billes.");
  if(cVide(J === "SUD" ? "NORD" : "SUD") && !coupNourrit(idx)) return setMsg("🤝 Solidarité obligatoire !");
  if(caVideraitTout(idx)) return setMsg("🚫 Interdit d'affamer l'adversaire !");

  let n = B[idx]; B[idx] = 0; let p = idx;
  for(let i=0; i<n; i++) { p = suiv(p); if(p === idx) p = suiv(p); B[p]++; }
  while(estAdv(p, J) && B[p] >= 2 && B[p] <= 4) { SC[J.toLowerCase()] += B[p]; B[p] = 0; p = prec(p); }

  chkF(); J = J === "SUD" ? "NORD" : "SUD";
  let nomSud = document.getElementById("lsud").textContent.replace(" (SUD)", "");
  let nomNord = document.getElementById("lnord").textContent.replace(" (NORD)", "");
  draw(); majSC();
  pushEtat({ B, SC, J, FI, pseudoSud: nomSud, pseudoNord: nomNord });
}

function coupNourrit(idx) {
  let bc = B.slice(), p = idx; bc[p] = 0;
  for(let i=0; i<B[idx]; i++) { p = suiv(p); if(p === idx) p = suiv(p); bc[p]++; }
  return estAdv(p, J);
}

function caVideraitTout(idx){
  let bc = B.slice(), p = idx; bc[p] = 0;
  for(let i=0; i<B[idx]; i++) { p = suiv(p); if(p === idx) p = suiv(p); bc[p]++; }
  while(estAdv(p, J) && bc[p] >= 2 && bc[p] <= 4) { bc[p] = 0; p = prec(p); }
  return bc.slice(J === "SUD" ? 0 : 7, J === "SUD" ? 7 : 14).every(v => v === 0);
}

function chkF(){
  if(SC.sud >= 40 || SC.nord >= 40) return FI = true;
  if(B.reduce((a,b) => a+b, 0) < 10){
    for(let i=0; i<7; i++) { SC.nord += B[i]; SC.sud += B[i+7]; B[i] = B[i+7] = 0; }
    return FI = true;
  }
  return false;
}

function draw(){
  let rn = document.getElementById("rn"), rs = document.getElementById("rs");
  rn.innerHTML = ""; rs.innerHTML = "";
  for(let i=0; i<=6; i++) rn.appendChild(mk(i, J === "NORD" && MON_ROLE === "NORD" && !FI, "N" + (i + 1)));
  for(let i=7; i<=13; i++) rs.appendChild(mk(i, J === "SUD" && MON_ROLE === "SUD" && !FI, "S" + (i - 6)));
}

function mk(idx, jouable, label){
  let div = document.createElement("div"), nb = B[idx];
  div.className = "case" + (nb === 0 ? " vide" : "");
  if(nb > 0){
    let w = document.createElement("div"); w.className = "billes";
    if(nb <= 15) for(let k=0; k<nb; k++) { let b = document.createElement("div"); b.className = "bille"; w.appendChild(b); }
    else { let c = document.createElement("div"); c.className = "nb"; c.textContent = nb; w.appendChild(c); }
    div.appendChild(w);
    if(jouable) { div.classList.add("jouable"); div.onclick = () => jouer(idx); }
  }
  let num = document.createElement("div"); num.className = "num"; num.textContent = `${label} (${nb})`; div.appendChild(num);
  return div;
}

const majSC = () => { document.getElementById("vsud").textContent = SC.sud; document.getElementById("vnord").textContent = SC.nord; };