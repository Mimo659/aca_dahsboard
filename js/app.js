// JSON data will be loaded using fetch

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded event fired. Initializing script.');

    // Global variables to store fetched data
    let examData;
    let moduleData = {}; // Will be populated after fetching individual module files
    let quizData;
    const glossarData = {}; // Assuming no separate glossary file for now - can be fetched if a file exists

    // --- DOM ELEMENT SELECTORS ---
    // Defined once, accessible to all functions within initializeAppLogic
    const mainNav = document.getElementById('main-nav');
    const navElement = document.querySelector('header nav');
    const burgerMenu = document.getElementById('burger-menu');
    const contentSections = document.querySelectorAll('.content-section');
    const dashboardSection = document.getElementById('dashboard');
    const moduleSection = document.getElementById('module');
    const moduleOverview = document.getElementById('module-overview');
    const moduleContent = document.getElementById('module-content');
    const tooltip = document.getElementById('tooltip');
    const glossarList = document.getElementById('glossar-list');
    const glossarFilter = document.getElementById('glossar-filter');
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
    const searchInput = document.getElementById('main-search');
    const searchResultsContainer = document.getElementById('search-results-container');


    async function fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    async function loadAllData() {
        console.log('Attempting to load all JSON data...');
        try {
            const results = await Promise.all([
                fetchData('../data/exam_results.json'),
                fetchData('../data/modul1.json'),
                fetchData('../data/modul2.json'),
                fetchData('../data/modul3.json'),
                fetchData('../data/modul4.json'),
                fetchData('../data/modul5.json'),
                fetchData('../data/quiz_questions.json')
                // Add fetch for glossar.json here if it exists, then adjust indices below
            ]);

            examData = results[0];
            moduleData = { // Reconstruct moduleData object
                modul1: results[1],
                modul2: results[2],
                modul3: results[3],
                modul4: results[4],
                modul5: results[5],
            };
            quizData = results[6];
            // glossarData = results[7]; // if fetched and glossar.json exists

            console.log('All JSON data loaded successfully.');
            return true;
        } catch (error) {
            console.error('Failed to load application data:', error);
            if (dashboardSection) {
                 dashboardSection.innerHTML = `<p style="color:red;">Kritischer Fehler: Basisdaten konnten nicht geladen werden. Die Anwendung kann nicht gestartet werden. Details: ${error.message}</p>`;
                 // Attempt to make the dashboard section visible to show the error
                 const allSections = document.querySelectorAll('.content-section'); // Re-query in this specific error scope
                 allSections.forEach(s => s.classList.remove('active')); // s.style.display = 'none' might be more direct if classes aren't fully set up
                 dashboardSection.classList.add('active'); // dashboardSection.style.display = 'block';
            } else {
                // Fallback if dashboardSection itself is not found
                document.body.innerHTML = `<p style="color:red; padding: 20px;">Kritischer Fehler: Basisdaten konnten nicht geladen werden UND Dashboard-Element nicht gefunden. Details: ${error.message}</p>`;
            }
            return false;
        }
    }

    function initializeAppLogic() {
        console.log('Initializing application logic with fetched data.');

        // --- NAVIGATION LOGIC ---
        function showSection(targetId) {
            console.log(`showSection called with targetId: ${targetId}`);
            try {
                contentSections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === targetId) {
                        section.classList.add('active');
                        console.log(`Section ${targetId} activated.`);
                    }
                });
                document.querySelectorAll('#main-nav a').forEach(link => {
                 link.classList.remove('active');
                 if(link.getAttribute('href') === `#${targetId}`) {
                     link.classList.add('active');
                 }
                });
                if(navElement && window.innerWidth <= 992) navElement.classList.remove('active');
                if(targetId === 'module') {
                    console.log('Target is module, calling renderModulesOverview.');
                    renderModulesOverview();
                }
            } catch (error) {
                console.error(`Error in showSection for targetId ${targetId}:`, error);
            }
        }

        if (mainNav) {
            mainNav.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') {
                    e.preventDefault();
                    const targetId = e.target.getAttribute('href').substring(1);
                    if(navElement && window.innerWidth <= 992 && navElement.classList.contains('active')) {
                        navElement.classList.remove('active');
                    }
                    showSection(targetId);
                }
            });
        } else {
            console.error("mainNav element not found.");
        }


        if (burgerMenu && navElement) {
            burgerMenu.addEventListener('click', () => {
                navElement.classList.toggle('active');
            });
        } else {
            console.error('Burger menu or nav element not found for event listener attachment!');
        }

        // --- DASHBOARD RENDERING ---
        function renderDashboard() {
            console.log('renderDashboard called.');
            try {
                if (!examData || !examData.moduleScores || typeof examData.totalScore === 'undefined') {
                    console.error('Exam data is missing or incomplete for renderDashboard.', examData);
                    if(dashboardSection) dashboardSection.innerHTML = '<p style="color:red;">Fehler: Dashboard-Daten konnten nicht geladen werden (fehlende Prüfungsdaten).</p>';
                    return;
                }
                if (!dashboardSection) {
                    console.error('Dashboard section element not found in DOM.');
                    return;
                }

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
                                ${sortedModules.length > 0 ? `<li><a href="#" data-module-id="${sortedModules[0].id}"><strong>Starte hier:</strong> ${sortedModules[0].name} (${sortedModules[0].score}%)</a></li>` : ''}
                                ${sortedModules.length > 1 ? `<li><a href="#" data-module-id="${sortedModules[1].id}"><strong>Nächster Schritt:</strong> ${sortedModules[1].name} (${sortedModules[1].score}%)</a></li>` : ''}
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
                console.log('Dashboard section HTML populated.');

                document.querySelectorAll('#recommended-learning a').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const moduleId = e.currentTarget.dataset.moduleId;
                        renderModuleContent(moduleId);
                        showSection('module');
                    });
                });

                renderDashboardModules();
            } catch (error) {
                console.error('Error in renderDashboard:', error);
                if (dashboardSection) {
                    dashboardSection.innerHTML = `<p style="color:red;">Ein Fehler ist beim Laden des Dashboards aufgetreten. Details siehe Konsole.</p>`;
                }
            }
        }

        function getScoreColor(score) {
            if (score > 80) return 'var(--color-good)';
            if (score > 60) return 'var(--color-medium)';
            return 'var(--color-weak)';
        }

        // --- MODULE RENDERING ---
        function createModuleCardHTML(modScore, modDetails) {
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
            `;
        }

        function renderModulesOverview() {
            if (!moduleContent || !moduleOverview) { console.error("Module overview/content DOM elements not found."); return; }
            moduleContent.classList.add('hidden');
            moduleOverview.classList.remove('hidden');

            let overviewHTML = `<h2>Alle Module</h2>`;
            if (!examData || !examData.moduleScores) {
                console.error("Missing examData.moduleScores for renderModulesOverview");
                if (moduleOverview) moduleOverview.innerHTML = overviewHTML + "<p style='color:red;'>Moduldaten nicht verfügbar.</p>";
                return;
            }
            overviewHTML += examData.moduleScores.map(modScore => {
                const modDetails = moduleData[modScore.id];
                return createModuleCardHTML(modScore, modDetails);
            }).join('');
            moduleOverview.innerHTML = overviewHTML;

            moduleOverview.querySelectorAll('.module-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    renderModuleContent(e.currentTarget.dataset.moduleId);
                    showSection('module');
                });
            });
        }

        function renderDashboardModules() {
            console.log('renderDashboardModules called.');
            const dashboardModuleCardsContainer = document.getElementById('dashboard-module-cards');
            if (!dashboardModuleCardsContainer) {
                console.error('Dashboard module cards container (#dashboard-module-cards) not found in DOM.');
                return;
            }

            try {
                if (!examData || !examData.moduleScores) {
                    console.error('Exam data for module cards is missing or incomplete.', examData);
                    dashboardModuleCardsContainer.innerHTML = '<p style="color:red;">Fehler: Modulübersicht konnte nicht geladen werden (fehlende Moduldaten).</p>';
                    return;
                }

                let dashboardModulesHTML = `<h2>Schnellzugriff Module</h2>`;
                dashboardModulesHTML += examData.moduleScores.map(modScore => {
                    const modDetails = moduleData[modScore.id];
                    if (!modDetails) {
                        console.warn(`Details for module ID ${modScore.id} not found in moduleData. Card may be incomplete.`);
                    }
                    return createModuleCardHTML(modScore, modDetails);
                }).join('');
                dashboardModuleCardsContainer.innerHTML = dashboardModulesHTML;
                console.log('Dashboard module cards container HTML populated.');

                dashboardModuleCardsContainer.querySelectorAll('.module-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        renderModuleContent(e.currentTarget.dataset.moduleId);
                        showSection('module');
                    });
                });
            } catch (error) {
                console.error('Error in renderDashboardModules:', error);
                if (dashboardModuleCardsContainer) {
                    dashboardModuleCardsContainer.innerHTML = `<p style="color:red;">Ein Fehler ist beim Laden der Modulübersicht aufgetreten. Details siehe Konsole.</p>`;
                }
            }
        }

        function renderModuleContent(moduleId) {
            if (!moduleOverview || !moduleContent || !moduleData) { console.error("Required elements/data missing for renderModuleContent"); return; }
            moduleOverview.classList.add('hidden');
            moduleContent.classList.remove('hidden');

            const mod = moduleData[moduleId];
            if (!mod) {
                if (moduleContent) moduleContent.innerHTML = `<p>Inhalt für Modul ${moduleId} nicht gefunden.</p>`;
                return;
            }

            let contentHTML = `
                <button id="back-to-modules">← Zurück zur Modulübersicht</button>
                <h2>${mod.title}</h2>
                <div class="module-content-container">
            `;

            if (mod.chapters && Array.isArray(mod.chapters)) {
                mod.chapters.forEach(chapter => {
                    contentHTML += `<div class="chapter"><h3>${chapter.title}</h3>`;
                    if (chapter.content && Array.isArray(chapter.content)) {
                        chapter.content.forEach(item => {
                            switch(item.type) {
                                case 'p': contentHTML += `<p>${item.data}</p>`; break;
                                case 'h3': contentHTML += `<h4>${item.data}</h4>`; break;
                                case 'ul': contentHTML += `<ul>${item.data.map(li => `<li>${li}</li>`).join('')}</ul>`; break;
                                case 'ol': contentHTML += `<ol>${item.data.map(li => `<li>${li}</li>`).join('')}</ol>`; break;
                                case 'blockquote': contentHTML += `<blockquote>${item.data}</blockquote>`; break;
                                case 'image_placeholder': contentHTML += `<div class="card" style="text-align: center; border-color: var(--accent-color-3);">${item.data}</div>`; break;
                                case 'exercise': if(item.data) contentHTML += `<div class="exercise"><h4>${item.data.title}</h4><p>${item.data.text}</p></div>`; break;
                            }
                        });
                    }
                    contentHTML += `</div>`;
                });
            }
            contentHTML += `</div>`;
            moduleContent.innerHTML = contentHTML;

            const backButton = document.getElementById('back-to-modules');
            if (backButton) {
                backButton.addEventListener('click', renderModulesOverview);
            }
            linkGlossarTerms();
        }

        function linkGlossarTerms() {
            const contentContainer = moduleContent ? moduleContent.querySelector('.module-content-container') : null;
            if (!contentContainer) return;

            const glossarKeys = Object.keys(glossarData); // glossarData is currently empty
            if (glossarKeys.length === 0) return;

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
            if(!tooltip || !glossarData) return;
            const term = e.target.dataset.term;
            tooltip.textContent = glossarData[term];
            tooltip.style.left = `${e.pageX + 10}px`;
            tooltip.style.top = `${e.pageY + 10}px`;
            tooltip.classList.remove('hidden');
        }

        function hideTooltip() {
            if(!tooltip) return;
            tooltip.classList.add('hidden');
        }

        // --- GLOSSAR LOGIC ---
        function renderGlossar() {
            if(!glossarList) { console.error("Glossar list element not found."); return; }
            // glossarData is currently empty. If it were populated by fetch, this would work.
            glossarList.innerHTML = Object.entries(glossarData).map(([term, definition]) => `
                <li data-term="${term.toLowerCase()}">
                    <strong>${term}</strong>
                    <p>${definition}</p>
                </li>
            `).join('');
        }
        if (glossarFilter) {
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
        } else {
            console.warn("Glossar filter input not found.");
        }

        // --- QUIZ LOGIC ---
        let currentQuestionIndex = 0;
        let score = 0;

        function startQuiz() {
            if (!quizStart || !quizEnd || !quizMain || !nextQuestionBtn || !quizFeedback || !quizData) {
                 console.error("One or more quiz DOM elements or quizData are missing."); return;
            }
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
            if (!questionContainer || !quizData || !quizData[currentQuestionIndex]) {
                console.error("Question container or quiz data missing for renderQuestion");
                if(questionContainer) questionContainer.innerHTML = "<p style='color:red;'>Quizfrage nicht ladbar.</p>";
                return;
            }
            const question = quizData[currentQuestionIndex];
            if (!question.options || !question.correctAnswer) {
                console.error("Question data is malformed (missing options or correctAnswer)", question);
                if(questionContainer) questionContainer.innerHTML = "<p style='color:red;'>Quizfrage defekt.</p>";
                return;
            }
            let options = [...question.options, question.correctAnswer];
            options.sort(() => Math.random() - 0.5);

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
            if (!quizFeedback || !quizData || !quizData[currentQuestionIndex] || !nextQuestionBtn) {
                console.error("Required elements/data missing for handleAnswer"); return;
            }
            const selectedAnswer = e.target.textContent;
            const correctAnswer = quizData[currentQuestionIndex].correctAnswer;

            quizFeedback.classList.remove('hidden', 'feedback-correct', 'feedback-incorrect');
            if (selectedAnswer === correctAnswer) {
                score++;
                quizFeedback.innerHTML = "<strong>Korrekt!</strong>";
                quizFeedback.classList.add('feedback-correct');
            } else {
                quizFeedback.innerHTML = `<strong>Falsch.</strong> Richtig wäre: <em>${correctAnswer}</em>. <br><small>${quizData[currentQuestionIndex].explanation || ''}</small>`;
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
            if (!quizData) { console.error("quizData missing in showNextQuestion"); return; }
            currentQuestionIndex++;
            if (currentQuestionIndex < quizData.length) {
                if(quizFeedback) quizFeedback.innerHTML = '';
                if(quizFeedback) quizFeedback.classList.add('hidden');
                if(nextQuestionBtn) nextQuestionBtn.classList.add('hidden');
                renderQuestion();
            } else {
                endQuiz();
            }
        }

        function endQuiz() {
            if(!quizMain || !quizEnd || !quizScoreEl || !quizData) { console.error("Required elements/data missing for endQuiz"); return; }
            quizMain.classList.add('hidden');
            quizEnd.classList.remove('hidden');
            quizScoreEl.textContent = `Du hast ${score} von ${quizData.length} Fragen richtig beantwortet.`;
        }

        if(startQuizBtn) startQuizBtn.addEventListener('click', startQuiz);
        else console.warn("Start quiz button not found.");
        if(nextQuestionBtn) nextQuestionBtn.addEventListener('click', showNextQuestion);
        else console.warn("Next question button not found.");
        if(restartQuizBtn) restartQuizBtn.addEventListener('click', startQuiz);
        else console.warn("Restart quiz button not found.");

        // --- SEARCH LOGIC ---
        function performSearch(query) {
            if (!query || !searchResultsContainer) {
                if(searchResultsContainer) searchResultsContainer.innerHTML = '<p>Bitte Suchbegriff eingeben.</p>';
                return;
            }

            let resultsHTML = '';
            const lowerCaseQuery = query.toLowerCase();

            for (const [key, value] of Object.entries(glossarData)) {
                if (key.toLowerCase().includes(lowerCaseQuery) || value.toLowerCase().includes(lowerCaseQuery)) {
                    resultsHTML += `<div class="card"><h3>Treffer im Glossar: ${key}</h3><p>${value}</p></div>`;
                }
            }
            if (moduleData) {
                for (const [modId, modDataEntry] of Object.entries(moduleData)) {
                    if (!modDataEntry || !modDataEntry.chapters || !Array.isArray(modDataEntry.chapters)) continue;
                    let foundInModule = false;
                    let chapterHits = '';
                    modDataEntry.chapters.forEach(chapter => {
                        if(!chapter.content || !Array.isArray(chapter.content)) return;
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
        if (searchInput) {
            searchInput.addEventListener('search', (e) => performSearch(e.target.value));
        } else {
            console.warn("Search input not found.");
        }

        // --- INITIALIZATION ---
        console.log('Running final initialization steps inside initializeAppLogic...');
        if (typeof renderDashboard === 'function') renderDashboard(); else console.error("renderDashboard is not defined");
        if (typeof renderGlossar === 'function') renderGlossar(); else console.error("renderGlossar is not defined");
        if (typeof showSection === 'function') showSection('dashboard'); else console.error("showSection is not defined");
        console.log('initializeAppLogic complete.');
    } // End of initializeAppLogic

    // --- SCRIPT EXECUTION START ---
    // Load data, then initialize the rest of the app
    const dataLoadedSuccessfully = await loadAllData();
    if (dataLoadedSuccessfully) {
        if (typeof initializeAppLogic === 'function') {
            initializeAppLogic();
        } else {
            console.error("initializeAppLogic function is not defined. Critical error.");
            if(dashboardSection) dashboardSection.innerHTML = "<p style='color:red;'>Fehler: App-Initialisierungsfunktion nicht gefunden.</p>";
        }
    } else {
        console.error("Application initialization aborted due to data loading failure.");
        // Error message to user should have already been displayed by loadAllData()
    }

}); // End of DOMContentLoaded
