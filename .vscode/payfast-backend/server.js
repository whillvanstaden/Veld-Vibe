const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

app.use(cors());

app.use(express.json());


// ======================================
// PAYFAST SIGNATURE
// ======================================

function generateSignature(data, passphrase = null) {

    const pairs = [];


    Object.keys(data).forEach((key) => {

        const value = data[key];


        // PayFast requires blank values
        // to be excluded from the signature
        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            let encodedValue =
                encodeURIComponent(
                    String(value).trim()
                );


            // PayFast requires spaces as +
            encodedValue =
                encodedValue.replace(
                    /%20/g,
                    "+"
                );


            pairs.push(
                `${key}=${encodedValue}`
            );

        }

    });


    if (
        passphrase &&
        passphrase.trim() !== ""
    ) {

        let encodedPassphrase =
            encodeURIComponent(
                passphrase.trim()
            );


        encodedPassphrase =
            encodedPassphrase.replace(
                /%20/g,
                "+"
            );


        pairs.push(
            `passphrase=${encodedPassphrase}`
        );

    }


    const parameterString =
        pairs.join("&");


    console.log(
        "\nPAYFAST PARAMETER STRING:\n",
        parameterString
    );


    const signature =
        crypto
            .createHash("md5")
            .update(parameterString)
            .digest("hex");


    console.log(
        "\nPAYFAST SIGNATURE:\n",
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


            const paymentData = {

                // ------------------
                // MERCHANT DETAILS
                // ------------------

                merchant_id:
                    process.env
                        .PAYFAST_MERCHANT_ID,

                merchant_key:
                    process.env
                        .PAYFAST_MERCHANT_KEY,


                // ------------------
                // RETURN URLS
                // ------------------

                return_url:
                    process.env
                        .PAYFAST_RETURN_URL,

                cancel_url:
                    process.env
                        .PAYFAST_CANCEL_URL,


                // ------------------
                // CUSTOMER DETAILS
                // ------------------

                name_first:
                    firstName || "",

                name_last:
                    surname || "",

                email_address:
                    email || "",

                cell_number:
                    phoneNumber || "",


                // ------------------
                // PAYMENT DETAILS
                // ------------------

                m_payment_id:
                    `VELDVIBE-${Date.now()}`,

                amount:
                    Number(amount)
                        .toFixed(2),

                item_name:
                    itemName

            };


            // Add notify URL only
            // if one exists

            if (
                process.env
                    .PAYFAST_NOTIFY_URL &&
                process.env
                    .PAYFAST_NOTIFY_URL.trim() !== ""
            ) {

                paymentData.notify_url =
                    process.env
                        .PAYFAST_NOTIFY_URL;

            }


            // ------------------
            // GENERATE SIGNATURE
            // ------------------

            const signature =
                generateSignature(

                    paymentData,

                    process.env
                        .PAYFAST_PASSPHRASE

                );


            paymentData.signature =
                signature;


            console.log(
                "\nPAYFAST DATA:\n",
                paymentData
            );


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
                "PAYFAST ERROR:",
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