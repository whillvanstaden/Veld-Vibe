// ======================================
// VELD VIBE CHECKOUT SYSTEM
// ======================================


// ======================================
// LOAD ORDER
// ======================================

const order = JSON.parse(
    localStorage.getItem("veldVibeOrder")
) || {};


// ======================================
// LOAD CART
// ======================================

// First try the live cart.

let cart = JSON.parse(
    localStorage.getItem("veldVibeCart")
) || [];


// If the live cart is empty, restore the
// cart saved when the customer clicked
// CHECKOUT.

if (
    cart.length === 0 &&
    Array.isArray(order.cart)
) {

    cart = order.cart;

}


// ======================================
// PRODUCT DATABASE
// ======================================

// Restore normal men's prices, including carts saved during the payment test.
cart.filter(item => item.product === "mens").forEach(item => {
    Object.entries(item.sizes || {}).forEach(([name, size]) => {
        size.price = ["6XL", "7XL", "8XL", "9XL", "10XL"].includes(name) ? 1700 : 1500;
    });
});

const products = {

    mens: {
        title: "MEN'S PARKA JACKET"
    },

    ladies: {
        title: "LADIES' PARKA JACKET"
    },

    kids: {
        title: "CHILDREN'S PARKA"
    },

    chelsea: {
        title: "CHELSEA BOOT"
    },

    laceup: {
        title: "LACE-UP VELLIE"
    }

};


// ======================================
// DELIVERY
// ======================================

// Online orders are courier-only, including carts saved before this change.
const deliveryCost = 0;
const deliveryMethod = "courier";
localStorage.setItem("veldVibeDelivery", "0");
order.delivery = "0";


// ======================================
// SAVE CART
// ======================================

function saveCart() {

    localStorage.setItem(
        "veldVibeCart",
        JSON.stringify(cart)
    );

}


// ======================================
// REMOVE EMPTY PRODUCTS
// ======================================

function removeEmptyProducts() {

    cart =
        cart.filter(
            product =>
                product.sizes &&
                Object.keys(
                    product.sizes
                ).length > 0
        );

}


// ======================================
// CALCULATE CART
// ======================================

function calculateCart() {

    let quantity = 0;

    let subtotal = 0;


    cart.forEach(cartProduct => {

        Object.values(
            cartProduct.sizes
        ).forEach(item => {

            quantity +=
                Number(item.quantity);

            subtotal +=
                Number(item.price) *
                Number(item.quantity);

        });

    });


    return {

        quantity: quantity,

        subtotal: subtotal,

        total:
            subtotal +
            deliveryCost

    };

}


// ======================================
// DISPLAY DELIVERY INFORMATION
// ======================================

function updateDeliveryDisplay() {

    const deliveryAddress =
        document.getElementById(
            "deliveryAddress"
        );


    const collectionInfo =
        document.getElementById(
            "collectionInfo"
        );


    if (
        deliveryMethod === "courier"
    ) {

        // COURIER

        if (deliveryAddress) {

            deliveryAddress.style.display =
                "block";

        }


        if (collectionInfo) {

            collectionInfo.style.display =
                "none";

        }

    } else {

        // COLLECTION

        if (deliveryAddress) {

            deliveryAddress.style.display =
                "none";

        }


        if (collectionInfo) {

            collectionInfo.style.display =
                "block";

        }

    }

}


// ======================================
// DISPLAY CART
// ======================================

function displayCart() {

    const container =
        document.getElementById(
            "checkoutItems"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (cart.length === 0) {

        container.innerHTML = `

            <p>
                Your cart is empty.
            </p>

        `;


        updateTotals();

        return;

    }


    cart.forEach(
        (cartProduct, productIndex) => {

            const product =
                products[
                    cartProduct.product
                ];


            const productTitle =
                product
                    ? product.title
                    : cartProduct.product;


            const productBox =
                document.createElement(
                    "div"
                );


            productBox.className =
                "checkout-product";


            let html = `

                <h3>
                    ${productTitle}
                </h3>

            `;


            Object.keys(
                cartProduct.sizes
            ).forEach(size => {

                const item =
                    cartProduct.sizes[size];


                html += `

                    <div class="checkout-size-row">

                        <span>
                            Size ${size}
                        </span>


                        <button
                            type="button"
                            class="checkout-minus"
                            data-product="${productIndex}"
                            data-size="${size}"
                        >
                            −
                        </button>


                        <strong>
                            ${item.quantity}
                        </strong>


                        <button
                            type="button"
                            class="checkout-plus"
                            data-product="${productIndex}"
                            data-size="${size}"
                        >
                            +
                        </button>


                        <span>
                            R${item.price * item.quantity}
                        </span>


                        <button
                            type="button"
                            class="checkout-remove"
                            data-product="${productIndex}"
                            data-size="${size}"
                        >
                            Remove
                        </button>

                    </div>

                `;

            });


            productBox.innerHTML =
                html;


            container.appendChild(
                productBox
            );

        }

    );


    attachCartControls();

    updateTotals();

}


// ======================================
// CART CONTROLS
// ======================================

function attachCartControls() {


    // MINUS

    document.querySelectorAll(
        ".checkout-minus"
    ).forEach(button => {

        button.onclick = function () {

            const productIndex =
                Number(
                    this.dataset.product
                );


            const size =
                this.dataset.size;


            cart[productIndex]
                .sizes[size]
                .quantity--;


            if (
                cart[productIndex]
                    .sizes[size]
                    .quantity <= 0
            ) {

                delete cart[
                    productIndex
                ].sizes[size];

            }


            removeEmptyProducts();

            saveCart();

            displayCart();

        };

    });


    // PLUS

    document.querySelectorAll(
        ".checkout-plus"
    ).forEach(button => {

        button.onclick = function () {

            const productIndex =
                Number(
                    this.dataset.product
                );


            const size =
                this.dataset.size;


            cart[productIndex]
                .sizes[size]
                .quantity++;


            saveCart();

            displayCart();

        };

    });


    // REMOVE

    document.querySelectorAll(
        ".checkout-remove"
    ).forEach(button => {

        button.onclick = function () {

            const productIndex =
                Number(
                    this.dataset.product
                );


            const size =
                this.dataset.size;


            delete cart[
                productIndex
            ].sizes[size];


            removeEmptyProducts();

            saveCart();

            displayCart();

        };

    });

}


// ======================================
// UPDATE TOTALS
// ======================================

function updateTotals() {

    const totals =
        calculateCart();


    const quantityElement =
        document.getElementById(
            "checkoutQuantity"
        );


    const subtotalElement =
        document.getElementById(
            "checkoutSubtotal"
        );


    const totalElement =
        document.getElementById(
            "checkoutTotal"
        );


    const deliveryElement =
        document.getElementById(
            "checkoutDelivery"
        );


    if (quantityElement) {

        quantityElement.innerHTML =
            totals.quantity;

    }


    if (subtotalElement) {

        subtotalElement.innerHTML =
            "R" + totals.subtotal;

    }


    if (totalElement) {

        totalElement.innerHTML =
            "R" + totals.total;

    }


    if (deliveryElement) {

        deliveryElement.innerHTML =
            "FREE";

    }


    updateDeliveryDisplay();

    updateCheckoutButton();

}


// ======================================
// UPDATE CHECKOUT BUTTON
// ======================================

function updateCheckoutButton() {

    const checkoutButton =
        document.getElementById(
            "checkoutButton"
        );


    if (!checkoutButton) {

        return;

    }


    if (
        deliveryMethod === "courier"
    ) {

        checkoutButton.innerHTML =
            "PAY SECURELY";

    } else {

        checkoutButton.innerHTML =
            "SUBMIT COLLECTION REQUEST";

    }

}


// ======================================
// EDIT CART
// ======================================

const backToCart =
    document.getElementById(
        "backToCart"
    );


if (backToCart) {

    backToCart.onclick =
        function () {

            // Make sure the current cart
            // is saved before returning.

            saveCart();


            localStorage.setItem(
                "veldVibeOpenCart",
                "true"
            );


            window.location.href =
                "index.html";

        };

}


// ======================================
// CREATE PAYFAST FORM
// ======================================

function submitPayFastPayment(
    paymentUrl,
    paymentData
) {

    const form =
        document.createElement(
            "form"
        );


    form.method =
        "POST";


    form.action =
        paymentUrl;


    Object.keys(
        paymentData
    ).forEach(key => {

        // Do not send blank values.
        // The submitted fields must match
        // the fields used to create
        // the PayFast signature.

        if (
            paymentData[key] === "" ||
            paymentData[key] === null ||
            paymentData[key] === undefined
        ) {

            return;

        }


        const input =
            document.createElement(
                "input"
            );


        input.type =
            "hidden";


        input.name =
            key;


        input.value =
            paymentData[key];


        form.appendChild(
            input
        );

    });


    document.body.appendChild(
        form
    );


    form.submit();

}
// ======================================
// CHECKOUT BUTTON
// ======================================

const checkoutButton =
    document.getElementById(
        "checkoutButton"
    );


if (checkoutButton) {

    checkoutButton.onclick =
        async function () {

            if (
                cart.length === 0
            ) {

                alert(
                    "Your cart is empty."
                );

                return;

            }


            // ============================
            // GET CUSTOMER DETAILS
            // ============================

            const firstName =
                document.getElementById(
                    "firstName"
                );


            const surname =
                document.getElementById(
                    "surname"
                );


            const phoneNumber =
                document.getElementById(
                    "phoneNumber"
                );


            const email =
                document.getElementById(
                    "email"
                );


            // ============================
            // VALIDATE CUSTOMER DETAILS
            // ============================

            if (
                !firstName ||
                firstName.value.trim() === ""
            ) {

                alert(
                    "Please enter your first name."
                );

                firstName.focus();

                return;

            }


            if (
                !surname ||
                surname.value.trim() === ""
            ) {

                alert(
                    "Please enter your surname."
                );

                surname.focus();

                return;

            }


            if (
                !phoneNumber ||
                phoneNumber.value.trim() === ""
            ) {

                alert(
                    "Please enter your phone number."
                );

                phoneNumber.focus();

                return;

            }


            // ============================
            // COURIER PAYMENT
            // ============================

            if (
                deliveryMethod === "courier"
            ) {

                const address =
                    document.getElementById(
                        "address"
                    );


                if (
                    !address ||
                    address.value.trim() === ""
                ) {

                    alert(
                        "Please enter your delivery address."
                    );

                    address.focus();

                    return;

                }


                // ------------------------
                // CALCULATE TOTAL
                // ------------------------

                const totals =
                    calculateCart();


                // ------------------------
                // CREATE ORDER NAME
                // ------------------------

                const itemName =
                    `Veld Vibe Order - ${totals.quantity} item(s)`;


                // ------------------------
                // DISABLE BUTTON
                // ------------------------

                checkoutButton.disabled =
                    true;


                checkoutButton.innerHTML =
                    "CONNECTING TO PAYFAST...";


                try {

                    // --------------------
                    // SEND PAYMENT REQUEST
                    // TO LOCAL BACKEND
                    // --------------------

                    const response =
                       await fetch(
    "https://veld-vibe.onrender.com/create-payment",
                            {

                                method:
                                    "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({

                                        firstName:
                                            firstName.value.trim(),

                                        surname:
                                            surname.value.trim(),

                                        email:
                                            email
                                                ? email.value.trim()
                                                : "",

                                        phoneNumber:
                                            phoneNumber.value.trim(),

                                        amount:
                                            totals.total,

                                        itemName:
                                            itemName

                                    })

                            }
                        );


                    const result =
                        await response.json();


                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        throw new Error(

                            result.message ||
                            "Unable to create payment."

                        );

                    }


                    // --------------------
                    // SAVE CUSTOMER ORDER
                    // DETAILS LOCALLY
                    // --------------------

                    localStorage.setItem(

                        "veldVibeCustomerOrder",

                        JSON.stringify({

                            firstName:
                                firstName.value.trim(),

                            surname:
                                surname.value.trim(),

                            phoneNumber:
                                phoneNumber.value.trim(),

                            email:
                                email
                                    ? email.value.trim()
                                    : "",

                            address:
                                address.value.trim(),

                            cart:
                                cart,

                            delivery:
                                deliveryCost,

                            total:
                                totals.total

                        })

                    );


                    // --------------------
                    // SEND CUSTOMER
                    // TO PAYFAST
                    // --------------------

                    submitPayFastPayment(

                        result.paymentUrl,

                        result.paymentData

                    );


                }

                catch (error) {

                    console.error(
                        "PayFast error:",
                        error
                    );


                    alert(

                        "Unable to connect to the payment system. " +
                        "Please make sure the PayFast backend is running."

                    );


                    checkoutButton.disabled =
                        false;


                    checkoutButton.innerHTML =
                        "PAY SECURELY";

                }


                return;

            }


            // ============================
            // COLLECTION
            // ============================

            alert(
                "Your collection request is ready to submit."
            );

        };

}


// ======================================
// INITIALISE CHECKOUT
// ======================================

displayCart();

updateTotals();
