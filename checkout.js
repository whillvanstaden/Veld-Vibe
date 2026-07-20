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
        if (order.delivery == "100") {

    document.getElementById("checkoutButton").innerHTML =
        "PAY SECURELY";

    document.getElementById("deliveryAddress").style.display =
        "block";

    document.getElementById("collectionInfo").style.display =
        "none";

} else {

    document.getElementById("checkoutButton").innerHTML =
        "SUBMIT COLLECTION REQUEST";

    document.getElementById("deliveryAddress").style.display =
        "none";

    document.getElementById("collectionInfo").style.display =
        "block";

}
}