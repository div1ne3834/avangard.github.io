let currentSlide = 0;
const totalSlides = 8;
const slidesToShow = 3;
const maxSlide = totalSlides - slidesToShow;

let currentRecSlide = 0;
const totalRecSlides = 8;
const recSlidesToShow = 3;
const maxRecSlide = totalRecSlides - recSlidesToShow;

// Firebase configuration (replace with your actual config) - wrapped in try-catch to prevent breaking the app
let dbHub = null;
try {
    const firebaseConfig = {
        apiKey: "your-api-key",
        authDomain: "your-project.firebaseapp.com",
        databaseURL: "https://your-project-default-rtdb.firebaseio.com",
        projectId: "your-project",
        storageBucket: "your-project.appspot.com",
        messagingSenderId: "123456789",
        appId: "your-app-id"
    };

    // Initialize Firebase only if it's available
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        dbHub = firebase.database();
    }
} catch (error) {
    console.log('Firebase initialization skipped:', error.message);
}

// Caches
let complaintsCache = null;
let branchListCache = null;
const grid = document.getElementById('movementsGrid');

async function exportReportsToExcel() {
    try {
        Swal.fire({
            title: 'Подготовка отчета...',
            text: 'Пожалуйста, подождите',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        // Fetch complaints data
        if (!complaintsCache) {
            const complaintsSnapshot = await dbHub.ref('complaints').once('value');
            complaintsCache = complaintsSnapshot.val() || {};
        }

        // Fetch branch list
        if (!branchListCache) {
            const branchSnapshot = await dbHub.ref('branchList').once('value');
            branchListCache = branchSnapshot.val() || [];
        }

        const complaints = Object.values(complaintsCache);
        const branchList = branchListCache;

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Avant-garde App';
        workbook.lastModifiedBy = 'System';
        workbook.created = new Date();
        workbook.modified = new Date();

        // Main sheet with complaints data
        const mainSheet = workbook.addWorksheet('Жалобы');
        mainSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Дата', key: 'date', width: 15 },
            { header: 'Время', key: 'time', width: 10 },
            { header: 'Филиал', key: 'branch', width: 20 },
            { header: 'Категория', key: 'category', width: 15 },
            { header: 'Описание', key: 'description', width: 50 },
            { header: 'Статус', key: 'status', width: 15 },
            { header: 'Приоритет', key: 'priority', width: 10 }
        ];

        // Style header
        mainSheet.getRow(1).font = { bold: true };
        mainSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4ECDC4' }
        };

        // Add data
        complaints.forEach(complaint => {
            mainSheet.addRow({
                id: complaint.id || '',
                date: complaint.date || '',
                time: complaint.time || '',
                branch: complaint.branch || '',
                category: complaint.category || '',
                description: complaint.description || '',
                status: complaint.status || '',
                priority: complaint.priority || ''
            });
        });

        // Statistics sheet
        const statsSheet = workbook.addWorksheet('Статистика');
        statsSheet.columns = [
            { header: 'Показатель', key: 'metric', width: 30 },
            { header: 'Значение', key: 'value', width: 20 }
        ];

        // Calculate statistics
        const totalComplaints = complaints.length;
        const openComplaints = complaints.filter(c => c.status === 'open').length;
        const closedComplaints = complaints.filter(c => c.status === 'closed').length;
        const highPriority = complaints.filter(c => c.priority === 'high').length;

        statsSheet.addRow({ metric: 'Общее количество жалоб', value: totalComplaints });
        statsSheet.addRow({ metric: 'Открытые жалобы', value: openComplaints });
        statsSheet.addRow({ metric: 'Закрытые жалобы', value: closedComplaints });
        statsSheet.addRow({ metric: 'Высокий приоритет', value: highPriority });

        // Charts sheet
        const chartSheet = workbook.addWorksheet('Графики');

        // Create chart data
        const statusData = [
            ['Статус', 'Количество'],
            ['Открытые', openComplaints],
            ['Закрытые', closedComplaints]
        ];

        // Add chart data to sheet
        statusData.forEach(row => {
            chartSheet.addRow(row);
        });

        // Create chart
        const chart = workbook.addChart(chartSheet, 'doughnut', {
            title: { text: 'Распределение жалоб по статусу' },
            data: {
                type: 'doughnut',
                series: [{
                    name: 'Количество',
                    data: statusData.slice(1)
                }]
            }
        });

        chart.position = { col: 4, row: 1 };
        chart.size = { width: 400, height: 300 };

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `reports_${timestamp}.xlsx`;

        // Save file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, filename);

        Swal.fire({
            icon: 'success',
            title: 'Отчет экспортирован!',
            text: `Файл ${filename} успешно сохранен`,
            timer: 3000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Error exporting reports:', error);
        Swal.fire({
            icon: 'error',
            title: 'Ошибка!',
            text: 'Не удалось экспортировать отчет. Попробуйте еще раз.',
            confirmButtonText: 'OK'
        });
    }
}

function slideMovements(direction) {
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

// Language translations
const translations = {
    ru: {
        logo: "Авангард: революция в искусстве и культуре",
        home: "Главная",
        history: "История",
        directions: "Направления",
        movements: "Течения",
        personalities: "Личности",
        architecture: "Архитектура",
        art: "Искусство",
        literature: "Литература",
        music: "Музыка",
        heroTitle: "Авангард: революция в искусстве и культуре",
        heroSubtitle: "Революционные художественные движения XX века",
        explore: "Исследовать",
        aboutTitle: "Что такое авангард?",
        aboutText: "Авангард — это радикальные художественные течения начала XX века, которые кардинально изменили представления об искусстве. Отказавшись от традиционных форм и канонов, авангардисты создали новый язык искусства, основанный на эксперименте, инновациях и стремлении к будущему.",
        historyTitle: "История авангарда",
        period1: "1900-1910",
        period1Desc: "Зарождение авангарда. Отказ от академических традиций",
        period2: "1910-1920",
        period2Desc: "Расцвет экспериментов. Кубизм, футуризм, абстракционизм",
        period3: "1920-1930",
        period3Desc: "Развитие сюрреализма и конструктивизма",
        period4: "1930-1950",
        period4Desc: "Влияние войн и политических изменений на искусство",
        directionsTitle: "Основные направления",
        archDesc: "Отказ от декора, функциональность и чистые геометрические формы",
        artDesc: "Разрушение традиционных форм, эксперименты с цветом и перспективой",
        litDesc: "Новые поэтические формы, поток сознания и разрушение синтаксиса",
        musicDesc: "Отказ от тональности, новые ритмы и звуковые эксперименты",
        personalitiesTitle: "Личности авангарда",
        movementsTitle: "Течения",
        viewAllPersonalities: "Все личности →",
        footer: "&copy; 2025 Авангард в искусстве. Образовательный проект.",
        backLink: "&larr; Вернуться на главную",
        personalitiesHero: "Личности авангарда",
        backToList: "← Назад к списку",
        movementsList: ['Фовизм', 'Кубизм', 'Футуризм', 'Супрематизм', 'Дадаизм', 'Конструктивизм', 'Сюрреализм', 'Баухаус', 'Экспрессионизм'],
        movementsDesc: [
            'Предельная яркость и чистота цвета. Отказ от реалистической светотени и перспективы в пользу эмоционального удара краски.',
            'Разложение предметов на геометрические грани и плоскости. Одновременное изображение объекта с разных точек зрения.',
            'Культ скорости, машины, энергии и динамики. Агрессивный отказ от прошлого и прославление будущего.',
            'Абсолютная нефигуративность. Только чистые геометрические формы и цвет в пустом пространстве.',
            'Полное отрицание искусства и логики. Случайность, абсурд, готовые объекты. Антиискусство как протест.',
            'Искусство на службе общества. Геометрия, функциональность, отказ от украшательства.',
            'Мир снов, бессознательного и фантазии. Освобождение образов от контроля разума.',
            'Форма следует функции. Полный синтез искусства, ремесла и технологии.',
            'Интенсивное выражение внутреннего эмоционального состояния. Искажённые формы, резкие контрасты цвета, грубая фактура мазка.'
        ]
    },
    en: {
        logo: "Avant-garde: Revolution in Art and Culture",
        home: "Home",
        history: "History",
        directions: "Directions",
        movements: "Movements",
        personalities: "Personalities",
        architecture: "Architecture",
        art: "Art",
        literature: "Literature",
        music: "Music",
        heroTitle: "Avant-garde: Revolution in Art and Culture",
        heroSubtitle: "Revolutionary art movements of the 20th century",
        explore: "Explore",
        aboutTitle: "What is Avant-garde?",
        aboutText: "Avant-garde is radical artistic movements of the early 20th century that fundamentally changed perceptions of art. Rejecting traditional forms and canons, avant-gardists created a new language of art based on experiment, innovation, and aspiration to the future.",
        historyTitle: "History of Avant-garde",
        period1: "1900-1910",
        period1Desc: "The birth of avant-garde. Rejection of academic traditions",
        period2: "1910-1920",
        period2Desc: "Flourishing of experiments. Cubism, Futurism, Abstractionism",
        period3: "1920-1930",
        period3Desc: "Development of Surrealism and Constructivism",
        period4: "1930-1950",
        period4Desc: "Influence of wars and political changes on art",
        directionsTitle: "Main Directions",
        archDesc: "Rejection of decoration, functionality and pure geometric forms",
        artDesc: "Destruction of traditional forms, experiments with color and perspective",
        litDesc: "New poetic forms, stream of consciousness and destruction of syntax",
        musicDesc: "Rejection of tonality, new rhythms and sound experiments",
        personalitiesTitle: "Avant-garde Personalities",
        movementsTitle: "Movements",
        footer: "© 2025 Avant-garde in Art. Educational project.",
        backLink: "← Back to main",
        personalitiesHero: "Avant-garde Personalities",
        backToList: "← Back to list",
        movementsList: ['Fauvism', 'Cubism', 'Futurism', 'Suprematism', 'Dadaism', 'Constructivism', 'Surrealism', 'Bauhaus', 'Expressionism'],
        movementsDesc: [
            'Extreme brightness and purity of color. Rejection of realistic light and shadow and perspective in favor of the emotional impact of paint.',
            'Decomposition of objects into geometric faces and planes. Simultaneous depiction of the object from different points of view.',
            'Cult of speed, machine, energy and dynamics. Aggressive rejection of the past and glorification of the future.',
            'Absolute non-figuration. Only pure geometric shapes and color in empty space.',
            'Complete denial of art and logic. Chance, absurdity, ready-made objects. Anti-art as protest.',
            'Art in the service of society. Geometry, functionality, rejection of embellishment.',
            'The world of dreams, the unconscious and fantasy. Liberation of images from the control of reason.',
            'Form follows function. Complete synthesis of art, craft and technology.',
            'Intense expression of the inner emotional state. Distorted forms, sharp color contrasts, rough brush texture.'
        ]
    }
};

// Current language
let currentLang = localStorage.getItem('language') || 'ru';

// Function to update page content
function updateContent(lang) {
    const t = translations[lang];

    // Update logo
    const logoEl = document.querySelector('.logo');
    if (logoEl) logoEl.textContent = t.logo;

    // Update main navigation items - get only direct child links, not dropdown links
    const navLinks = document.querySelectorAll('.nav-menu > li > a');
    if (navLinks[0]) navLinks[0].textContent = t.home;
    if (navLinks[1]) navLinks[1].textContent = t.history;
    if (navLinks[2]) navLinks[2].textContent = t.directions;
    if (navLinks[3]) navLinks[3].textContent = t.movements;
    if (navLinks[4]) navLinks[4].textContent = t.personalities;

    // Update dropdowns - get dropdowns by their parent li position
    const dropdowns = document.querySelectorAll('.nav-menu li .dropdown');
    
    // History dropdown (1900-1910, 1910-1920, etc.)
    if (dropdowns[0]) {
        const historyLinks = dropdowns[0].querySelectorAll('a');
        if (historyLinks[0]) historyLinks[0].textContent = '1900-1910';
        if (historyLinks[1]) historyLinks[1].textContent = '1910-1920';
        if (historyLinks[2]) historyLinks[2].textContent = '1920-1930';
        if (historyLinks[3]) historyLinks[3].textContent = '1930-1950';
    }

    // Directions dropdown (Architecture, Art, Literature, Music)
    if (dropdowns[1]) {
        const directionLinks = dropdowns[1].querySelectorAll('a');
        if (directionLinks[0]) directionLinks[0].textContent = t.architecture;
        if (directionLinks[1]) directionLinks[1].textContent = t.art;
        if (directionLinks[2]) directionLinks[2].textContent = t.literature;
        if (directionLinks[3]) directionLinks[3].textContent = t.music;
    }

    // Movements dropdown (Fauvism, Cubism, etc.)
    if (dropdowns[2]) {
        dropdowns[2].querySelectorAll('a').forEach((link, index) => {
            if (t.movementsList[index]) {
                link.textContent = t.movementsList[index];
            }
        });
    }

    // Update hero section
    const heroTitle = document.querySelector('.hero-content h1');
    if (heroTitle) heroTitle.textContent = t.heroTitle;

    const heroSubtitle = document.querySelector('.hero-content p');
    if (heroSubtitle) heroSubtitle.textContent = t.heroSubtitle;

    const exploreBtn = document.querySelector('.cta-button');
    if (exploreBtn) exploreBtn.textContent = t.explore;

    // Update about section
    const aboutTitle = document.querySelector('.about-content h2');
    if (aboutTitle) aboutTitle.textContent = t.aboutTitle;

    const aboutText = document.querySelector('.about-content p');
    if (aboutText) aboutText.textContent = t.aboutText;

    // Update history section
    const historyTitle = document.querySelector('.movements h2');
    if (historyTitle) historyTitle.textContent = t.historyTitle;

    const movementCards = document.querySelectorAll('.movement-card');
    if (movementCards.length >= 4) {
        movementCards[0].querySelector('h3').textContent = t.period1;
        movementCards[0].querySelector('p').textContent = t.period1Desc;
        movementCards[1].querySelector('h3').textContent = t.period2;
        movementCards[1].querySelector('p').textContent = t.period2Desc;
        movementCards[2].querySelector('h3').textContent = t.period3;
        movementCards[2].querySelector('p').textContent = t.period3Desc;
        movementCards[3].querySelector('h3').textContent = t.period4;
        movementCards[3].querySelector('p').textContent = t.period4Desc;
    }

    // Update directions section
    const directionsTitle = document.querySelector('.directions h2');
    if (directionsTitle) directionsTitle.textContent = t.directionsTitle;

    const directionCards = document.querySelectorAll('.direction-card');
    if (directionCards.length >= 4) {
        directionCards[0].querySelector('p').textContent = t.archDesc;
        directionCards[1].querySelector('p').textContent = t.artDesc;
        directionCards[2].querySelector('p').textContent = t.litDesc;
        directionCards[3].querySelector('p').textContent = t.musicDesc;
    }

    // Update personalities section
    const personalitiesTitle = document.querySelector('.personalities h2');
    if (personalitiesTitle) personalitiesTitle.textContent = t.personalitiesTitle;

    // Update movements section
    const movementsTitle = document.querySelector('.gallery h2');
    if (movementsTitle) movementsTitle.textContent = t.movementsTitle;

    // Update movements descriptions in gallery
    const artworkPlaceholders = document.querySelectorAll('.artwork-placeholder');
    if (artworkPlaceholders.length >= 9) {
        artworkPlaceholders.forEach((placeholder, index) => {
            const h3 = placeholder.querySelector('h3');
            const p = placeholder.querySelector('p');
            if (h3 && p && t.movementsList[index] && t.movementsDesc[index]) {
                h3.textContent = t.movementsList[index];
                p.textContent = t.movementsDesc[index];
            }
        });
    }

    // Update footer
    const footer = document.querySelector('footer p');
    if (footer) footer.textContent = t.footer;

    // Update personalities page specific elements
    const backLink = document.querySelector('.back-link');
    if (backLink) backLink.textContent = t.backLink;

    const personalityHero = document.querySelector('.personality-hero h1');
    if (personalityHero) personalityHero.textContent = t.personalitiesHero;

    const backToList = document.querySelector('.back-to-list');
    if (backToList) backToList.textContent = t.backToList;

    // Update language button
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.textContent = lang === 'ru' ? 'EN' : 'RU';
    }

    // Update document language
    document.documentElement.lang = lang;
}

// Language toggle functionality
function toggleLanguage() {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    localStorage.setItem('language', currentLang);
    updateContent(currentLang);
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize language
    updateContent(currentLang);

    // Language toggle button
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.addEventListener('click', toggleLanguage);
    }

    // Add event listener to the language toggle button
    const langToggleBtn = document.getElementById('lang-toggle');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', toggleLanguage);
    }

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

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });

        // Toggle dropdown on mobile
        const navItems = navMenu.querySelectorAll('li');
        navItems.forEach(item => {
            const dropdown = item.querySelector('.dropdown');
            const link = item.querySelector('a');
            if (dropdown && link) {
                link.addEventListener('click', function(e) {
                    // Only on mobile
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        dropdown.classList.toggle('active');
                    }
                });
            }
        });
    }
});
