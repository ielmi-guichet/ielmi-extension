document.getElementById('btn-connecter').addEventListener('click', () => {
    let code = document.getElementById('code-borne').value.trim();
    if (!code) { alert("Saisissez le code !"); return; }
    
    document.getElementById('statut-text').innerText = "🟢 INTERCONNEXION EN LIGNE ACTIVE : " + code;
    document.getElementById('statut-text').style.background = "#E8F5E9";
    
    // Envoi du code au script d'arrière-plan permanent
    chrome.runtime.sendMessage({ action: "demarrer_ecoute", code: code });
});
