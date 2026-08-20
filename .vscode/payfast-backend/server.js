const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = 3000;


// ========================================
// PAYFAST SANDBOX CONFIGURATION
// ========================================

const PAYFAST_MERCHANT_ID = "10000100";

const PAYFAST_MERCHANT_KEY = "46f0cd694581a";

const PAYFAST_PASSPHRASE = "jt7NOE43FZPn";


const PAYFAST_URL =
    "https://sandbox.payfast.co.za/eng/process";


// ========================================
// CREATE PAYFAST SIGNATURE
// ========================================

function generateSignature(data, passphrase = "") {

    let parameterString = "";


    for (const key in data) {

        if (
            Object.prototype.hasOwnProperty.call(
                data,
                key
            ) &&
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


        // -------------------------------
        // VALIDATE PAYMENT AMOUNT
        // -------------------------------

        const paymentAmount =
            Number(amount);


        if (
            !Number.isFinite(paymentAmount) ||
            paymentAmount < 5
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment amount."

            });

        }


        // -------------------------------
        // CREATE PAYMENT DATA
        // -------------------------------

        const paymentData = {


            // MERCHANT DETAILS

            merchant_id:
                PAYFAST_MERCHANT_ID,

            merchant_key:
                PAYFAST_MERCHANT_KEY,


            // RETURN URLS

            return_url:
                "https://veldvibesa.co.za/payment-success.html",

            cancel_url:
                "https://veldvibesa.co.za/payment-cancelled.html",


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
                paymentAmount.toFixed(2),

            item_name:
                itemName ||
                "Veld Vibe Order"

        };


        // -------------------------------
        // CREATE SIGNATURE
        // -------------------------------

        paymentData.signature =
            generateSignature(
                paymentData,
                PAYFAST_PASSPHRASE
            );


        // -------------------------------
        // SEND DATA BACK TO WEBSITE
        // -------------------------------

        res.json({

            success: true,

            paymentUrl:
                PAYFAST_URL,

            paymentData:
                paymentData

        });


    }

    catch (error) {

        console.error(
            "Payment creation error:",
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