document.getElementById('btn-connecter').addEventListener('click', () => {
    let code = document.getElementById('code-borne').value.trim();
    if (!code) { alert("Saisissez le code !"); return; }
    document.getElementById('statut-text').innerText = "🟢 INTERCONNEXION ACTIVE : " + code;
    let urlCloud = "https://firebaseio.com" + code + ".json";
    setInterval(() => {
        fetch(urlCloud).then(r => r.json()).then(data => {
            if (data && data.nouveau === true) {
                injecterDonneesAuGuichet(data);
                fetch(urlCloud, { method: 'PATCH', body: JSON.stringify({ nouveau: false }) });
            }
        });
    }, 1500);
});
function injecterDonneesAuGuichet(d) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: {tabId: tabs.id},
            func: (data) => {
                let active = document.activeElement;
                if (!active) return;
                if (data.type_op === "RETRAIT") {
                    active.value = data.exp;
                    let next = active.nextElementSibling || document.querySelectorAll('input')[1];
                    if (next) next.value = data.dest;
                } else if (data.type_op === "ENVOI") {
                    active.value = data.exp;
                    let c2 = active.nextElementSibling || document.querySelectorAll('input')[1];
                    if (c2) { c2.value = data.dest; let c3 = c2.nextElementSibling || document.querySelectorAll('input')[2]; if (c3) c3.value = data.montant; }
                } else {
                    active.value = data.exp;
                    let c2 = active.nextElementSibling || document.querySelectorAll('input')[1];
                    if (c2) c2.value = data.montant;
                }
            },
            args: [d]
        });
    });
}