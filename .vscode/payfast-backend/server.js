require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;


// ========================================
// PAYFAST SIGNATURE
// ========================================

function generateSignature(data, passphrase = "") {

    const parameterString = Object.entries(data)

        // Remove empty values
        .filter(([key, value]) =>
            value !== "" &&
            value !== null &&
            value !== undefined
        )

        // Build PayFast parameter string
        .map(([key, value]) => {

            return (
                key +
                "=" +
                encodeURIComponent(
                    String(value).trim()
                ).replace(/%20/g, "+")
            );

        })

        .join("&");


    let finalString = parameterString;


    // Only add passphrase if one exists
    if (passphrase && passphrase.trim() !== "") {

        finalString +=
            "&passphrase=" +
            encodeURIComponent(
                passphrase.trim()
            ).replace(/%20/g, "+");

    }


    // DEBUG
    console.log(
        "\nPAYFAST STRING:\n",
        finalString
    );


    const signature = crypto
        .createHash("md5")
        .update(finalString)
        .digest("hex");


    console.log(
        "\nPAYFAST SIGNATURE:\n",
        signature
    );


    return signature;

}


// ========================================
// CREATE PAYMENT
// ========================================

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


        // IMPORTANT:
        // Keep this exact PayFast field order.

        const paymentData = {

            // Merchant details
            merchant_id:
                process.env.PAYFAST_MERCHANT_ID,

            merchant_key:
                process.env.PAYFAST_MERCHANT_KEY,


            // Transaction URLs
            return_url:
                process.env.PAYFAST_RETURN_URL,

            cancel_url:
                process.env.PAYFAST_CANCEL_URL,


            // Customer details
            name_first:
                firstName || "",

            name_last:
                surname || "",

            email_address:
                email || "",

            cell_number:
                phoneNumber || "",


            // Transaction details
            m_payment_id:
                `VELDVIBE-${Date.now()}`,

            amount:
                Number(amount).toFixed(2),

            item_name:
                itemName || "Veld Vibe Order"

        };


        // Generate signature
        const signature =
            generateSignature(
                paymentData,
                process.env.PAYFAST_PASSPHRASE
            );


        // Add signature AFTER generation
        paymentData.signature =
            signature;


        console.log(
            "\nPAYFAST DATA:"
        );

        console.log(
            paymentData
        );


        res.json({

            success: true,

            paymentUrl:
                process.env.PAYFAST_URL,

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

            success: false,

            message:
                "Unable to create PayFast payment."

        });

    }

});


// ========================================
// TEST SERVER
// ========================================

app.get("/", (req, res) => {

    res.send(
        "Veld Vibe PayFast backend is running."
    );

});


// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log(
        `Veld Vibe PayFast backend running on port ${PORT}`
    );

});