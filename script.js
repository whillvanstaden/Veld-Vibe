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
            {name:"S",price:1680},
            {name:"M",price:1680},
            {name:"L",price:1680},
            {name:"XL",price:1680},
            {name:"2XL",price:1680},
            {name:"3XL",price:1680},
            {name:"4XL",price:1680},
            {name:"5XL",price:1680},

            {name:"6XL",price:1950},
            {name:"7XL",price:1950},
            {name:"8XL",price:1950},
            {name:"9XL",price:1950},
            {name:"10XL",price:1950}

        ]

    },

    ladies:{

        title:"BUY LADIES' PARKA JACKET",

        image:"images/Ladies Parka Jackets.png",

        sizes:[
            {name:"3XS",price:1480},
            {name:"2XS",price:1480},
            {name:"XS",price:1480},

            {name:"S",price:1680},
            {name:"M",price:1680},
            {name:"L",price:1680},
            {name:"XL",price:1680},
            {name:"2XL",price:1680},
            {name:"3XL",price:1680},
            {name:"4XL",price:1680},
            {name:"5XL",price:1680},

            {name:"6XL",price:1950},
            {name:"7XL",price:1950},
            {name:"8XL",price:1950},
            {name:"9XL",price:1950},
            {name:"10XL",price:1950}

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

            {name:"S",price:1680},
            {name:"M",price:1680},
            {name:"L",price:1680},
            {name:"XL",price:1680},
            {name:"2XL",price:1680},
            {name:"3XL",price:1680},
            {name:"4XL",price:1680}

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
let selectedSize = "";
let selectedPrice = 0;
let selectedQuantity = 1;
// ======================================
// OPEN PRODUCT POPUP
// ======================================
function openBuyModal(product){

    const item = products[product];

    selectedProduct = product;
selectedQuantity = 1;

document.getElementById("quantityValue").innerHTML = selectedQuantity;
    document.getElementById("buyModal").style.display = "flex";
document.getElementById("continueCheckout").disabled = true;
    document.getElementById("modalTitle").innerHTML = item.title;

    document.getElementById("modalImage").src = item.image;

    document.getElementById("modalImage").alt = item.title;

    const sizeContainer = document.getElementById("sizeOptions");

    sizeContainer.innerHTML = "";

    item.sizes.forEach(size => {

        const button = document.createElement("button");

        button.className = "size-btn";

        button.innerHTML = size.name;

       button.addEventListener("click", function () {

    document
        .querySelectorAll(".size-btn")
        .forEach(btn => btn.classList.remove("active"));

    
    button.classList.add("active");

selectedSize = size.name;

selectedPrice = Number(size.price);

document.getElementById("continueCheckout").disabled = false;

updateTotal();

});

        sizeContainer.appendChild(button);

    });

    updateTotal();

}

// ======================================
// CLOSE POPUP
// ======================================

document.querySelector(".close-modal").onclick = function(){

    document.getElementById("buyModal").style.display = "none";

}

window.onclick = function(event){

    const modal = document.getElementById("buyModal");

    if(event.target == modal){

        modal.style.display = "none";

    }

}

// ======================================
// EXISTING WHATSAPP FUNCTION
// ======================================
function updateTotal() {

    let delivery = Number(
        document.querySelector('input[name="delivery"]:checked').value
    );

    document.getElementById("orderTotal").innerHTML =
       "R" + ((selectedPrice * selectedQuantity) + delivery);


  }
document
    .querySelectorAll('input[name="delivery"]')
    .forEach(option => {

        option.addEventListener("change", function(){

            updateTotal();

        });

    });
// ======================================
// CONTINUE TO CHECKOUT
// ======================================

document.getElementById("continueCheckout").onclick = function(){

    const delivery = document.querySelector(
        'input[name="delivery"]:checked'
    ).value;

    const order = {

        product: selectedProduct,
        size: selectedSize,
        delivery: delivery,
        total: selectedPrice + Number(delivery)

    };

    localStorage.setItem(
    "veldVibeOrder",
    JSON.stringify(order)
);

window.location.href = "checkout.html";

};

function orderProduct(product){

    let message = "";

    if(product==="General Enquiry"){

        message="Hi Veld Vibe, I'd like to browse your products and place an order.";

    }else{

        message=`Hi Veld Vibe, I'm interested in the ${product}.`;

    }

    const url=`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.open(url,"_blank");

}// ======================================
// COLLECTION POPUP
// ======================================

const collectionButton =
    document.querySelector(".collection-info-btn");

const collectionModal =
    document.getElementById("collectionModal");

const closeCollection =
    document.querySelector(".close-collection");

collectionButton.onclick = function(){

    collectionModal.style.display = "flex";

};

closeCollection.onclick = function(){

    collectionModal.style.display = "none";

};

window.addEventListener("click", function(event){

    if(event.target === collectionModal){

        collectionModal.style.display = "none";

    }

});// ======================================
// VELD VIBE DEALS POPUP
// ======================================

const dealsButton =
    document.querySelector(".deals-info-btn");

const dealsModal =
    document.getElementById("dealsModal");

const closeDeals =
    document.querySelector(".close-deals");

if (dealsButton && dealsModal && closeDeals) {

    dealsButton.onclick = function() {

        dealsModal.style.display = "flex";

    };

    closeDeals.onclick = function() {

        dealsModal.style.display = "none";

    };

    window.addEventListener("click", function(event) {

        if (event.target === dealsModal) {

            dealsModal.style.display = "none";

        }

    });

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

if (returnsButton && returnsModal && closeReturns) {

    returnsButton.onclick = function(){

        returnsModal.style.display = "flex";

    };

    closeReturns.onclick = function(){

        returnsModal.style.display = "none";

    };

    window.addEventListener("click", function(event){

        if(event.target === returnsModal){

            returnsModal.style.display = "none";

        }

    });

}
const sizeGuideImage = document.getElementById('sizeGuideImage');
const sizeGuideModal = document.getElementById('sizeGuideModal');
const sizeGuideModalImage = document.getElementById('sizeGuideModalImage');
const closeModal = document.querySelector('.close-size-guide');


if (
    sizeGuideImage &&
    sizeGuideModal &&
    sizeGuideModalImage &&
    closeModal
) {

 sizeGuideImage.addEventListener('click', () => {

   
    sizeGuideModalImage.src = sizeGuideImage.src;
    sizeGuideModal.style.display = 'flex';

});

    closeModal.addEventListener('click', () => {
        sizeGuideModal.style.display = 'none';
    });

    sizeGuideModal.addEventListener('click', (e) => {
        if (e.target === sizeGuideModal) {
            sizeGuideModal.style.display = 'none';
        }
    });

}
document.getElementById("plusQty").addEventListener("click", function () {

    if (selectedQuantity < 10) {

        selectedQuantity++;

        document.getElementById("quantityValue").innerHTML = selectedQuantity;

        updateTotal();

    }

});

document.getElementById("minusQty").addEventListener("click", function () {

    if (selectedQuantity > 1) {

        selectedQuantity--;

        document.getElementById("quantityValue").innerHTML = selectedQuantity;

        updateTotal();

    }

});