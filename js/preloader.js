const preloader = document.getElementById('preloader');
const enterBtn = document.getElementById('enter-btn');

enterBtn.addEventListener('click', () => {
    preloader.style.display = 'none';
    gsap.to(preloader, {
        duration: 3,
        ease: Power2.easeOut,
        y: "-100%",
        opacity: 0,
        display: "none"
    });
});