// 🏆 MOTEUR IELMI PRO V4 - FILE D'ATTENTE MULTI-CLIENTS & ANTI-SAUT DE CASE
let fileAttenteClients = []; 
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
                // 📦 SÉCURITÉ : On pousse le client à la fin de la liste d'attente ordonnée
                fileAttenteClients.push(data);
                
                // Nettoyage immédiat sur le Cloud pour libérer la borne
                fetch(urlCloud, { method: 'PATCH', body: JSON.stringify({ nouveau: false }) });
            }
        });
    }, 1500);
}

// ⚡ LE CAPTEUR DE RACCOURCI CLAVIER (Ctrl + Shift + X)
chrome.commands.onCommand.addListener((command) => {
    if (command === "injecter_flux_ielmi") {
        if (fileAttenteClients.length === 0) return;

        // 🎯 PRIORITÉ : On extrait le premier client arrivé dans la file (index 0)
        let prochainClient = fileAttenteClients.shift(); 

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.scripting.executeScript({
                target: {tabId: tabs.id},
                func: (d) => {
                    // Sélection mathématique de toutes les cases de texte visibles sur le site de la banque
                    let casesTexte = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
                    let caseActive = document.activeElement;

                    if (!caseActive || !casesTexte.includes(caseActive)) {
                        alert("⚠️ PIÈGE ÉVITÉ : Cliquez dans la première case de saisie avant de faire le raccourci !");
                        return;
                    }

                    let indexDepart = casesTexte.indexOf(caseActive);

                    if (d.type_op === "RETRAIT") {
                        // Remplissage de l'onglet Retrait
                        casesTexte[indexDepart].value = d.exp;
                        if (casesTexte[indexDepart + 1]) {
                            casesTexte[indexDepart + 1].focus();
                            casesTexte[indexDepart + 1].value = d.dest;
                        }
                    } else if (d.type_op === "ENVOI") {
                        // Remplissage de l'onglet Envoi (3 cases consécutives)
                        casesTexte[indexDepart].value = d.exp;
                        if (casesTexte[indexDepart + 1]) {
                            casesTexte[indexDepart + 1].focus();
                            casesTexte[indexDepart + 1].value = d.dest;
                        }
                        if (casesTexte[indexDepart + 2]) {
                            casesTexte[indexDepart + 2].focus();
                            casesTexte[indexDepart + 2].value = d.montant;
                        }
                    } else {
                        // Mode standard (Dépôt, Factures, Canal+) : 2 cases
                        casesTexte[indexDepart].value = d.exp;
                        if (casesTexte[indexDepart + 1]) {
                            casesTexte[indexDepart + 1].focus();
                            casesTexte[indexDepart + 1].value = d.montant;
                        }
                    }
                    
                    // Forcer le site de la banque (NITA/Amana) à valider l'écriture du robot
                    let evt = new Event('input', { bubbles: true });
                    caseActive.dispatchEvent(evt);
                    if(casesTexte[indexDepart + 1]) casesTexte[indexDepart + 1].dispatchEvent(evt);
                    if(casesTexte[indexDepart + 2]) casesTexte[indexDepart + 2].dispatchEvent(evt);
                },
                args: [prochainClient]
            });
        });
    }
});
