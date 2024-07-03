// import jsonCustomers from './../../html/data/customers.json'
// import jsonCustomers from './../../data/customers.js';
// import btnStatus from "./btn-status.js";

// function customers() {
    
    // Количество выводимых записей на странице
    let lengthPages = 2;

    const numPages = Math.ceil( jsonCustomers.length / lengthPages); // Количество страниц
    let arrayPages = [];        // Массив всех страниц
    let arrayPagesToShow = [];  // Массив фрагмента (4) страниц в пагинации

    // Начальный и конечный индекс выборки значений
    let startIndexOfRange ; 
    let endIndexOfRange;
    
    // Начальный и конечный индекс выборки страниц
    let startIndexOfRangePages ; 
    let endIndexOfRangePages  ;

    // console.log('numPages: ' + numPages);

    // Массив со страницами
    for (let i = 0; i < numPages; i++) {
        arrayPages[i] = i + 1;
    }

    
    // Инициализация текущей страницы и ее индекса
    let currentPageIndex = 0;
    let currentPage = arrayPages[currentPageIndex];
    let customersToShow;
    
    // Фрагмент страниц для вывода в пагинации
    if (numPages <= 4) {
        arrayPagesToShow = arrayPages;
        console.log("arrayPagesToShow: " + arrayPagesToShow);
        console.log("currentPageIndex: " + currentPageIndex);

        if (currentPageIndex == 0) {
            startIndexOfRangePages = 0;
        }

        endIndexOfRangePages = arrayPagesToShow.length - 1;

    } else {
        if (currentPageIndex == 0) {
            startIndexOfRangePages = 0;
        }

        endIndexOfRangePages = (startIndexOfRangePages + 4);

        arrayPagesToShow = arrayPages.slice(startIndexOfRangePages, endIndexOfRangePages);

        // console.log("startIndexOfRangePages: " + startIndexOfRangePages);
        // console.log("endIndexOfRangePages: " + endIndexOfRangePages);
        // console.log("arrayPagesToShow: " + arrayPagesToShow);
    }

    // Элементы статистики: "показано 1 до 8 эл-тов из "
    const startItem = document.querySelector(".start-item");    
    const endItem = document.querySelector(".end-item");
    const totalItems = document.querySelector(".total-items");
    
    // Node диапазона кнопок пагинации
    const btnPrev = document.querySelector(".btn-prev");
    const btnNext = document.querySelector(".btn-next");
    const btnPage = document.querySelector(".btn-pg");
    
    
    // Начальный вывод страницы
    goInit();
    renderBtnRange();
    
    // Отслеживаем клик по странице в pagination range
    listenBtnClick();
    
    // ...запуск события на элементе!
    //   let event = new Event("click", {bubbles: true}); // (2)
    //   btnPages.dispatchEvent(event);

    // ==========   Обработчик нажатия кнопки  'btn-prev'  =================
    // const btnPrev = document.querySelector('.btn-prev');
    btnPrev.addEventListener("click", function() {

        if (currentPageIndex > 0) {
            currentPageIndex--;
            currentPage = arrayPages[currentPageIndex];

            // Если новый счетчик меньше левой границы диапазона вывода, меняем диапазон
            if (currentPageIndex < startIndexOfRangePages) {
                startIndexOfRangePages = currentPageIndex;
                endIndexOfRangePages = startIndexOfRangePages + 4;
                arrayPagesToShow = arrayPages.slice(
                    startIndexOfRangePages,
                    endIndexOfRangePages
                );

                renderBtnRange();
            }
        }

        // Установка активной страницы в блоке 'btn-range'
        // Установка/снятие атрибуа "disabled"
        // Обновляем данные на странице
        goInit();
    });

    // ==========   Обработчик нажатия кнопки  'btn-next'  =================
    btnNext.addEventListener("click", function () {
        
        if (currentPageIndex < arrayPages.length) {
            currentPageIndex++;
            currentPage = arrayPages[currentPageIndex];

            // Если новый счетчик больше правой границы диапазона вывода, меняем диапазон
            if (currentPageIndex >= endIndexOfRangePages) {
                endIndexOfRangePages = currentPageIndex + 1;
                startIndexOfRangePages = endIndexOfRangePages - 4;
                arrayPagesToShow = arrayPages.slice(
                    startIndexOfRangePages,
                    endIndexOfRangePages
                );
                renderBtnRange();
            }
        }
        // Установка активной страницы в блоке 'btn-range'
        // Установка/снятие атрибуа "disabled"
        // Обновляем данные на странице
        goInit();
    });

    // ==========   Обработчик нажатия кнопки  'btn-pg'  =================
    btnPage.addEventListener("click", function () {
        // console.log('btn-pg click');
        // console.log('btn-pg: ');
        
        // if (currentPage < 40) {
            console.log("currentPage before: " + currentPage);
            if (Number(currentPage) + 40 < arrayPages.length) {
                // Number(currentPage) += 40;
                currentPage = Number(currentPage) + 40;
                currentPageIndex = arrayPages.indexOf(currentPage);

                endIndexOfRangePages = currentPageIndex + 1;
                startIndexOfRangePages = endIndexOfRangePages - 4;
                // arrayPagesToShow = arrayPages.slice(
                //     startIndexOfRangePages,
                //     endIndexOfRangePages
                // );
                console.log(
                    "currentPage after + 40 <= arrayPages.length " + currentPage);
                    console.log("currentPageIndex: " + currentPageIndex);
                    
            } else {
                currentPageIndex = arrayPages.length - 1;
                currentPage = arrayPages[arrayPages.length - 1];

                endIndexOfRangePages = currentPageIndex + 1;
                startIndexOfRangePages = endIndexOfRangePages - 4;
            }
            console.log("currentPage after: " + currentPage);
            console.log("currentPageIndex after: " + currentPageIndex);
            arrayPagesToShow = arrayPages.slice(
                startIndexOfRangePages,
                endIndexOfRangePages
            );

            console.log("arrayPagesToShow: ");
            console.log(arrayPagesToShow);
            
            renderBtnRange();

            // console.log("currentPage after: " + currentPage + 40);
            
            // currentPageIndex++;
            // currentPage = arrayPages[currentPageIndex];

            // Если новый счетчик больше правой границы диапазона вывода, меняем диапазон
            // if (currentPageIndex >= endIndexOfRangePages) {
            //     endIndexOfRangePages = currentPageIndex + 1;
            //     startIndexOfRangePages = endIndexOfRangePages - 4;
            //     arrayPagesToShow = arrayPages.slice(
            //         startIndexOfRangePages,
            //         endIndexOfRangePages
            //     );
            //     renderBtnRange();
            // }
        // }
        // Установка активной страницы в блоке 'btn-range'
        // Установка/снятие атрибуа "disabled"
        // Обновляем данные на странице
        goInit();
    });

    // ==========   Инициализация   ===========================================================
    function listenBtnClick() {
        const btnRange = document.querySelectorAll(".btn-range");

        btnRange.forEach(function(el) {
            el.addEventListener("click", function(e) {
                // console.log(e.target.innerText);
                currentPage = e.target.innerText;
                currentPageIndex = arrayPages.indexOf(Number(currentPage));
                // console.log("Current page: " + currentPage);
                // console.log("Current page Index: " + currentPageIndex);
                goInit();
            });
        });
    };

    // ==========   Инициализация   ===========================================================
    function goInit() {
        // Установка активной страницы в блоке 'btn-range'
        setActiveButtonRange(currentPage);

        // Установка/снятие атрибуа "disabled"
        checkDisabled();

        // Обновляем данные на странице
        renderPage();
    }

    // ==========   Установка атрибуа "disabled"   ============================================
    function checkDisabled() {

        // Если достигли левой границы, делаем кнопку btnPrev - "disabled"
        if (currentPageIndex > 0) {
            btnPrev.removeAttribute("disabled");
        } else if (currentPageIndex == 0) { btnPrev.setAttribute("disabled", ""); };

        // Если достигли правой границы, делаем кнопку btnNext - "disabled"
        if (currentPageIndex < arrayPages.length - 1) {
            btnNext.removeAttribute("disabled");
        } else if (currentPageIndex == arrayPages.length - 1) {
            btnNext.setAttribute("disabled", "");
        };

        // Если меньше 40 страниц, делаем кнопку btnPage - "disabled"
        let maxRange = arrayPages.length < 40
            || currentPageIndex == arrayPages.length - 1
            || (currentPageIndex ) == arrayPages.length - 2
            || (currentPageIndex) == arrayPages.length - 3
            || (currentPageIndex) == arrayPages.length - 4

        if ( maxRange ) {
            btnPage.setAttribute("disabled", "");
        } else {
            btnPage.removeAttribute("disabled");
        };
    };

    // ==========   Установка активной страницы в блоке 'btn-range'   =========================
    setActiveButtonRange(currentPage);

    // ==========   Функция установки активной страницы в блоке 'btn-range'   =================
    function setActiveButtonRange(currentPage) {
        const btnPages = document.querySelectorAll(".btn-range > .btn-pag");

        btnPages.forEach(function (btn) {
            // В зависимости от статуса устанавливаем класс 'active'
            if (btn.innerText == currentPage) {
                btn.classList.add("btn-pag--active");
            } else {
                btn.classList.remove("btn-pag--active");
            }
        });
    };
    
    // Функция усановки начального и конечного индекса выводимых элементов данной страницы
    function getIndexRange(currentPage) {
        if (currentPage == 1) {
            startIndexOfRange = 0; 
            endIndexOfRange = (lengthPages - 1) ;
        } else {
            startIndexOfRange = (currentPage - 1) * lengthPages ;
            endIndexOfRange = startIndexOfRange + lengthPages-1;

            if (endIndexOfRange > (jsonCustomers.length - 1)) {
                endIndexOfRange = jsonCustomers.length - 1;
            }
        }
    }

    // ==========   Вывод диапазона страниц   =============================
     function renderBtnRange() {
        const btnRange = document.querySelector(".btn-range");
        btnRange.innerHTML = "";
  
        const maxPages = (arrayPagesToShow.length < 4) ? arrayPages.length : 4;
        // console.log("max pages: " + maxPages);
        let text = '';

        arrayPagesToShow.forEach((page, i, ) => {
                  
            text = `<button class="btn-pag">${page}</button>`
                
            btnRange.innerHTML += text;
        });
    };

    // ==========   Вывод продуктов в цикле из каталога   =============================
     function showItems() {
        const product = document.querySelector(".customers__table-wrapper");
        product.innerHTML = '';
  
        customersToShow.forEach(function (item) {
             let text = `
                <ul class="items">
                    <li class="item-name">${item.name}</li>
                    <li class="item-company">${item.company}</li>    
                    <li class="item-phone">${item.phone}</li>
                    <li class="item-email">${item.email}</li>
                    <li class="item-country">${item.country}</li>
                    <li class="item-status">
                        <button class="status-btn">${item.status}</button>
                    </li>
                </ul>
            `;
            product.innerHTML += text;
        });
    };

     // Функция рендеринга/инициализации страницы
    function renderPage() {
        // Определяем начальный и конечный индекс элементов данной страницы
        getIndexRange(currentPage);

        // Выборка элементов текущей страницы для рендеринга
        customersToShow = jsonCustomers.slice(startIndexOfRange, endIndexOfRange + 1);

        // console.log("customersToShow: ");
        // console.log(customersToShow);

        // Элементы статистики: "показано 1 до 8 эл-тов из "
        startItem.textContent = startIndexOfRange + 1;
        endItem.textContent = endIndexOfRange + 1;
        totalItems.textContent = jsonCustomers.length;
        
        // Выводим данные
        showItems();
        
        btnStatus();
    };
// }

// export default customers;