import anime from "./../lib/anime.es.js";

// =============  Функция скрытия записей  ===========================================================
const product = document.querySelector(".customers__table-wrapper");
function animateOut() {
    return new Promise((resolve, reject) => {
        const items = document.querySelectorAll(".items");

        items.forEach((item, index) => {
            if (index % 2 == 0) {
                item.classList.add("hide-to-right");
            } else {
                item.classList.add("hide-to-left");
            }
        });

        var hideToRight = document.querySelectorAll(".hide-to-right");
        var hideToLeft = document.querySelectorAll(".hide-to-left");

        anime({
            targets: hideToRight,
            translateX: "100%",
            delay: anime.stagger(100, { easing: "easeOutQuad" }),
            duration: 3000,
            // update: function(anim) {
            //     progressLogEl.value =
            //         "progress : " + Math.round(anim.progress) + "%";
            //     beginLogEl.value = "began : " + anim.began;
            //     completeLogEl.value = "completed : " + anim.completed;
            // },
            // begin: function(anim) {
            //     beginLogEl.value = "began : " + anim.began;
            // },
            // complete: function(anim) {
            //     completeLogEl.value = "completed : " + anim.completed;
            // },
        });

        anime({
            targets: hideToLeft,
            translateX: "-100%",
            // easing: "easeInOutQuad",
            duration: 3000,
            delay: anime.stagger(100, { easing: "easeOutQuad" }),
        });
        // }
        product.style.opacity = 0;

        resolve();
    });
}
// =============  Функция появления записей  ===========================================================
function animateIn() {
    return new Promise((resolve, reject) => {
        const items = document.querySelectorAll(".items");

        product.style.opacity = 1;

        var hideToRight = document.querySelectorAll(".hide-to-right");
        var hideToLeft = document.querySelectorAll(".hide-to-left");

        anime({
            targets: hideToRight,
            // opacity: [0, 1],
            translateX: ["100%", 0],
            delay: anime.stagger(100, { easing: "easeOutQuad" }),
            duration: 3500,
        });

        anime({
            targets: hideToLeft,
            // opacity: [0, 1],
            translateX: ["-100%", 0],
            // easing: "easeInOutQuad",
            duration: 3500,
            delay: anime.stagger(100, { easing: "easeOutQuad" }),
        });
        resolve();
    });
}

// ====================  Тестовый вариант  ======================================
function animateOutPromice() {
    return new Promise((resolve, reject) => {
        const items = document.querySelectorAll(".items");

        console.log("items");
        console.log(items);
        console.log("-------------");

        async function animate({ duration, draw, timing }) {
            return new Promise((resolve) => {
                let start = performance.now();

                requestAnimationFrame(function animate(time) {
                    let timeFraction = (time - start) / duration;
                    if (timeFraction > 1) timeFraction = 1;

                    let progress = timing(timeFraction);

                    console.log("progress in animate: " + progress);

                    draw(progress);

                    if (timeFraction < 1) {
                        requestAnimationFrame(animate);
                    }
                });
                resolve();
            });
            await animate();
        }

        async function goAnimate() {
            await animate({
                duration: 3000,
                // timing: bounceEaseInOut,
                timing: circEaseInOut,
                draw: function(progress) {
                    // const items = document.querySelectorAll(".items");
                    console.log("items");
                    console.log(items);
                    console.log("-------------");

                    items.forEach((item, index) => {
                        // console.log("Index: " + index);
                        // console.log("Item: ");
                        // console.log(item);
                        console.log("progress in animateOut: " + progress);

                        if (index % 2 == 0) {
                            console.log("index%2 == 0");
                            item.style.left = progress * 100 + "%";
                        } else {
                            console.log("index%2 != 0");
                            item.style.left = -(progress * 100) + "%";
                        }
                        item.style.opacity = progress;
                        console.log("left: " + item.style.left);
                        console.log("opacity: " + item.style.opacity);
                    });
                },
            });
        }

        goAnimate();

        resolve();
    });
}

// Устанавливаем начальные значения за пределами таблицы и opacity: 0
function setOutOfRange() {
    const items = document.querySelectorAll(".items");

    items.forEach((item, index) => {
        if (index % 2 == 0) {
            item.classList.add("hide-to-right");
        } else {
            item.classList.add("hide-to-left");
        }
        item.style.opacity = 0;
    });
}

// ==========================================================================
function makeEaseInOut(timing) {
    return function(timeFraction) {
        if (timeFraction < 0.5) return timing(2 * timeFraction) / 2;
        else return (2 - timing(2 * (1 - timeFraction))) / 2;
    };
}

// ====================  Функции расчета времени  ================================

// ----------  Отскоки  ------------------
function bounce(timeFraction) {
    for (let a = 0, b = 1; 1; a += b, b /= 2) {
        if (timeFraction >= (7 - 4 * a) / 11) {
            return (
                -Math.pow((11 - 6 * a - 11 * timeFraction) / 4, 2) +
                Math.pow(b, 2)
            );
        }
    }
}

let bounceEaseInOut = makeEaseInOut(bounce);

// ----------  Дуга  -------------------
function circ(timeFraction) {
    return 1 - Math.sin(Math.acos(timeFraction));
}

let circEaseInOut = makeEaseInOut(circ);

// brick.onclick = function() {
//     animate({
//         duration: 3000,
//         timing: bounceEaseInOut,
//         draw: function(progress) {
//             brick.style.left = progress * 500 + "px";
//         },
//     });
// };

// function animate({ duration, draw, timing }) {
//     return new Promise((resolve) => {
//         let start = performance.now();

//         requestAnimationFrame(function animate(time) {
//             let timeFraction = (time - start) / duration;
//             if (timeFraction > 1) timeFraction = 1;

//             let progress = timing(timeFraction);

//             console.log('progress in animate: ' + progress);

//             draw(progress);

//             if (timeFraction < 1) {
//                 requestAnimationFrame(animate);
//             }
//         });
//         resolve();
//     });

export { animateOut, animateIn };
