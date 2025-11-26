let currentSlide = 0;
const totalSlides = 8;
const slidesToShow = 3;
const maxSlide = totalSlides - slidesToShow;

let currentRecSlide = 0;
const totalRecSlides = 8;
const recSlidesToShow = 3;
const maxRecSlide = totalRecSlides - recSlidesToShow;

function slideMovements(direction) {
    const grid = document.getElementById('movementsGrid');
    if (!grid) return;
    
    currentSlide += direction;
    
    if (currentSlide < 0) {
        currentSlide = 0;
    } else if (currentSlide > maxSlide) {
        currentSlide = maxSlide;
    }
    
    const translateX = -(currentSlide * (100 / totalSlides));
    grid.style.transform = `translateX(${translateX}%)`;
}

function slideRecommendations(direction) {
    const grid = document.getElementById('recommendationsGrid');
    if (!grid) return;
    
    currentRecSlide += direction;
    
    if (currentRecSlide < 0) {
        currentRecSlide = 0;
    } else if (currentRecSlide > maxRecSlide) {
        currentRecSlide = maxRecSlide;
    }
    
    const translateX = -(currentRecSlide * (100 / recSlidesToShow));
    grid.style.transform = `translateX(${translateX}%)`;
}

document.addEventListener('DOMContentLoaded', function() {
    const heroArrows = document.querySelectorAll('.hero-nav-arrow');
    
    heroArrows.forEach(arrow => {
        arrow.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetUrl = this.getAttribute('href');
            const currentHero = document.querySelector('.period-hero');
            
            if (!currentHero) {
                window.location.href = targetUrl;
                return;
            }
            
            const isRight = this.classList.contains('right');
            
            // Создаем контейнер для iframe
            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: ${isRight ? '100%' : '-100%'};
                width: 100%;
                height: 60vh;
                overflow: hidden;
                transition: left 0.4s ease;
                z-index: 999;
                pointer-events: none;
            `;
            
            const iframe = document.createElement('iframe');
            iframe.style.cssText = `
                width: 100%;
                height: 100vh;
                border: none;
                margin: 0;
                padding: 0;
                display: block;
            `;
            iframe.src = targetUrl;
            iframe.scrolling = 'no';
            
            container.appendChild(iframe);
            document.body.appendChild(container);
            
            setTimeout(() => {
                currentHero.style.transform = isRight ? 'translateX(-100%)' : 'translateX(100%)';
                container.style.left = '0';
                
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 400);
            }, 100);
        });
    });
});