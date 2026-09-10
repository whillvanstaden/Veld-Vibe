(function () {
    'use strict';
    if (window.veldVibeTracking) return;
    function parameters(cart, catalogue) {
        const contents = [];
        const names = [];
        for (const item of cart || []) {
            names.push(catalogue?.[item.product]?.title?.replace(/^BUY /, '') || item.product);
            for (const [size, entry] of Object.entries(item.sizes || {})) {
                const price = entry.price;
                const quantity = entry.quantity;
                if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0 ||
                    !Number.isInteger(quantity) || quantity <= 0) return null;
                contents.push({ id: `${item.product}:${size}`, quantity, item_price: price });
            }
        }
        if (!contents.length) return null;
        return {
            value: Math.round(contents.reduce((sum, item) => sum + item.item_price * item.quantity, 0) * 100) / 100,
            currency: 'ZAR', content_type: 'product',
            content_name: [...new Set(names)].join(', '),
            content_ids: [...new Set(contents.map(item => item.id))], contents,
            num_items: contents.reduce((sum, item) => sum + item.quantity, 0)
        };
    }
    function send(name, cart, catalogue) {
        const data = parameters(cart, catalogue);
        if (!data) {
            if (['localhost', '127.0.0.1'].includes(location.hostname)) console.warn('Invalid ecommerce value; event skipped:', name);
            return false;
        }
        return dispatch(name, data);
    }
    function buyNow(productId, product) {
        if (!productId || !product?.title) return false;
        // Intent precedes size selection: no price or currency is asserted.
        return dispatch('Buy now', {
            content_name: product.title.replace(/^BUY /, ''),
            content_ids: [productId],
            content_type: 'product'
        });
    }
    function dispatch(name, data) {
        // Respect the existing consent choice; never queue unconsented actions.
        try {
            if (localStorage.getItem('veldVibeMetaConsent') !== 'granted' || typeof window.fbq !== 'function') return false;
            window.fbq(['Buy now', 'PaySecurely'].includes(name) ? 'trackCustom' : 'track', name, data);
            return true;
        } catch { return false; }
    }
    window.veldVibeTracking = { parameters, send, buyNow };
}());
