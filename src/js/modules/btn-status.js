function btnStatus() {
    const btns = document.querySelectorAll(".status-btn");

    btns.forEach(function (btn) {
        // В зависимости от статуса устанавливаем класс 'active'
        if (btn.innerText.toLowerCase() == "active") {
            btn.classList.add("status-btn--active");
        } else if (btn.innerText.toLowerCase() == "inactive") {
            btn.classList.remove("status-btn--active");
        }
        
        btn.addEventListener("click", function () {
            // console.log('btn: ');
            // console.log(btn);
            // console.log('-----------------');
            
            const isActive = btn.classList.toggle("status-btn--active");

            // console.log("isActive: ");
            // console.log(isActive);
            // console.log("-----------------");

            if (isActive) {
                btn.innerText = "Active";
            } else {
                btn.innerText = "Inactive";
            }
        });
    });
}

// export default btnStatus;