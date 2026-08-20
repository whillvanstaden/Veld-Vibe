require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;


// ================================
// PAYFAST CONFIGURATION
// ================================

const PAYFAST_MERCHANT_ID =
    process.env.PAYFAST_MERCHANT_ID;

const PAYFAST_MERCHANT_KEY =
    process.env.PAYFAST_MERCHANT_KEY;

const PAYFAST_PASSPHRASE =
    process.env.PAYFAST_PASSPHRASE || "";

const PAYFAST_URL =
    process.env.PAYFAST_URL;

const PAYFAST_RETURN_URL =
    process.env.PAYFAST_RETURN_URL;

const PAYFAST_CANCEL_URL =
    process.env.PAYFAST_CANCEL_URL;


// ================================
// CREATE PAYFAST SIGNATURE
// ================================

function generateSignature(data, passphrase = "") {

    let parameterString = "";

    for (const key in data) {

        if (
            Object.prototype.hasOwnProperty.call(data, key) &&
            data[key] !== ""
        ) {

            parameterString +=
                `${key}=${encodeURIComponent(
                    String(data[key]).trim()
                ).replace(/%20/g, "+")}&`;

        }

    }

    parameterString =
        parameterString.slice(0, -1);

    if (passphrase) {

        parameterString +=
            `&passphrase=${encodeURIComponent(
                passphrase.trim()
            ).replace(/%20/g, "+")}`;

    }

    return crypto
        .createHash("md5")
        .update(parameterString)
        .digest("hex");

}


// ================================
// CREATE PAYMENT
// ================================

app.post("/create-payment", (req, res) => {

    try {

        const {
            firstName,
            surname,
            email,
            phoneNumber,
            amount,
            itemName
        } = req.body;


        if (!amount || Number(amount) <= 0) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment amount."

            });

        }


        const paymentData = {

            merchant_id:
                PAYFAST_MERCHANT_ID,

            merchant_key:
                PAYFAST_MERCHANT_KEY,

            return_url:
                PAYFAST_RETURN_URL,

            cancel_url:
                PAYFAST_CANCEL_URL,

            name_first:
                firstName || "",

            name_last:
                surname || "",

            email_address:
                email || "",

            cell_number:
                phoneNumber || "",

            m_payment_id:
                `VELDVIBE-${Date.now()}`,

            amount:
                Number(amount).toFixed(2),

            item_name:
                itemName || "Veld Vibe Order"

        };


        const signature =
            generateSignature(
                paymentData,
                PAYFAST_PASSPHRASE
            );

        paymentData.signature =
            signature;


        res.json({

            success: true,

            paymentUrl:
                PAYFAST_URL,

            paymentData:
                paymentData

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Unable to create PayFast payment."

        });

    }

});


// ================================
// TEST SERVER
// ================================

app.get("/", (req, res) => {

    res.send(
        "Veld Vibe PayFast backend is running."
    );

});


// ================================
// START SERVER
// ================================

app.listen(PORT, () => {

    console.log(
        `Veld Vibe PayFast backend running on port ${PORT}`
    );

});