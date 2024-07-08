function makeEaseInOut(timing) {
    return function(timeFraction) {
        if (timeFraction < 0.5) return timing(2 * timeFraction) / 2;
        else return (2 - timing(2 * (1 - timeFraction))) / 2;
    };
}

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

// brick.onclick = function() {
//     animate({
//         duration: 3000,
//         timing: bounceEaseInOut,
//         draw: function(progress) {
//             brick.style.left = progress * 500 + "px";
//         },
//     });
// };

function animate({ duration, draw, timing }) {
    let start = performance.now();

    requestAnimationFrame(function animate(time) {
        let timeFraction = (time - start) / duration;
        if (timeFraction > 1) timeFraction = 1;

        let progress = timing(timeFraction);

        draw(progress);

        if (timeFraction < 1) {
            requestAnimationFrame(animate);
        }
    });
}

// ==========================================================================
function animateOut() {
    const items = document.querySelectorAll(".items");
    // const itemOdd= document.querySelector(
    //     ".customers__table-wrapper:nth - child(odd)"
    // );

    console.log("items");
    console.log(items);
    console.log("-------------");

    // console.log("itemOdd");
    // console.log(itemOdd);
    // for (const item of itemEven) {
    //     console.log("Item: ");
    //     console.log(item);
    //     // console.log("Index: " + i);
    // }
    items.forEach((item, index, array) => {
        console.log("Index: " + index);
        console.log("Item: ");
        console.log(item);

        if (index % 2 == 0) {
            console.log("index%2 == 0");
        } else {
            console.log("index%2 != 0");
        }
    });

    // animate({
    //     duration: 3000,
    //     timing: bounceEaseInOut,
    //     draw: function(progress) {
    //         brick.style.left = progress * 500 + "px";
    //     },
    // });
}
