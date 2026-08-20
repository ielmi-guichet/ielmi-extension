// 🏆 MOTEUR ARRIÈRE-PLAN V6 AVEC ALERTE DE BADGE VISUEL
let fileAttenteClients = [];
let codeLiaisonActif = "";
let injectionEnCours = false;

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
                fileAttenteClients.push(data);
                
                // 🚨 SIGNAL VISUEL : On allume un badge orange sur l'icône du PC
                chrome.action.setBadgeText({ text: fileAttenteClients.length.toString() });
                chrome.action.setBadgeBackgroundColor({ color: "#FF9800" });

                fetch(urlCloud, { method: 'PATCH', body: JSON.stringify({ nouveau: false }) });
            }
        });
    }, 1500);
}

chrome.commands.onCommand.addListener((command) => {
    if (command === "injecter_flux_ielmi") {
        if (fileAttenteClients.length === 0 || injectionEnCours) return;
        injectionEnCours = true;

        let prochainClient = fileAttenteClients.shift();
        
        // Mettre à jour ou effacer le badge orange après injection
        chrome.action.setBadgeText({ text: fileAttenteClients.length > 0 ? fileAttenteClients.length.toString() : "" });

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            let ongletActif = tabs[0];
            if (!ongletActif || !ongletActif.url) { injectionEnCours = false; return; }

            chrome.scripting.executeScript({
                target: {tabId: ongletActif.id},
                func: (d) => {
                    let casesTexte = Array.from(document.querySelectorAll('input[type="text"], input:not([type]), input[type="tel"]'));
                    let caseActive = document.activeElement;

                    if (!caseActive || !casesTexte.includes(caseActive)) {
                        alert("⚠️ PIÈGE ÉVITÉ : Cliquez dans la première case de saisie avant de faire le raccourci !");
                        return;
                    }

                    let indexDepart = casesTexte.indexOf(caseActive);
                    let evt = new Event('input', { bubbles: true });

                    let injecterProprement = (inputElement, valeur) => {
                        if (!inputElement) return;
                        inputElement.focus();
                        let valeurPropre = valeur.toString().replace(/[\s-]/g, '');
                        inputElement.value = ""; 
                        inputElement.value = valeurPropre;
                        inputElement.dispatchEvent(evt);
                    };

                    if (d.type_op === "RETRAIT") {
                        injecterProprement(casesTexte[indexDepart], d.exp);
                        if (casesTexte[indexDepart + 1]) injecterProprement(casesTexte[indexDepart + 1], d.dest);
                    } else if (d.type_op === "ENVOI") {
                        injecterProprement(casesTexte[indexDepart], d.exp);
                        if (casesTexte[indexDepart + 1]) injecterProprement(casesTexte[indexDepart + 1], d.dest);
                        if (casesTexte[indexDepart + 2]) injecterProprement(casesTexte[indexDepart + 2], d.montant);
                    } else {
                        injecterProprement(casesTexte[indexDepart], d.exp);
                        if (casesTexte[indexDepart + 1]) injecterProprement(casesTexte[indexDepart + 1], d.montant);
                    }
                },
                args: [prochainClient]
            }).then(() => {
                setTimeout(() => { injectionEnCours = false; }, 1500);
            }).catch(() => { injectionEnCours = false; });
        });
    }
});
