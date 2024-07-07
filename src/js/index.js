// Галерея и лайтбоксы от Fancybox
// import { Fancybox } from '@fancyapps/ui';
// import '@fancyapps/ui/dist/fancybox/fancybox.css';

// Fancybox.bind('[data-fancybox]', {
// 	// Your custom options
// });


// import menuActive from "./modules/menu-active.js";
// menuActive();

// import customers from "./modules/customers.js";
// customers();


// Мобильная навигация
const navBtn = document.querySelector(".mobile-nav-btn");
const nav = document.querySelector(".mobile-nav");
const menuIcon = document.querySelector(".nav-icon");

const fade = document.querySelector(".mobile-nav-fade");

navBtn.onclick = toggleMobile;
fade.onclick = toggleMobile;

function toggleMobile() {
    nav.classList.toggle("mobile-nav--open");
    menuIcon.classList.toggle("nav-icon--active");
    document.body.classList.toggle("no-scroll");
    fade.classList.toggle("mobile-nav-fade--open");
}


// import btnStatus from "./modules/btn-status.js";
// btnStatus();
// Мобильная навигация
// import mobileNav from './modules/mobile-nav.js';
// mobileNav();
