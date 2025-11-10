const headerInstance = new Header();
const lenis = new Lenis({
    lerp: 0.1,
    autoRaf: true,
});
lenis.on('scroll', () => {
    console.log('scroll')
})