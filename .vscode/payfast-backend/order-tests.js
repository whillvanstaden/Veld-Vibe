const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
// Test without loading local credentials, connecting to a database, or sending payments/email.
const express = () => ({ set() {}, use() {}, post() {} });
express.json = express.urlencoded = () => () => {};
const context = {
    require(name) {
        if (name === 'express') return express;
        if (name === 'cors') return () => () => {};
        if (name === 'dotenv') return { config() {} };
        if (name === 'pg') return { Pool: class {} };
        return require(name);
    },
    module: { exports: {} }, process: { env: {} }, console, Buffer, AbortSignal
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8'), context);
const { normaliseCart, orderRows, escapeHtml } = context.module.exports;
test('men sizes use trusted catalogue prices, not supplied R50', () => {
    const rows = orderRows(normaliseCart([{ product: 'mens', sizes: { L: { quantity: 1, price: 50 }, '8XL': { quantity: 2, price: 50 } } }]));
    assert.equal(rows[0].price, 1500);
    assert.equal(rows[1].price, 1700);
    assert.equal(rows.reduce((sum, row) => sum + row.price * row.quantity, 0), 4900);
});
test('other products retain catalogue pricing', () => {
    for (const [product, size, price] of [['ladies', 'XS', 1480], ['kids', 'XS', 1400], ['chelsea', '8', 990], ['laceup', '8', 850]]) {
        assert.equal(orderRows(normaliseCart([{ product, sizes: { [size]: { quantity: 1 } } }]))[0].price, price);
    }
});
test('invalid carts cannot create orders', () => {
    for (const cart of [[], [{ product: 'unknown', sizes: {} }], [{ product: 'mens', sizes: { XS: { quantity: 1 } } }], [{ product: 'mens', sizes: { L: { quantity: -1 } } }]]) {
        assert.throws(() => normaliseCart(cart));
    }
});
test('customer text is HTML escaped', () => {
    assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
});
test('5XL is unavailable for both adult jackets', () => {
    for (const product of ['mens', 'ladies']) {
        assert.throws(() => normaliseCart([{ product, sizes: { '5XL': { quantity: 1 } } }]), /sold out/);
    }
});

function harness() {
    const routes = {};
    const orders = new Map();
    const emails = [];
    const state = { valid: true, emailFailure: false, databaseFailure: false };
    const app = { set() {}, use() {}, post(route, handler) { routes[route] = handler; } };
    const express = () => app;
    express.json = express.urlencoded = () => () => {};
    const query = async (sql, params = []) => {
        if (state.databaseFailure) throw new Error('Simulated database failure');
        const order = orders.get(params[0]);
        if (sql.startsWith('INSERT')) orders.set(params[0], { payment_id: params[0], amount: params[1], customer: JSON.parse(params[2]), cart: JSON.parse(params[3]), status: 'pending' });
        if (sql.includes("SET status='paid'")) order.status = 'paid';
        if (sql.includes('SET email_sent_at')) order.email_sent_at = 'sent';
        return { rows: sql.startsWith('SELECT') && order ? [order] : [] };
    };
    const env = { PAYFAST_MERCHANT_ID: 'test-merchant', PAYFAST_MERCHANT_KEY: 'test-key', PAYFAST_PASSPHRASE: 'test-passphrase', PAYFAST_URL: 'https://sandbox.payfast.co.za/eng/process', PAYFAST_NOTIFY_URL: 'https://example.test/payfast/notify' };
    const ctx = {
        require(name) {
            if (name === 'express') return express;
            if (name === 'cors') return () => () => {};
            if (name === 'dotenv') return { config() {} };
            if (name === 'pg') return { Pool: class { query(...args) { return query(...args); } async connect() { return { query, release() {} }; } } };
            if (name === 'dns') return { promises: { lookup: async () => [{ address: '192.0.2.1' }] } };
            return require(name);
        },
        module: { exports: {} }, process: { env }, console: { error() {} }, Buffer, AbortSignal,
        async fetch(url, options) {
            if (url.includes('resend.com')) {
                if (state.emailFailure) return { ok: false, status: 503 };
                emails.push(JSON.parse(options.body));
                return { ok: true };
            }
            return { ok: true, text: async () => state.valid ? 'VALID' : 'INVALID' };
        }
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8'), ctx);
    async function call(route, body, ip = '192.0.2.1') {
        const response = { code: 200, status(code) { this.code = code; return this; }, sendStatus(code) { this.code = code; }, json(value) { this.body = value; } };
        await routes[route]({ body, ip }, response);
        return response;
    }
    function notification(id, overrides = {}) {
        const body = { m_payment_id: id, pf_payment_id: 'test-pf-id', payment_status: 'COMPLETE', amount_gross: '1500.00', merchant_id: env.PAYFAST_MERCHANT_ID, ...overrides };
        const params = Object.entries(body).map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`).join('&');
        body.signature = require('node:crypto').createHash('md5').update(`${params}&passphrase=test-passphrase`).digest('hex');
        return body;
    }
    return { call, notification, orders, emails, state };
}
const customerOrder = { firstName: 'Test', surname: 'Customer', phoneNumber: '0800000000', email: 'test@example.test', address: 'Test address\nTest town', amount: 1500, cart: [{ product: 'mens', sizes: { L: { quantity: 1, price: 1500 } } }] };
test('full order saved before payment; valid confirmation emails all details only once', async () => {
    const h = harness();
    const created = await h.call('/create-payment', customerOrder);
    assert.equal(created.code, 200);
    const id = created.body.paymentData.m_payment_id;
    assert.equal(h.orders.get(id).customer.address, customerOrder.address);
    assert.equal(h.emails.length, 0);
    assert.equal((await h.call('/payfast/notify', h.notification(id))).code, 200);
    assert.equal(h.emails.length, 1);
    assert.match(h.emails[0].html, /Men&#039;s Parka Jacket/);
    assert.match(h.emails[0].html, /Test address<br>Test town/);
    assert.match(h.emails[0].html, /0800000000/);
    assert.equal(h.emails[0].to[0], 'veldvibeza@gmail.com');
    await h.call('/payfast/notify', h.notification(id));
    assert.equal(h.emails.length, 1);
});
test('wrong amount, signature, source, merchant and validation cannot mark orders paid', async () => {
    for (const kind of ['amount', 'signature', 'ip', 'merchant', 'remote']) {
        const h = harness();
        const created = await h.call('/create-payment', customerOrder);
        const id = created.body.paymentData.m_payment_id;
        const payload = h.notification(id, kind === 'amount' ? { amount_gross: '50.00' } : kind === 'merchant' ? { merchant_id: 'wrong' } : {});
        if (kind === 'signature') payload.signature = '0'.repeat(32);
        if (kind === 'remote') h.state.valid = false;
        assert.equal((await h.call('/payfast/notify', payload, kind === 'ip' ? '192.0.2.2' : undefined)).code, 400);
        assert.equal(h.orders.get(id).status, 'pending');
        assert.equal(h.emails.length, 0);
    }
});
test('failed email retains paid order for retry', async () => {
    const h = harness();
    const created = await h.call('/create-payment', customerOrder);
    const id = created.body.paymentData.m_payment_id;
    h.state.emailFailure = true;
    assert.equal((await h.call('/payfast/notify', h.notification(id))).code, 500);
    assert.equal(h.orders.get(id).status, 'paid');
    assert.equal(h.orders.get(id).email_sent_at, undefined);
    h.state.emailFailure = false;
    assert.equal((await h.call('/payfast/notify', h.notification(id))).code, 200);
    assert.equal(h.emails.length, 1);
});
test('failed database never returns a payable form', async () => {
    const h = harness(); h.state.databaseFailure = true;
    const response = await h.call('/create-payment', customerOrder);
    assert.equal(response.code, 500);
    assert.equal(response.body.paymentData, undefined);
});
test('unpaid notification sends nothing; sold-out requests fail clearly', async () => {
    const h = harness();
    const created = await h.call('/create-payment', customerOrder);
    const id = created.body.paymentData.m_payment_id;
    await h.call('/payfast/notify', h.notification(id, { payment_status: 'CANCELLED' }));
    assert.equal(h.emails.length, 0);
    const rejected = await h.call('/create-payment', { ...customerOrder, cart: [{ product: 'ladies', sizes: { '5XL': { quantity: 1 } } }] });
    assert.equal(rejected.code, 400);
});
