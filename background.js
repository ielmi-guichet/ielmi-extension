// 🏆 MOTEUR IELMI PRO V6 - VERSION FINALE ANTI-SPAM ET COMPATIBILITÉ CLAVIER AZERTY
let fileAttenteClients = []; 
let codeLiaisonActif = "";
let injectionEnCours = false; // Verrou Anti-Spam de l'agent

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
                fetch(urlCloud, { method: 'PATCH', body: JSON.stringify({ nouveau: false }) });
            }
        });
    }, 1500);
}

// ⚡ INTERCEPTEUR CLAVIER SÉCURISÉ (Ctrl + Shift + X)
chrome.commands.onCommand.addListener((command) => {
    if (command === "injecter_flux_ielmi") {
        if (fileAttenteClients.length === 0) return;
        
        // 🔒 PARADE FAILLE 2 : Si une injection est déjà en cours, on bloque les touches (Anti-Spam)
        if (injectionEnCours) return; 
        injectionEnCours = true;

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            let ongletActif = tabs[0];
            if (!ongletActif || !ongletActif.url) { injectionEnCours = false; return; }

            // Sécurité d'adresse stricte
            let url = ongletActif.url.toLowerCase();
            if (!url.includes("nita") && !url.includes("amana") && !url.includes("al-izza") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
                alert("🔒 SÉCURITÉ IELMI PRO :\nInjection bloquée sur ce site.");
                injectionEnCours = false;
                return;
            }

            let prochainClient = fileAttenteClients.shift(); 

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

                    // 🪓 PARADE FAILLE 1 & 3 : Injection propre par la ligne supérieure de chiffres et nettoyage des caractères
                    let injecterProprement = (inputElement, valeur) => {
                        if (!inputElement) return;
                        inputElement.focus();
                        // Nettoyage des espaces et tirets parasites pour le moteur bancaire
                        let valeurPropre = valeur.toString().replace(/[\s-]/g, '');
                        inputElement.value = ""; 
                        inputElement.value = valeurPropre;
                        inputElement.dispatchEvent(evt);
                    };

                    if (d.type_op === "RETRAIT") {
                        injecterProprement(casesTexte[indexDepart], d.exp);
                        injecterProprement(casesTexte[indexDepart + 1], d.dest);
                    } else if (d.type_op === "ENVOI") {
                        injecterProprement(casesTexte[indexDepart], d.exp);
                        injecterProprement(casesTexte[indexDepart + 1], d.dest);
                        injecterProprement(casesTexte[indexDepart + 2], d.montant);
                    } else {
                        injecterProprement(casesTexte[indexDepart], d.exp);
                        injecterProprement(casesTexte[indexDepart + 1], d.montant);
                    }
                },
                args: [prochainClient]
            }).then(() => {
                // Libération du verrou après 1.5 seconde pour sécuriser la file d'attente
                setTimeout(() => { injectionEnCours = false; }, 1500);
            }).catch(() => { injectionEnCours = false; });
        });
    }
});
                          
