const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { Pool } = require("pg");
const dns = require("dns").promises;

require("dotenv").config();

const app = express();
// Render terminates requests at its reverse proxy. Confirm this hop count before deployment.
app.set("trust proxy", 1);

app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true }
});

async function prepareDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            payment_id TEXT PRIMARY KEY,
            status TEXT NOT NULL DEFAULT 'pending',
            amount NUMERIC(10,2) NOT NULL,
            customer JSONB NOT NULL,
            cart JSONB NOT NULL,
            paid_at TIMESTAMPTZ,
            email_sent_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
}

function orderRows(cart) {
    return (cart || []).flatMap(product =>
        Object.entries(product.sizes || {}).map(([size, item]) => ({
            product: product.product,
            size,
            quantity: Number(item.quantity),
            price: Number(item.price)
        }))
    );
}

const productNames = { mens: "Men's Parka Jacket", ladies: "Ladies' Parka Jacket", kids: "Children's Parka", chelsea: "Chelsea Boot", laceup: "Lace-up Vellie" };

function normaliseCart(cart) {
    if (!Array.isArray(cart) || !cart.length || cart.length > 30) throw new Error("Invalid cart");
    const regular = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
    const large = ["6XL", "7XL", "8XL", "9XL", "10XL"];
    return cart.map(item => {
        if (!productNames[item.product] || !item.sizes || !Object.keys(item.sizes).length) throw new Error("Invalid product");
        const sizes = {};
        for (const [name, value] of Object.entries(item.sizes)) {
            if (["mens", "ladies"].includes(item.product) && name === "5XL") throw new Error("5XL is sold out");
            let price;
            if (["mens", "ladies"].includes(item.product)) {
                if (regular.includes(name)) price = 1500;
                else if (large.includes(name)) price = 1700;
                else if (item.product === "ladies" && ["3XS", "2XS", "XS"].includes(name)) price = 1480;
            } else if (item.product === "kids") {
                if (["5XS", "4XS", "3XS", "2XS", "XS"].includes(name)) price = 1400;
                else if (regular.slice(0, 7).includes(name)) price = 1500;
            } else if (["5", "6", "7", "8", "9", "10"].includes(name)) {
                price = item.product === "chelsea" ? 990 : 850;
            }
            const quantity = Number(value.quantity);
            if (!price || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new Error("Invalid size or quantity");
            sizes[name] = { quantity, price };
        }
        return { product: item.product, sizes };
    });
}

async function sendOrderEmail(order) {
    const customer = order.customer;
    const rows = orderRows(order.cart);
    const itemsHtml = rows.map(item => `<tr><td>${escapeHtml(productNames[item.product] || item.product)}</td><td>${escapeHtml(item.size)}</td><td>${item.quantity}</td><td>R${item.price}</td></tr>`).join("");
    const response = await fetch("https://api.resend.com/emails", {
        signal: AbortSignal.timeout(15000),
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `paid-order/${order.payment_id}`
        },
        body: JSON.stringify({
            from: "Veld Vibe Orders <orders@orders.veldvibesa.co.za>",
            to: ["veldvibeza@gmail.com"],
            subject: `PAID ORDER ${order.payment_id} — R${order.amount}`,
            html: `<h1>New paid Veld Vibe order</h1><p><strong>Payment reference:</strong> ${escapeHtml(order.payment_id)}</p><p><strong>Customer:</strong> ${escapeHtml(customer.firstName)} ${escapeHtml(customer.surname)}<br><strong>Phone:</strong> ${escapeHtml(customer.phoneNumber)}<br><strong>Email:</strong> ${escapeHtml(customer.email || "Not supplied")}<br><strong>Delivery address:</strong><br>${escapeHtml(customer.address).replace(/\n/g, "<br>")}</p><table border="1" cellpadding="8" cellspacing="0"><tr><th>Product</th><th>Size</th><th>Qty</th><th>Unit price</th></tr>${itemsHtml}</table><h2>Total paid: R${escapeHtml(order.amount)}</h2>`
        })
    });
    if (!response.ok) throw new Error(`Resend failed: ${response.status}`);
}

// Lock the stored order while sending, so simultaneous callbacks cannot send duplicates.
async function deliverPaidOrder(paymentId) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query("SELECT * FROM orders WHERE payment_id=$1 FOR UPDATE", [paymentId]);
        const order = result.rows[0];
        if (order?.status === "paid" && !order.email_sent_at) {
            await sendOrderEmail(order);
            await client.query("UPDATE orders SET email_sent_at=NOW() WHERE payment_id=$1", [paymentId]);
        }
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

let retryRunning = false;
async function retryPendingEmails() {
    if (retryRunning) return;
    retryRunning = true;
    try {
        const result = await pool.query("SELECT payment_id FROM orders WHERE status='paid' AND email_sent_at IS NULL ORDER BY paid_at LIMIT 20");
        for (const order of result.rows) {
            try { await deliverPaidOrder(order.payment_id); }
            catch { console.error("Paid-order email remains queued", order.payment_id); }
        }
    } catch { console.error("Could not read queued paid-order emails"); }
    finally { retryRunning = false; }
}


// ======================================
// PAYFAST URL ENCODING
// PHP urlencode() compatible
// ======================================

function payfastEncode(value) {

    return encodeURIComponent(

        String(value).trim()

    )

        // JavaScript encodeURIComponent()
        // does not encode these characters.
        // PayFast expects urlencode-style encoding.

        .replace(

            /[!'()*~]/g,

            character =>

                "%" +

                character
                    .charCodeAt(0)
                    .toString(16)
                    .toUpperCase()

        )

        // PayFast requires spaces as +

        .replace(

            /%20/g,

            "+"

        );

}


// ======================================
// PAYFAST SIGNATURE
// ======================================

function generateSignature(
    data,
    passphrase = ""
) {

    // Exact PayFast custom
    // payment field order

    const fieldOrder = [

        "merchant_id",

        "merchant_key",

        "return_url",

        "cancel_url",

        "notify_url",

        "notify_method",

        "name_first",

        "name_last",

        "email_address",

        "cell_number",

        "m_payment_id",

        "amount",

        "item_name",

        "item_description",

        "custom_int1",

        "custom_int2",

        "custom_int3",

        "custom_int4",

        "custom_int5",

        "custom_str1",

        "custom_str2",

        "custom_str3",

        "custom_str4",

        "custom_str5",

        "email_confirmation",

        "confirmation_address",

        "currency",

        "payment_method",

        "subscription_type",

        "billing_date",

        "recurring_amount",

        "frequency",

        "cycles",

        "subscription_notify_email",

        "subscription_notify_webhook",

        "subscription_notify_buyer"

    ];


    const pairs = [];


    fieldOrder.forEach(

        key => {

            const value = data[key];


            // Only include
            // non-blank fields

            if (

                value !== undefined &&

                value !== null &&

                String(value).trim() !== ""

            ) {

                pairs.push(

                    `${key}=${payfastEncode(value)}`

                );

            }

        }

    );


    // Add passphrase ONLY
    // if one exists in PayFast

    if (

        passphrase &&

        passphrase.trim() !== ""

    ) {

        pairs.push(

            `passphrase=${payfastEncode(passphrase)}`

        );

    }


    const parameterString =

        pairs.join("&");




    const signature =

        crypto

            .createHash("md5")

            .update(

                parameterString

            )

            .digest("hex");




    return signature;

}


// ======================================
// CREATE PAYMENT
// ======================================

app.post(

    "/create-payment",

    async (req, res) => {

        try {

            const {

                firstName,

                surname,

                email,

                phoneNumber,

                amount,

                itemName,

                address,

                cart

            } = req.body;


            let pricedCart;
            try { pricedCart = normaliseCart(cart); }
            catch { return res.status(400).json({ success: false, message: "A product or size is unavailable. Please refresh and edit your cart." }); }
            if ([firstName, surname, phoneNumber, address].some(value => typeof value !== "string" || !value.trim()) ||
                firstName.length > 100 || surname.length > 100 || phoneNumber.length > 30 || address.length > 2000 ||
                (email != null && (typeof email !== "string" || email.length > 254))) {
                return res.status(400).json({ success: false, message: "Please enter valid customer and delivery details." });
            }
            const serverAmount = orderRows(pricedCart).reduce((total, item) => total + item.quantity * item.price, 0);
            if (serverAmount !== Number(amount)) return res.status(400).json({ success: false, message: "Your cart prices have changed. Refresh your cart before paying." });

            // ==================================
            // BUILD PAYFAST PAYMENT DATA
            // ==================================

            const paymentData = {


                // MERCHANT DETAILS

                merchant_id:

                    process.env
                        .PAYFAST_MERCHANT_ID,

                merchant_key:

                    process.env
                        .PAYFAST_MERCHANT_KEY,


                // RETURN URLS

                return_url:

                    process.env
                        .PAYFAST_RETURN_URL,

                cancel_url:

                    process.env
                        .PAYFAST_CANCEL_URL,


                // NOTIFY URL

                notify_url:

                    process.env
                        .PAYFAST_NOTIFY_URL || "",


                // CUSTOMER DETAILS

                name_first:

                    firstName || "",

                name_last:

                    surname || "",

                email_address:

                    email || "",

                cell_number:

                    phoneNumber || "",


                // PAYMENT DETAILS

                m_payment_id:

                    `VV-${crypto.randomUUID()}`,


                amount:

                    Number(amount)
                        .toFixed(2),


                item_name:

                    `Veld Vibe Order - ${orderRows(pricedCart).reduce((total, row) => total + row.quantity, 0)} item(s)`

            };

            if (!firstName || !surname || !phoneNumber || !address || !Array.isArray(cart) || !cart.length || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
                return res.status(400).json({ success: false, message: "Invalid order details." });
            }


            // ==================================
            // GENERATE SIGNATURE
            // ==================================

            const signature =

                generateSignature(

                    paymentData,

                    process.env
                        .PAYFAST_PASSPHRASE || ""

                );


            paymentData.signature =

                signature;

            await pool.query(
                `INSERT INTO orders (payment_id, amount, customer, cart)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (payment_id) DO NOTHING`,
                [paymentData.m_payment_id, paymentData.amount, JSON.stringify({ firstName, surname, phoneNumber, email, address }), JSON.stringify(pricedCart)]
            );




            // ==================================
            // SEND DATA TO CHECKOUT
            // ==================================

            res.json({

                success:

                    true,


                paymentUrl:

                    process.env
                        .PAYFAST_URL,


                paymentData:

                    paymentData

            });

        }

        catch (error) {

            console.error("Payment creation failed; no payment form returned.");


            res.status(500).json({

                success:

                    false,

                message:

                    "Unable to create payment."

            });

        }

    }

);


// ======================================
// Confirm payment with PayFast before marking the order paid or emailing it.
app.post("/payfast/notify", async (req, res) => {
    const data = req.body;
    try {
        if (!data || Object.values(data).some(value => typeof value !== "string")) return res.sendStatus(400);
        const lookups = await Promise.allSettled(["www.payfast.co.za", "sandbox.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za"]
            .map(host => dns.lookup(host, { all: true })));
        const addresses = lookups.filter(result => result.status === "fulfilled").flatMap(result => result.value.map(entry => entry.address));
        if (!addresses.length) return res.sendStatus(503);
        if (!addresses.includes(String(req.ip).replace(/^::ffff:/, ""))) return res.sendStatus(400);
        const pairs = Object.keys(data).filter(key => key !== "signature")
            .map(key => `${key}=${payfastEncode(data[key])}`);
        const unsigned = pairs.join("&");
        const passphrase = process.env.PAYFAST_PASSPHRASE || "";
        const signed = unsigned + (passphrase ? `&passphrase=${payfastEncode(passphrase)}` : "");
        const expected = crypto.createHash("md5").update(signed).digest("hex");
        if (!/^[a-f0-9]{32}$/i.test(data.signature || "") || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(data.signature.toLowerCase()))) {
            return res.sendStatus(400);
        }
        if (data.merchant_id !== process.env.PAYFAST_MERCHANT_ID) return res.sendStatus(400);
        const validationUrl = process.env.PAYFAST_URL?.includes("sandbox.payfast.co.za")
            ? "https://sandbox.payfast.co.za/eng/query/validate"
            : "https://www.payfast.co.za/eng/query/validate";
        const validation = await fetch(validationUrl, {
            signal: AbortSignal.timeout(15000),
            method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: unsigned
        });
        if (!validation.ok || (await validation.text()).trim() !== "VALID") return res.sendStatus(400);
        const result = await pool.query("SELECT * FROM orders WHERE payment_id=$1", [data.m_payment_id]);
        const order = result.rows[0];
        if (!order || Math.round(Number(data.amount_gross) * 100) !== Math.round(Number(order.amount) * 100)) return res.sendStatus(400);
        if (data.payment_status !== "COMPLETE") return res.sendStatus(200);
        await pool.query("UPDATE orders SET status='paid', paid_at=COALESCE(paid_at,NOW()) WHERE payment_id=$1", [order.payment_id]);
        await deliverPaidOrder(order.payment_id);
        res.sendStatus(200);
    } catch (error) {
        console.error("Payment notification failed", error.message);
        res.sendStatus(500);
    }
});

// START SERVER
// ======================================

const PORT =

    process.env.PORT || 3000;


async function start() {
    const required = ["DATABASE_URL", "RESEND_API_KEY", "PAYFAST_MERCHANT_ID", "PAYFAST_MERCHANT_KEY", "PAYFAST_PASSPHRASE", "PAYFAST_NOTIFY_URL", "PAYFAST_RETURN_URL", "PAYFAST_CANCEL_URL", "PAYFAST_URL"];
    const missing = required.filter(name => !process.env[name]?.trim());
    if (missing.length) throw new Error(`Missing configuration: ${missing.join(", ")}`);
    if (!["https://www.payfast.co.za/eng/process", "https://sandbox.payfast.co.za/eng/process"].includes(process.env.PAYFAST_URL)) throw new Error("Invalid PayFast URL");
    await prepareDatabase();
    return app.listen(

    PORT,

    () => {
        retryPendingEmails();
        setInterval(retryPendingEmails, 60000).unref();

        console.log(

            `Veld Vibe PayFast backend running on port ${PORT}`

        );

    }

);
}
if (require.main === module) start().catch(() => {
    console.error("Configuration or database initialization failed; server not started.");
    process.exit(1);
});

module.exports = { app, normaliseCart, orderRows, generateSignature, escapeHtml, deliverPaidOrder };
