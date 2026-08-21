const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

require("dotenv").config();

const app = express();

app.use(cors());

app.use(express.json());


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


    console.log(

        "\n======================================"

    );


    console.log(

        "PAYFAST PARAMETER STRING:"

    );


    console.log(

        parameterString

    );


    console.log(

        "======================================\n"

    );


    const signature =

        crypto

            .createHash("md5")

            .update(

                parameterString

            )

            .digest("hex");


    console.log(

        "PAYFAST SIGNATURE:"

    );


    console.log(

        signature

    );


    return signature;

}


// ======================================
// CREATE PAYMENT
// ======================================

app.post(

    "/create-payment",

    (req, res) => {

        try {

            const {

                firstName,

                surname,

                email,

                phoneNumber,

                amount,

                itemName

            } = req.body;


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

                    `VELDVIBE-${Date.now()}`,


                amount:

                    Number(amount)
                        .toFixed(2),


                item_name:

                    itemName

            };


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


            console.log(

                "\nPAYFAST DATA:"

            );


            console.log(

                paymentData

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

            console.error(

                "\nPAYFAST ERROR:",

                error

            );


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
// START SERVER
// ======================================

const PORT =

    process.env.PORT || 3000;


app.listen(

    PORT,

    () => {

        console.log(

            `Veld Vibe PayFast backend running on port ${PORT}`

        );

    }

);