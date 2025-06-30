import data from '../data/data_complete.json' assert { type: 'json' };

document.addEventListener('DOMContentLoaded', () => {
    const { examResults: examData, modules: moduleData, quizQuestions: quizData, glossary: glossarData } = data;
    // --- DOM ELEMENT SELECTORS ---
    const mainNav = document.getElementById('main-nav');
    const burgerMenu = document.getElementById('burger-menu');
    const contentSections = document.querySelectorAll('.content-section');
    const dashboardSection = document.getElementById('dashboard');
    const moduleSection = document.getElementById('module');
    const moduleOverview = document.getElementById('module-overview');
    const moduleContent = document.getElementById('module-content');
    const tooltip = document.getElementById('tooltip');

    // --- NAVIGATION LOGIC ---
    function showSection(targetId) {
        contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetId) {
                section.classList.add('active');
            }
        });
        document.querySelectorAll('#main-nav a').forEach(link => {
             link.classList.remove('active');
             if(link.getAttribute('href') === `#${targetId}`) {
                 link.classList.add('active');
             }
        });
        if(window.innerWidth <= 992) mainNav.parentElement.classList.remove('active'); // Target parent <nav>
        if(targetId === 'module') {
            renderModulesOverview();
        }
    }

    mainNav.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);
            // When a link inside the nav is clicked, ensure the parent <nav> loses .active
            if(window.innerWidth <= 992 && mainNav.parentElement.classList.contains('active')) {
                mainNav.parentElement.classList.remove('active');
            }
            showSection(targetId);
        }
    });

    burgerMenu.addEventListener('click', () => {
        mainNav.parentElement.classList.toggle('active'); // Target parent <nav>
    });

    // --- DASHBOARD RENDERING ---
    function renderDashboard() {
        // examData is now examResults
        const sortedModules = [...examData.moduleScores].sort((a, b) => a.score - b.score);

        let dashboardHTML = `
            <div id="dashboard-header">
                <h2>Willkommen zurück!</h2>
                <p>Dein letztes Prüfungsergebnis war <strong>${examData.totalScore}%</strong>. Hier ist dein personalisierter Lernpfad.</p>
            </div>
            <div class="dashboard-grid">
                <div class="card" id="recommended-learning">
                    <h3>Dein empfohlener Lernpfad</h3>
                    <p>Konzentriere dich auf deine schwächsten Bereiche, um den größten Fortschritt zu erzielen.</p>
                    <ul>
                        <li><a href="#" data-module-id="${sortedModules[0].id}"><strong>Starte hier:</strong> ${sortedModules[0].name} (${sortedModules[0].score}%)</a></li>
                        <li><a href="#" data-module-id="${sortedModules[1].id}"><strong>Nächster Schritt:</strong> ${sortedModules[1].name} (${sortedModules[1].score}%)</a></li>
                    </ul>
                </div>

                <div class="card" id="module-performance">
                    <h3>Modul-Leistung</h3>
                    ${examData.moduleScores.map(mod => `
                        <div>
                            <p>${mod.name}</p>
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${mod.score}%; background-color: ${getScoreColor(mod.score)};">
                                    ${mod.score}%
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        dashboardSection.innerHTML = dashboardHTML;

        document.querySelectorAll('#recommended-learning a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const moduleId = e.currentTarget.dataset.moduleId;
                renderModuleContent(moduleId);
                showSection('module');
            });
        });
    }

    function getScoreColor(score) {
        if (score > 80) return 'var(--color-good)';
        if (score > 60) return 'var(--color-medium)';
        return 'var(--color-weak)';
    }

    // --- MODULE RENDERING ---
    function renderModulesOverview() {
        moduleContent.classList.add('hidden');
        moduleOverview.classList.remove('hidden');
        // examData.modules is now examData.moduleScores, and moduleData has the titles
        moduleOverview.innerHTML = `<h2>Module</h2>` + examData.moduleScores.map(modScore => {
            const modDetails = moduleData[modScore.id]; // Get details from moduleData
            // Use modScore.name for the main heading as it includes "Modul X"
            const titleText = modDetails ? (modDetails.title.includes("Modul " + modScore.id.slice(-1)) ? modDetails.title : `Modul ${modScore.id.slice(-1)}: ${modDetails.title}`) : modScore.name;
            return `
            <div class="module-card" data-module-id="${modScore.id}">
                <h3>${titleText}</h3>
                <p>Klicken, um die Inhalte für Modul ${modScore.id.slice(-1)} anzuzeigen.</p>
                 <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${modScore.score}%; background-color: ${getScoreColor(modScore.score)};">
                        ${modScore.score}%
                    </div>
                </div>
            </div>
        `}).join('');

        document.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', (e) => {
                renderModuleContent(e.currentTarget.dataset.moduleId);
            });
        });
    }

    function renderModuleContent(moduleId) {
        moduleOverview.classList.add('hidden');
        moduleContent.classList.remove('hidden');

        const mod = moduleData[moduleId];
        if (!mod) {
            moduleContent.innerHTML = `<p>Inhalt nicht gefunden.</p>`;
            return;
        }

        let contentHTML = `
            <button id="back-to-modules">← Zurück zur Modulübersicht</button>
            <h2>${mod.title}</h2>
            <div class="module-content-container">
        `;

        mod.chapters.forEach(chapter => {
            contentHTML += `<div class="chapter"><h3>${chapter.title}</h3>`;
            chapter.content.forEach(item => {
                switch(item.type) {
                    case 'p':
                        contentHTML += `<p>${item.data}</p>`;
                        break;
                    case 'h3':
                        contentHTML += `<h4>${item.data}</h4>`;
                        break;
                    case 'ul':
                        contentHTML += `<ul>${item.data.map(li => `<li>${li}</li>`).join('')}</ul>`;
                        break;
                    case 'ol':
                        contentHTML += `<ol>${item.data.map(li => `<li>${li}</li>`).join('')}</ol>`;
                        break;
                    case 'blockquote':
                        contentHTML += `<blockquote>${item.data}</blockquote>`;
                        break;
                    case 'image_placeholder':
                        contentHTML += `<div class="card" style="text-align: center; border-color: var(--accent-color-3);">${item.data}</div>`;
                        break;
                    case 'exercise':
                        contentHTML += `<div class="exercise"><h4>${item.data.title}</h4><p>${item.data.text}</p></div>`;
                        break;
                }
            });
            contentHTML += `</div>`;
        });

        contentHTML += `</div>`;
        moduleContent.innerHTML = contentHTML;

        document.getElementById('back-to-modules').addEventListener('click', renderModulesOverview);
        linkGlossarTerms();
    }

    function linkGlossarTerms() {
        const contentContainer = moduleContent.querySelector('.module-content-container');
        if (!contentContainer) return;

        const glossarKeys = Object.keys(glossarData);
        glossarKeys.sort((a, b) => b.length - a.length);
        const regex = new RegExp(`\\b(${glossarKeys.join('|')})\\b`, 'gi');

        contentContainer.querySelectorAll('p, li, h3, h4').forEach(el => {
            el.innerHTML = el.innerHTML.replace(regex, (match) => {
                 const termKey = glossarKeys.find(key => key.toLowerCase() === match.toLowerCase());
                 if(termKey) {
                   return `<span class="glossar-term" data-term="${termKey}">${match}</span>`;
                 }
                 return match;
            });
        });

        document.querySelectorAll('.glossar-term').forEach(termEl => {
            termEl.addEventListener('mouseenter', showTooltip);
            termEl.addEventListener('mouseleave', hideTooltip);
        });
    }

    function showTooltip(e) {
        const term = e.target.dataset.term;
        tooltip.textContent = glossarData[term];
        tooltip.style.left = `${e.pageX + 10}px`;
        tooltip.style.top = `${e.pageY + 10}px`;
        tooltip.classList.remove('hidden');
    }

    function hideTooltip() {
        tooltip.classList.add('hidden');
    }


    // --- GLOSSAR LOGIC ---
    const glossarList = document.getElementById('glossar-list');
    const glossarFilter = document.getElementById('glossar-filter');

    function renderGlossar() {
        glossarList.innerHTML = Object.entries(glossarData).map(([term, definition]) => `
            <li data-term="${term.toLowerCase()}">
                <strong>${term}</strong>
                <p>${definition}</p>
            </li>
        `).join('');
    }

    glossarFilter.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('#glossar-list li').forEach(li => {
            if (li.dataset.term.includes(searchTerm)) {
                li.classList.remove('hidden');
            } else {
                li.classList.add('hidden');
            }
        });
    });

    // --- QUIZ LOGIC ---
    const quizContainer = document.getElementById('quiz-container');
    const quizStart = document.getElementById('quiz-start');
    const quizMain = document.getElementById('quiz-main');
    const quizEnd = document.getElementById('quiz-end');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const questionContainer = document.getElementById('question-container');
    const quizFeedback = document.getElementById('quiz-feedback');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const quizScoreEl = document.getElementById('quiz-score');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');

    let currentQuestionIndex = 0;
    let score = 0;

    function startQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        quizStart.classList.add('hidden');
        quizEnd.classList.add('hidden');
        quizMain.classList.remove('hidden');
        nextQuestionBtn.classList.add('hidden');
        quizFeedback.innerHTML = '';
        renderQuestion();
    }

    function renderQuestion() {
        const question = quizData[currentQuestionIndex];
        let options = [...question.options, question.correctAnswer];
        options.sort(() => Math.random() - 0.5); // Shuffle options

        questionContainer.innerHTML = `
            <h3>${question.questionText}</h3>
            <div class="answer-options">
                ${options.map(option => `<button class="answer-btn">${option}</button>`).join('')}
            </div>
        `;

        document.querySelectorAll('.answer-btn').forEach(button => {
            button.addEventListener('click', handleAnswer);
        });
    }

    function handleAnswer(e) {
        const selectedAnswer = e.target.textContent;
        const correctAnswer = quizData[currentQuestionIndex].correctAnswer;

        quizFeedback.classList.remove('hidden', 'feedback-correct', 'feedback-incorrect');
        if (selectedAnswer === correctAnswer) {
            score++;
            quizFeedback.innerHTML = "<strong>Korrekt!</strong>";
            quizFeedback.classList.add('feedback-correct');
        } else {
            quizFeedback.innerHTML = `<strong>Falsch.</strong> Richtig wäre: <em>${correctAnswer}</em>. <br><small>${quizData[currentQuestionIndex].explanation}</small>`;
            quizFeedback.classList.add('feedback-incorrect');
        }

        document.querySelectorAll('.answer-btn').forEach(button => {
            button.disabled = true;
            if (button.textContent === correctAnswer) {
                button.style.border = "2px solid var(--color-good)";
            } else if (button.textContent === selectedAnswer) {
                button.style.border = "2px solid var(--color-weak)";
            }
        });
        nextQuestionBtn.classList.remove('hidden');
    }

    function showNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.length) {
            quizFeedback.innerHTML = '';
            quizFeedback.classList.add('hidden');
            nextQuestionBtn.classList.add('hidden');
            renderQuestion();
        } else {
            endQuiz();
        }
    }

    function endQuiz() {
        quizMain.classList.add('hidden');
        quizEnd.classList.remove('hidden');
        quizScoreEl.textContent = `Du hast ${score} von ${quizData.length} Fragen richtig beantwortet.`;
    }

    startQuizBtn.addEventListener('click', startQuiz);
    nextQuestionBtn.addEventListener('click', showNextQuestion);
    restartQuizBtn.addEventListener('click', startQuiz);

    // --- SEARCH LOGIC ---
    const searchInput = document.getElementById('main-search');
    const searchResultsContainer = document.getElementById('search-results-container');

    function performSearch(query) {
        if (!query) return;

        let resultsHTML = '';
        const lowerCaseQuery = query.toLowerCase();

        // Search in Glossar
        for (const [key, value] of Object.entries(glossarData)) {
            if (key.toLowerCase().includes(lowerCaseQuery) || value.toLowerCase().includes(lowerCaseQuery)) {
                resultsHTML += `
                    <div class="card">
                        <h3>Treffer im Glossar: ${key}</h3>
                        <p>${value}</p>
                    </div>`;
            }
        }
        // Search in Modules
        for (const [modId, modDataEntry] of Object.entries(moduleData)) { // Renamed modData to modDataEntry to avoid conflict
            let foundInModule = false;
            let chapterHits = '';
            modDataEntry.chapters.forEach(chapter => {
                let chapterHit = false;
                chapter.content.forEach(item => {
                    const itemText = (typeof item.data === 'string') ? item.data : (item.data.text || (Array.isArray(item.data) ? item.data.join(' ') : ''));
                    if(itemText.toLowerCase().includes(lowerCaseQuery)) {
                        chapterHit = true;
                    }
                });
                if(chapterHit) {
                    chapterHits += `<li>${chapter.title}</li>`;
                    foundInModule = true;
                }
            });

            if(foundInModule) {
                 resultsHTML += `
                    <div class="card">
                        <h3>Treffer in Modul: ${modDataEntry.title}</h3>
                        <p>In folgenden Kapiteln wurde '${query}' gefunden:</p>
                        <ul>${chapterHits}</ul>
                        <a href="#" class="nav-to-module action-btn" data-module-id="${modId}">Zum Modul</a>
                    </div>`;
            }
        }

        searchResultsContainer.innerHTML = resultsHTML || '<p>Keine Ergebnisse gefunden.</p>';
        document.querySelectorAll('.nav-to-module').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                renderModuleContent(e.currentTarget.dataset.moduleId);
                showSection('module');
            });
        });
        showSection('search-results');
    }

    searchInput.addEventListener('search', (e) => performSearch(e.target.value));

    // --- INITIALIZATION ---
    renderDashboard();
    renderGlossar();
    showSection('dashboard');
});
