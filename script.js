// ======================================
// VELD VIBE SHOPPING SYSTEM
// ======================================

const whatsappNumber = "27837818424";
// ======================================
// PRODUCT DATABASE
// ======================================

const products = {

    mens:{

        title:"BUY MEN'S PARKA JACKET",

        image:"images/Mens Parka Jackets Side.png",

        sizes:[
            {name:"S",price:1500},
            {name:"M",price:1500},
            {name:"L",price:1500},
            {name:"XL",price:1500},
            {name:"2XL",price:1500},
            {name:"3XL",price:1500},
            {name:"4XL",price:1500},
            {name:"5XL",price:1500},

            {name:"6XL",price:1700},
            {name:"7XL",price:1700},
            {name:"8XL",price:1700},
            {name:"9XL",price:1700},
            {name:"10XL",price:1700}

        ]

    },

    ladies:{

        title:"BUY LADIES' PARKA JACKET",

        image:"images/Ladies Parka Jackets.png",

        sizes:[
            {name:"3XS",price:1480},
            {name:"2XS",price:1480},
            {name:"XS",price:1480},

            {name:"S",price:1500},
            {name:"M",price:1500},
            {name:"L",price:1500},
            {name:"XL",price:1500},
            {name:"2XL",price:1500},
            {name:"3XL",price:1500},
            {name:"4XL",price:1500},
            {name:"5XL",price:1500},

            {name:"6XL",price:1700},
            {name:"7XL",price:1700},
            {name:"8XL",price:1700},
            {name:"9XL",price:1700},
            {name:"10XL",price:1700}

        ]

    },

    kids:{

        title:"BUY CHILDREN'S PARKA",

        image:"images/Parka kids.png",

        sizes:[
            {name:"5XS",price:1400},
            {name:"4XS",price:1400},
            {name:"3XS",price:1400},
            {name:"2XS",price:1400},
            {name:"XS",price:1400},

            {name:"S",price:1500},
            {name:"M",price:1500},
            {name:"L",price:1500},
            {name:"XL",price:1500},
            {name:"2XL",price:1500},
            {name:"3XL",price:1500},
            {name:"4XL",price:1500}

        ]

    },
chelsea: {

    title: "BUY CHELSEA BOOT",

    image: "images/Slip-on Chelsea Boot - Tan.png",

    sizes: [
        {name: "5", price: 990},
        {name: "6", price: 990},
        {name: "7", price: 990},
        {name: "8", price: 990},
        {name: "9", price: 990},
        {name: "10", price: 990}
    ]

},

laceup: {

    title: "BUY LACE-UP VELLIE",

    image: "images/Lace-up Vellie Shoe.png",

    sizes: [
        {name: "5", price: 850},
        {name: "6", price: 850},
        {name: "7", price: 850},
        {name: "8", price: 850},
        {name: "9", price: 850},
        {name: "10", price: 850}
    ]

}
};
let selectedProduct = "";
let selectedSizes = {};


// ======================================
// CART
// ======================================

let cart = JSON.parse(
    localStorage.getItem("veldVibeCart")
) || [];

// Refresh saved men's cart items using the normal catalogue prices.
cart.filter(item => item.product === "mens").forEach(item => {
    Object.entries(item.sizes || {}).forEach(([name, size]) => {
        const catalogueSize = products.mens.sizes.find(entry => entry.name === name);
        if (catalogueSize) size.price = catalogueSize.price;
    });
});

// ======================================
// SAVE CART
// ======================================

function saveCart() {

    localStorage.setItem(
        "veldVibeCart",
        JSON.stringify(cart)
    );

    updateCartButton();

}


// ======================================
// OPEN PRODUCT POPUP
// ======================================

function openBuyModal(product) {

    const item = products[product];

    selectedProduct = product;
    selectedSizes = {};

    document.getElementById("buyModal").style.display = "flex";

    document.getElementById("continueCheckout").disabled = true;

    document.getElementById("continueCheckout").innerHTML =
        "ADD TO CART";

    document.getElementById("modalTitle").innerHTML =
        item.title;

    document.getElementById("modalImage").src =
        item.image;

    document.getElementById("modalImage").alt =
        item.title;

    const sizeContainer =
        document.getElementById("sizeOptions");

    sizeContainer.innerHTML = "";


    item.sizes.forEach(size => {

        const row =
            document.createElement("div");

        row.className =
            "size-selection-row";


        // SIZE

        const sizeButton =
            document.createElement("button");

        sizeButton.type = "button";

        sizeButton.className =
            "size-btn";

        sizeButton.innerHTML =
            size.name;


        // MINUS

        const minusButton =
            document.createElement("button");

        minusButton.type = "button";

        minusButton.className =
            "size-minus";

        minusButton.innerHTML =
            "−";


        // QUANTITY

        const quantityDisplay =
            document.createElement("span");

        quantityDisplay.className =
            "size-quantity";

        quantityDisplay.innerHTML =
            "0";


        // PLUS

        const plusButton =
            document.createElement("button");

        plusButton.type = "button";

        plusButton.className =
            "size-plus";

        plusButton.innerHTML =
            "+";


        // UPDATE THIS SIZE

        function updateSizeDisplay() {

            const selected =
                selectedSizes[size.name];

            const quantity =
                selected
                    ? selected.quantity
                    : 0;

            quantityDisplay.innerHTML =
                quantity;

            if (quantity > 0) {

                sizeButton.classList.add("active");

            } else {

                sizeButton.classList.remove("active");

            }

            updateProductTotal();

        }


        // ADD ONE OF THIS SIZE

        function addSize() {

            if (!selectedSizes[size.name]) {

                selectedSizes[size.name] = {

                    quantity: 1,

                    price: Number(size.price)

                };

            } else {

                selectedSizes[size.name].quantity++;

            }

            updateSizeDisplay();

        }


        // REMOVE ONE OF THIS SIZE

        function removeSize() {

            if (!selectedSizes[size.name]) {

                return;

            }

            selectedSizes[size.name].quantity--;


            if (
                selectedSizes[size.name].quantity <= 0
            ) {

                delete selectedSizes[size.name];

            }

            updateSizeDisplay();

        }


        // SIZE BUTTON = ADD ONE

        sizeButton.addEventListener(
            "click",
            addSize
        );


        // PLUS = ADD ONE

        plusButton.addEventListener(
            "click",
            addSize
        );


        // MINUS = REMOVE ONE

        minusButton.addEventListener(
            "click",
            removeSize
        );


        row.appendChild(sizeButton);

        row.appendChild(minusButton);

        row.appendChild(quantityDisplay);

        row.appendChild(plusButton);


        sizeContainer.appendChild(row);

    });


    updateProductTotal();

}


// ======================================
// UPDATE PRODUCT TOTAL
// ======================================

function updateProductTotal() {

    let totalQuantity = 0;

    let productTotal = 0;


    Object.keys(selectedSizes).forEach(size => {

        const item =
            selectedSizes[size];

        totalQuantity +=
            item.quantity;

        productTotal +=
            item.price * item.quantity;

    });


    const quantityElement =
        document.getElementById("quantityValue");

    const totalElement =
        document.getElementById("orderTotal");


    if (quantityElement) {

        quantityElement.innerHTML =
            totalQuantity;

    }


    if (totalElement) {

        totalElement.innerHTML =
            "R" + productTotal;

    }


    const checkoutButton =
        document.getElementById("continueCheckout");


    if (checkoutButton) {

        checkoutButton.disabled =
            totalQuantity === 0;

    }

}


// ======================================
// CLOSE PRODUCT POPUP
// ======================================

const closeBuyModal =
    document.querySelector(".close-modal");


if (closeBuyModal) {

    closeBuyModal.onclick = function () {

        document.getElementById("buyModal").style.display =
            "none";

    };

}


window.addEventListener(
    "click",
    function (event) {

        const modal =
            document.getElementById("buyModal");

        if (
            event.target === modal
        ) {

            modal.style.display =
                "none";

        }

    }
);


// ======================================
// ADD PRODUCT TO CART
// ======================================

const addToCartButton =
    document.getElementById("continueCheckout");


if (addToCartButton) {

    addToCartButton.onclick = function () {

        if (
            Object.keys(selectedSizes).length === 0
        ) {

            return;

        }


        // Get the delivery method selected
        // by the customer.

        const deliveryInput =
            document.querySelector(
                'input[name="delivery"]:checked'
            );


        const delivery = 0; // Free courier shipping for online orders.


        // Find this product in the cart.

        let cartProduct =
            cart.find(
                item =>
                    item.product === selectedProduct
            );


        // Create the product if it
        // isn't already in the cart.

        if (!cartProduct) {

            cartProduct = {

                product: selectedProduct,

                sizes: {}

            };

            cart.push(cartProduct);

        }


        // Add each selected size.

        Object.keys(selectedSizes).forEach(size => {

            const selected =
                selectedSizes[size];


            if (
                cartProduct.sizes[size]
            ) {

                cartProduct.sizes[size].quantity +=
                    selected.quantity;

            } else {

                cartProduct.sizes[size] = {

                    quantity:
                        selected.quantity,

                    price:
                        selected.price

                };

            }

        });


        // Save the delivery method
        // for this order.

        localStorage.setItem(
            "veldVibeDelivery",
            String(delivery)
        );


        saveCart();


        // Close the product popup.

        document.getElementById(
            "buyModal"
        ).style.display = "none";


        // Open the cart.

        openCart();

    };

}
// ======================================
// OPEN CART
// ======================================

function openCart() {

    let cartModal =
        document.getElementById("cartModal");


    if (!cartModal) {

        createCartModal();

        cartModal =
            document.getElementById("cartModal");

    }


    renderCart();

    cartModal.style.display =
        "flex";

}


// ======================================
// CREATE CART
// ======================================

function createCartModal() {

    const modal =
        document.createElement("div");

    modal.id =
        "cartModal";

    modal.className =
        "cart-modal";


    modal.innerHTML = `

        <div class="cart-container">

            <button
                class="cart-close"
                id="cartClose"
            >
                ×
            </button>

            <h2>YOUR CART</h2>

            <div id="cartItems"></div>

            <div class="cart-summary">

                <p>
                    Total items:
                    <strong id="cartQuantity">0</strong>
                </p>

                <p>
                    Subtotal:
                    <strong id="cartSubtotal">R0</strong>
                </p>

            </div>

            <div class="cart-buttons">

                <button
                    class="action-button action-button--secondary"
                    id="continueShopping"
                >
                    CONTINUE SHOPPING
                </button>

                <button
                    class="action-button"
                    id="cartCheckout"
                >
                    CHECKOUT
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    document.getElementById(
        "cartClose"
    ).onclick = function () {

        modal.style.display =
            "none";

    };


    document.getElementById(
        "continueShopping"
    ).onclick = function () {

        modal.style.display =
            "none";

    };


  document.getElementById(
    "cartCheckout"
).onclick = function () {

    if (cart.length === 0) {

        return;

    }


    // ======================================
    // GET SAVED DELIVERY METHOD
    // ======================================

    const savedDelivery =
        localStorage.getItem(
            "veldVibeDelivery"
        );


    const delivery = 0; // Free courier shipping; ignore legacy fees.


    // ======================================
    // CALCULATE ORDER
    // ======================================

    let subtotal = 0;

    let totalQuantity = 0;


    cart.forEach(cartProduct => {

        Object.keys(
            cartProduct.sizes
        ).forEach(size => {

            const item =
                cartProduct.sizes[size];


            subtotal +=
                item.price *
                item.quantity;


            totalQuantity +=
                item.quantity;

        });

    });


    // ======================================
    // CREATE ORDER
    // ======================================

    const order = {

        cart: cart,

        delivery:
            String(delivery),

        subtotal:
            subtotal,

        quantity:
            totalQuantity,

        total:
            subtotal + delivery

    };


    localStorage.setItem(
        "veldVibeOrder",
        JSON.stringify(order)
    );


    // ======================================
    // GO TO CHECKOUT
    // ======================================

    window.location.href =
        "checkout.html";

};


    modal.addEventListener(
        "click",
        function (event) {

            if (event.target === modal) {

                modal.style.display =
                    "none";

            }

        }
    );

}


// ======================================
// RENDER CART
// ======================================

function renderCart() {

    const cartItems =
        document.getElementById("cartItems");


    if (!cartItems) {
        return;
    }


    cartItems.innerHTML = "";


    let totalQuantity = 0;

    let subtotal = 0;


    if (cart.length === 0) {

        cartItems.innerHTML = `
            <p class="empty-cart">
                Your cart is empty.
            </p>
        `;

    }


    cart.forEach(
        (cartProduct, productIndex) => {

            const product =
                products[cartProduct.product];


            const productBox =
                document.createElement("div");

            productBox.className =
                "cart-product";


            let productHTML = `

                <h3>
                    ${product.title}
                </h3>

            `;


            Object.keys(cartProduct.sizes)
                .forEach(size => {

                    const item =
                        cartProduct.sizes[size];


                    totalQuantity +=
                        item.quantity;


                    subtotal +=
                        item.price *
                        item.quantity;


                    productHTML += `

                        <div class="cart-size-row">

                            <span>
                                Size ${size}
                            </span>

                            <button
                                class="cart-minus"
                                data-product="${productIndex}"
                                data-size="${size}"
                            >
                                −
                            </button>

                            <strong>
                                ${item.quantity}
                            </strong>

                            <button
                                class="cart-plus"
                                data-product="${productIndex}"
                                data-size="${size}"
                            >
                                +
                            </button>

                            <span>
                                R${item.price * item.quantity}
                            </span>

                            <button
                                class="cart-remove-size"
                                data-product="${productIndex}"
                                data-size="${size}"
                            >
                                Remove
                            </button>

                        </div>

                    `;

                });


            productBox.innerHTML =
                productHTML;


            cartItems.appendChild(
                productBox
            );

        }
    );


    document.getElementById(
        "cartQuantity"
    ).innerHTML =
        totalQuantity;


    document.getElementById(
        "cartSubtotal"
    ).innerHTML =
        "R" + subtotal;


    document.querySelectorAll(
        ".cart-minus"
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

                delete cart[productIndex]
                    .sizes[size];

            }


            removeEmptyProducts();

            saveCart();

            renderCart();

        };

    });


    document.querySelectorAll(
        ".cart-plus"
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

            renderCart();

        };

    });


    document.querySelectorAll(
        ".cart-remove-size"
    ).forEach(button => {

        button.onclick = function () {

            const productIndex =
                Number(
                    this.dataset.product
                );

            const size =
                this.dataset.size;


            delete cart[productIndex]
                .sizes[size];


            removeEmptyProducts();

            saveCart();

            renderCart();

        };

    });

}


// ======================================
// REMOVE EMPTY PRODUCTS
// ======================================

function removeEmptyProducts() {

    cart =
        cart.filter(
            item =>
                Object.keys(
                    item.sizes
                ).length > 0
        );

}


// ======================================
// CART BUTTON
// ======================================

function createCartButton() {

    if (
        document.getElementById(
            "floatingCartButton"
        )
    ) {

        return;

    }


    const button =
        document.createElement("button");

    button.id =
        "floatingCartButton";

    button.innerHTML =
        "CART (0)";


    document.body.appendChild(
        button
    );


    button.onclick =
        openCart;


    updateCartButton();

}


// ======================================
// UPDATE CART BUTTON
// ======================================

function updateCartButton() {

    const button =
        document.getElementById(
            "floatingCartButton"
        );


    if (!button) {
        return;
    }


    let quantity = 0;


    cart.forEach(item => {

        Object.values(
            item.sizes
        ).forEach(size => {

            quantity +=
                size.quantity;

        });

    });


    button.innerHTML =
        `CART (${quantity})`;

}


// ======================================
// WHATSAPP
// ======================================

function orderProduct(product) {

    let message = "";


    if (
        product === "General Enquiry"
    ) {

        message =
            "Hi Veld Vibe, I'd like to browse your products and place an order.";

    } else {

        message =
            `Hi Veld Vibe, I'm interested in the ${product}.`;

    }


    const url =
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;


    window.open(
        url,
        "_blank"
    );

}


// ======================================
// COLLECTION POPUP
// ======================================

const copyShowroomCode = document.getElementById("copyShowroomCode");
if (copyShowroomCode) {
    copyShowroomCode.addEventListener("click", async () => {
        const status = document.getElementById("showroomCopyStatus");
        try {
            await navigator.clipboard.writeText("VV1");
            status.textContent = "Code VV1 copied. Present it in the showroom.";
        } catch {
            status.textContent = "Please copy or show this code in store: VV1";
        }
    });
}

const collectionButton =
    document.querySelector(".collection-info-btn");

const collectionModal =
    document.getElementById("collectionModal");

const closeCollection =
    document.querySelector(".close-collection");


if (
    collectionButton &&
    collectionModal &&
    closeCollection
) {

    collectionButton.onclick = function () {

        collectionModal.style.display =
            "flex";

    };


    closeCollection.onclick = function () {

        collectionModal.style.display =
            "none";

    };

}


// ======================================
// DEALS POPUP
// ======================================

const dealsButton =
    document.querySelector(".deals-info-btn");

const dealsModal =
    document.getElementById("dealsModal");

const closeDeals =
    document.querySelector(".close-deals");


if (
    dealsButton &&
    dealsModal &&
    closeDeals
) {

    dealsButton.onclick = function () {

        dealsModal.style.display =
            "flex";

    };


    closeDeals.onclick = function () {

        dealsModal.style.display =
            "none";

    };

}


// ======================================
// RETURNS POPUP
// ======================================

const returnsButton =
    document.querySelector(".returns-btn");

const returnsModal =
    document.getElementById("returnsModal");

const closeReturns =
    document.querySelector(".close-returns");


if (
    returnsButton &&
    returnsModal &&
    closeReturns
) {

    returnsButton.onclick = function () {

        returnsModal.style.display =
            "flex";

    };


    closeReturns.onclick = function () {

        returnsModal.style.display =
            "none";

    };

}


// ======================================
// SIZE GUIDE
// ======================================

const sizeGuideImage =
    document.getElementById("sizeGuideImage");

const sizeGuideModal =
    document.getElementById("sizeGuideModal");

const sizeGuideModalImage =
    document.getElementById("sizeGuideModalImage");

const closeSizeGuide =
    document.querySelector(".close-size-guide");


if (
    sizeGuideImage &&
    sizeGuideModal &&
    sizeGuideModalImage &&
    closeSizeGuide
) {

    sizeGuideImage.addEventListener(
        "click",
        () => {

            sizeGuideModalImage.src =
                sizeGuideImage.src;

            sizeGuideModal.style.display =
                "flex";

        }
    );


    closeSizeGuide.addEventListener(
        "click",
        () => {

            sizeGuideModal.style.display =
                "none";

        }
    );


    sizeGuideModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                sizeGuideModal
            ) {

                sizeGuideModal.style.display =
                    "none";

            }

        }
    );

}


// ======================================
// INITIALISE CART
// ======================================

createCartButton();

updateCartButton();


// ======================================
// REOPEN CART AFTER EDITING
// ======================================

if (
    localStorage.getItem(
        "veldVibeOpenCart"
    ) === "true"
) {

    localStorage.removeItem(
        "veldVibeOpenCart"
    );

    openCart();

}
