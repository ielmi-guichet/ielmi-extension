// 🏆 MOTEUR IELMI PRO V4 : FILE D'ATTENTE MULTI-CLIENTS STRUCTURÉE
let fileAttenteClients = []; // Liste ordonnée des transactions reçues
let codeLiaisonActif = "";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "demarrer_ecoute") {
        codeLiaisonActif = request.code;
        demarrerSurveillanceCloud();
    }
});

function demarrerSurveillanceCloud() {
    setInterval(() => {
        if (!codeLiaisonActif) return;
        let urlCloud = "https://firebaseio.com" + codeLiaisonActif + ".json";
        
        fetch(urlCloud)
        .then(r => r.json())
        .then(data => {
            if (data && data.nouveau === true) {
                // 📦 AJOUT À LA FILE : On pousse le client à la fin de la liste d'attente
                fileAttenteClients.push(data);
                
                // Nettoyage immédiat sur le Cloud pour libérer la borne pour le client suivant
                fetch(urlCloud, { method: 'PATCH', body: JSON.stringify({ nouveau: false }) });
            }
        });
    }, 1500);
}

// Déclencheur clavier magique à 3 touches
chrome.commands.onCommand.addListener((command) => {
    if (command === "injecter_flux_ielmi") {
        // Si la file d'attente est vide, on s'arrête
        if (fileAttenteClients.length === 0) return;

        // 🎯 EXTRACTION PRIORITAIRE : On extrait le PREMIER client arrivé dans la liste (index 0)
        let prochainClient = fileAttenteClients.shift(); 

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.scripting.executeScript({
                target: {tabId: tabs.id},
                func: (data) => {
                    let active = document.activeElement;
                    if (!active || active.tagName !== "INPUT") return;
                    
                    if (data.type_op === "RETRAIT") {
                        active.value = data.exp;
                        let next = active.nextElementSibling || document.querySelectorAll('input')[Array.from(document.querySelectorAll('input')).indexOf(active)+1];
                        if (next) next.value = data.dest;
                    } else if (data.type_op === "ENVOI") {
                        active.value = data.exp;
                        let c2 = active.nextElementSibling || document.querySelectorAll('input')[Array.from(document.querySelectorAll('input')).indexOf(active)+1];
                        if (c2) { c2.value = data.dest; let c3 = c2.nextElementSibling || document.querySelectorAll('input')[Array.from(document.querySelectorAll('input')).indexOf(c2)+1]; if (c3) c3.value = data.montant; }
                    } else {
                        active.value = data.exp;
                        let c2 = active.nextElementSibling || document.querySelectorAll('input')[Array.from(document.querySelectorAll('input')).indexOf(active)+1];
                        if (c2) c2.value = data.montant;
                    }
                },
                args: [prochainClient]
            });
        });
    }
});
