// ======================================
// VELD VIBE PAYFAST BACKEND
// worker.js
// ======================================


export default {

    async fetch(request, env) {


        // ======================================
        // CORS HEADERS
        // ======================================

        const headers = {

            "Access-Control-Allow-Origin":
                "https://veldvibesa.co.za",

            "Access-Control-Allow-Methods":
                "POST, OPTIONS",

            "Access-Control-Allow-Headers":
                "Content-Type",

            "Content-Type":
                "application/json"

        };


        // ======================================
        // HANDLE OPTIONS REQUEST
        // ======================================

        if (request.method === "OPTIONS") {

            return new Response(
                null,
                {
                    headers
                }
            );

        }


        const url =
            new URL(request.url);


        // ======================================
        // CREATE PAYFAST PAYMENT
        // ======================================

        if (
            url.pathname ===
            "/create-payment"
        ) {


            if (
                request.method !== "POST"
            ) {

                return new Response(
                    JSON.stringify({
                        error:
                            "Method not allowed."
                    }),
                    {
                        status: 405,
                        headers
                    }
                );

            }


            try {


                // ======================================
                // RECEIVE ORDER
                // ======================================

                const order =
                    await request.json();


                // ======================================
                // BASIC VALIDATION
                // ======================================

                if (
                    !order ||
                    !Array.isArray(order.cart) ||
                    order.cart.length === 0
                ) {

                    return new Response(
                        JSON.stringify({
                            error:
                                "Your cart is empty or invalid."
                        }),
                        {
                            status: 400,
                            headers
                        }
                    );

                }


                // ======================================
                // CALCULATE SUBTOTAL
                // ON THE SERVER
                // ======================================

                let subtotal = 0;


                order.cart.forEach(
                    product => {


                        if (
                            !product.sizes
                        ) {

                            return;

                        }


                        Object.values(
                            product.sizes
                        ).forEach(
                            item => {


                                const price =
                                    Number(
                                        item.price
                                    );


                                const quantity =
                                    Number(
                                        item.quantity
                                    );


                                if (
                                    !Number.isFinite(price) ||
                                    !Number.isFinite(quantity) ||
                                    price < 0 ||
                                    quantity <= 0
                                ) {

                                    return;

                                }


                                subtotal +=
                                    price *
                                    quantity;

                            }
                        );

                    }
                );


                // ======================================
                // COURIER VALIDATION
                // ======================================

                const deliveryCost =
                    Number(
                        order.delivery
                    );


                if (
                    deliveryCost !== 100
                ) {

                    return new Response(
                        JSON.stringify({
                            error:
                                "Online payment is currently only available for courier orders."
                        }),
                        {
                            status: 400,
                            headers
                        }
                    );

                }


                // ======================================
                // VALIDATE CUSTOMER DETAILS
                // ======================================

                if (
                    !order.firstName ||
                    !order.surname ||
                    !order.phoneNumber ||
                    !order.address
                ) {

                    return new Response(
                        JSON.stringify({
                            error:
                                "Please complete all required customer and delivery details."
                        }),
                        {
                            status: 400,
                            headers
                        }
                    );

                }


                // ======================================
                // FINAL TOTAL
                // ======================================

                const total =
                    subtotal +
                    deliveryCost;


                if (
                    total <= 0
                ) {

                    return new Response(
                        JSON.stringify({
                            error:
                                "Invalid order total."
                        }),
                        {
                            status: 400,
                            headers
                        }
                    );

                }


                // ======================================
                // CREATE UNIQUE PAYMENT ID
                // ======================================

                const paymentId =
                    "VV-" +
                    Date.now() +
                    "-" +
                    crypto.randomUUID()
                        .slice(0, 8);


                // ======================================
                // PAYFAST DATA
                // ======================================

                const data = {

                    merchant_id:
                        env.PAYFAST_MERCHANT_ID,

                    merchant_key:
                        env.PAYFAST_MERCHANT_KEY,

                    return_url:
                        "https://veldvibesa.co.za/payment-success.html",

                    cancel_url:
                        "https://veldvibesa.co.za/payment-cancelled.html",

                    notify_url:
                        env.WORKER_URL +
                        "/payfast-itn",

                    name_first:
                        String(
                            order.firstName
                        ).trim(),

                    name_last:
                        String(
                            order.surname
                        ).trim(),

                    email_address:
                        order.email
                            ? String(
                                order.email
                            ).trim()
                            : "",

                    m_payment_id:
                        paymentId,

                    amount:
                        total.toFixed(2),

                    item_name:
                        "Veld Vibe Order " +
                        paymentId

                };


                // ======================================
                // GENERATE PAYFAST SIGNATURE
                // ======================================

                data.signature =
                    await generateSignature(
                        data,
                        env.PAYFAST_PASSPHRASE
                    );


                // ======================================
                // RETURN PAYFAST FORM DATA
                // ======================================

                return new Response(
                    JSON.stringify({

                        action:

                            env.PAYFAST_MODE ===
                            "sandbox"

                                ? "https://sandbox.payfast.co.za/eng/process"

                                : "https://www.payfast.co.za/eng/process",

                        data:
                            data

                    }),
                    {
                        status: 200,
                        headers
                    }
                );


            } catch (error) {


                console.error(
                    "Payment creation error:",
                    error
                );


                return new Response(
                    JSON.stringify({
                        error:
                            "Unable to create payment."
                    }),
                    {
                        status: 500,
                        headers
                    }
                );

            }

        }


        // ======================================
        // PAYFAST ITN ENDPOINT
        // PLACEHOLDER FOR NOW
        // ======================================

        if (
            url.pathname ===
            "/payfast-itn"
        ) {

            return new Response(
                "ITN endpoint ready",
                {
                    status: 200
                }
            );

        }


        // ======================================
        // HEALTH CHECK
        // ======================================

        if (
            url.pathname ===
            "/"
        ) {

            return new Response(
                JSON.stringify({

                    status:
                        "Veld Vibe payment backend is running."

                }),
                {
                    status: 200,
                    headers
                }
            );

        }


        // ======================================
        // NOT FOUND
        // ======================================

        return new Response(
            JSON.stringify({
                error:
                    "Not found."
            }),
            {
                status: 404,
                headers
            }
        );

    }

};


// ======================================
// GENERATE PAYFAST SIGNATURE
// ======================================

async function generateSignature(
    data,
    passphrase
) {


    const parameters = [];


    for (
        const [key, value]
        of Object.entries(data)
    ) {


        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            parameters.push(

                key +
                "=" +
                encodeURIComponent(
                    String(value)
                        .trim()
                )
                    .replace(
                        /%20/g,
                        "+"
                    )

            );

        }

    }


    // ======================================
    // ADD PAYFAST PASSPHRASE
    // ======================================

    if (
        passphrase
    ) {

        parameters.push(

            "passphrase=" +
            encodeURIComponent(
                String(
                    passphrase
                ).trim()
            )
                .replace(
                    /%20/g,
                    "+"
                )

        );

    }


    const parameterString =
        parameters.join("&");


    // ======================================
    // CREATE MD5 HASH
    // ======================================

    const encoder =
        new TextEncoder();


    const encodedData =
        encoder.encode(
            parameterString
        );


    const hashBuffer =
        await crypto.subtle.digest(
            "MD5",
            encodedData
        );


    const hashArray =
        Array.from(
            new Uint8Array(
                hashBuffer
            )
        );


    return hashArray
        .map(
            byte =>

                byte
                    .toString(16)
                    .padStart(
                        2,
                        "0"
                    )

        )
        .join("");

}