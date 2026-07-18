const order = JSON.parse(
    localStorage.getItem("veldVibeOrder")
);

if (order) {

    document.getElementById("checkoutProduct").innerHTML =
        order.product;

    document.getElementById("checkoutSize").innerHTML =
        order.size;

    document.getElementById("checkoutDelivery").innerHTML =
        order.delivery == "100"
            ? "Courier (+R100)"
            : "Collection - Alberton";

    document.getElementById("checkoutTotal").innerHTML =
        "R" + order.total;
}