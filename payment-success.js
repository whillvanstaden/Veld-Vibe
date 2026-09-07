(function () {
    "use strict";

    const backendUrl = "https://veld-vibe.onrender.com";
    const pendingStorageKey = "veldVibePendingPayment";
    const pending = JSON.parse(localStorage.getItem(pendingStorageKey) || "null");
    let confirmedPurchase = null;
    let attempts = 0;
    let purchaseSent = false;

    function fireVerifiedPurchase() {
        if (!confirmedPurchase || purchaseSent || typeof window.fbq !== "function") return;
        const trackedKey = `veldVibePurchaseTracked:${confirmedPurchase.paymentId}`;
        if (localStorage.getItem(trackedKey)) {
            purchaseSent = true;
            localStorage.removeItem(pendingStorageKey);
            return;
        }

        // Set the guard before queueing the event so refreshes cannot duplicate it.
        localStorage.setItem(trackedKey, "1");
        purchaseSent = true;
        window.fbq("track", "Purchase", {
            value: confirmedPurchase.value,
            currency: "ZAR"
        }, {
            eventID: confirmedPurchase.paymentId
        });
        localStorage.removeItem(pendingStorageKey);
    }

    async function checkPaymentStatus() {
        if (!pending?.paymentId || !/^VV-[0-9a-f-]{36}$/i.test(pending.paymentId)) return;
        attempts += 1;
        try {
            const response = await fetch(
                `${backendUrl}/orders/${encodeURIComponent(pending.paymentId)}/status`,
                { cache: "no-store" }
            );
            const status = await response.json();
            if (response.ok && status.paid === true && Number.isFinite(Number(status.value)) && status.currency === "ZAR") {
                confirmedPurchase = {
                    paymentId: pending.paymentId,
                    value: Number(status.value)
                };
                fireVerifiedPurchase();
                return;
            }
        } catch {
            // PayFast's ITN can arrive just after the customer returns; retry below.
        }
        if (attempts < 40) setTimeout(checkPaymentStatus, 3000);
    }

    window.addEventListener("veldVibeMetaReady", fireVerifiedPurchase);
    checkPaymentStatus();
}());
