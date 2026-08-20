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

// Preserve 0 for Collection.
// Do NOT use "|| 100" here because
// JavaScript treats 0 as false.

let deliveryCost;

if (
    order.delivery !== undefined &&
    order.delivery !== null
) {

    deliveryCost =
        Number(order.delivery);

} else {

    const savedDelivery =
        localStorage.getItem(
            "veldVibeDelivery"
        );

    if (savedDelivery !== null) {

        deliveryCost =
            Number(savedDelivery);

    } else {

        deliveryCost = 100;

    }

}


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
        deliveryCost === 100
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
            deliveryCost === 100
                ? "Courier (+R100)"
                : "Collection - Alberton";

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
        deliveryCost === 100
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
// CHECKOUT BUTTON
// ======================================

const checkoutButton =
    document.getElementById(
        "checkoutButton"
    );


if (checkoutButton) {

    checkoutButton.onclick =
        function () {

            if (
                cart.length === 0
            ) {

                alert(
                    "Your cart is empty."
                );

                return;

            }


            // COURIER

            if (
                deliveryCost === 100
            ) {

                const address =
                    document.getElementById(
                        "address"
                    );


                if (
                    address &&
                    address.value.trim() === ""
                ) {

                    alert(
                        "Please enter your delivery address."
                    );

                    address.focus();

                    return;

                }


                alert(
                    "Courier payment will continue here."
                );

                return;

            }


            // COLLECTION

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