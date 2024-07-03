// function menuActive() {
    const items = document.querySelectorAll(".nav__item");
    const customers = document.querySelector(".customers");

    items.forEach(function(item) {

        item.addEventListener("click", function() {
            // console.log("item: ");
            // console.log(item);
            // console.log("-----------------");

            // Убираем статус 'active' у всех элеменов меню
            items.forEach(function (item) {
                item.classList.remove("active");
            });

            item.classList.add("active");

            if (item.classList.contains("nav__item-customers")) {
                customers.classList.add('customers--active');
            } else {
                customers.classList.remove("customers--active");
            }
        });
    });
// }

// export default menuActive;