(function () {
    "use strict";

    const consentKey = "veldVibeMetaConsent";
    const pixelId = "1928208843860853";

    function loadMetaPixel() {
        if (window.fbq) return;
        !function(f,b,e,v,n,t,s){
            if(f.fbq)return;
            n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
            s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
        }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', pixelId);
        fbq('track', 'PageView');
    }

    function saveChoice(choice) {
        localStorage.setItem(consentKey, choice);
        document.getElementById("veldVibeCookieBanner")?.remove();
        if (choice === "granted") loadMetaPixel();
    }

    function showBanner() {
        if (document.getElementById("veldVibeCookieBanner")) return;
        const banner = document.createElement("aside");
        banner.id = "veldVibeCookieBanner";
        banner.setAttribute("aria-label", "Cookie and advertising preferences");
        banner.innerHTML = `
            <p><strong>Your privacy choices</strong><br>We use Meta Pixel cookies to measure advertising and, if enabled, match information such as an email address or phone number with Meta. You can accept or decline. <a href="privacy.html">Read our Privacy Policy</a>.</p>
            <div><button type="button" data-choice="denied">Decline</button><button type="button" class="accept" data-choice="granted">Accept</button></div>`;
        const style = document.createElement("style");
        style.textContent = `#veldVibeCookieBanner{position:fixed;z-index:100000;left:16px;right:16px;bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:20px;max-width:1050px;margin:auto;padding:18px 20px;border:2px solid #b77a2c;border-radius:12px;background:#21170f;color:#fff;box-shadow:0 8px 30px rgba(0,0,0,.4);font:15px/1.5 Arial,sans-serif}#veldVibeCookieBanner p{margin:0}#veldVibeCookieBanner a{color:#ffd984;text-decoration:underline}#veldVibeCookieBanner div{display:flex;gap:10px;flex-shrink:0}#veldVibeCookieBanner button{padding:10px 16px;border:1px solid #e7b85f;border-radius:7px;background:#fff;color:#21170f;font-weight:700;cursor:pointer}#veldVibeCookieBanner button.accept{background:#b77a2c;color:#fff}@media(max-width:650px){#veldVibeCookieBanner{flex-direction:column;align-items:stretch}#veldVibeCookieBanner div{justify-content:flex-end}}`;
        document.head.appendChild(style);
        document.body.appendChild(banner);
        banner.querySelectorAll("button[data-choice]").forEach(button => {
            button.addEventListener("click", () => saveChoice(button.dataset.choice));
        });
    }

    window.veldVibeCookieChoice = function (choice) {
        if (!["granted", "denied"].includes(choice)) return;
        saveChoice(choice);
        if (choice === "denied") window.location.reload();
    };

    const consent = localStorage.getItem(consentKey);
    if (consent === "granted") loadMetaPixel();
    else if (consent !== "denied") {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showBanner);
        else showBanner();
    }
}());
