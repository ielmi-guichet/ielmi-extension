// 🏆 SOUDEUR DE COMPTOIR INTELLIGENT IELMI V6
document.addEventListener('DOMContentLoaded', () => {
    let codeSauvegarde = localStorage.getItem("IELMI_CODE_PC");
    if (codeSauvegarde) {
        verifierEtConnecter(codeSauvegarde, true);
    }
});

document.getElementById('btn-connecter').addEventListener('click', () => {
    let code = document.getElementById('code-borne').value.trim();
    if (!code || code.length !== 4) { 
        alert("⚠️ ERREUR : Saisissez un code valide à 4 chiffres !"); 
        return; 
    }
    verifierEtConnecter(code, false);
});

function verifierEtConnecter(codeX, automatique) {
    let urlVerification = "https://firebaseio.com" + codeX + ".json";
    
    fetch(urlVerification)
    .then(r => r.json())
    .then(data => {
        if (data) {
            localStorage.setItem("IELMI_CODE_PC", codeX);
            document.getElementById('statut-text').innerText = "🟢 INTERCONNEXION ACTIVE : BORNE " + codeX;
            document.getElementById('statut-text').style.background = "#E8F5E9";
            document.getElementById('statut-text').style.color = "#2E7D32";
            chrome.runtime.sendMessage({ action: "demarrer_ecoute", code: codeX });
        } else {
            localStorage.removeItem("IELMI_CODE_PC");
            document.getElementById('statut-text').innerText = "🔴 CODE INCONNU OU EXPIRÉ - BORNE INACTIVE";
            document.getElementById('statut-text').style.background = "#FFEBEE";
            document.getElementById('statut-text').style.color = "#C62828";
            if(!automatique) alert("❌ Code incorrect ou borne non synchronisée !");
        }
    })
    .catch(() => {
        document.getElementById('statut-text').innerText = "⚠️ ERREUR DE RÉSEAU INTERNET";
    });
}
