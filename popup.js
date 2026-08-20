// 🏆 SOUDEUR DE COMPTOIR PERMANENT IELMI V6
document.addEventListener('DOMContentLoaded', () => {
    let codeSauvegarde = localStorage.getItem("IELMI_CODE_PC");
    if (codeSauvegarde) {
        document.getElementById('code-borne').value = codeSauvegarde;
        afficherVoyantVert(codeSauvegarde);
        chrome.runtime.sendMessage({ action: "demarrer_ecoute", code: codeSauvegarde });
    }
});

document.getElementById('btn-connecter').addEventListener('click', () => {
    let code = document.getElementById('code-borne').value.trim();
    if (!code) { alert("Saisissez le code !"); return; }
    
    localStorage.setItem("IELMI_CODE_PC", code); // Gravé dans la mémoire du PC
    afficherVoyantVert(code);
    chrome.runtime.sendMessage({ action: "demarrer_ecoute", code: code });
});

function afficherVoyantVert(c) {
    document.getElementById('statut-text').innerText = "🟢 INTERCONNEXION ACTIVE : " + c;
    document.getElementById('statut-text').style.background = "#E8F5E9";
    document.getElementById('statut-text').style.color = "#2E7D32";
}
