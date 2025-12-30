// 1. Only declare this ONCE at the very top
let questionsData = []; 
let currentQuestionIndex = 0;
const EXAM_DURATION = 30; 
let timeRemaining = EXAM_DURATION * 60; 
let timerInterval;

// --- Function to fetch questions from Python ---
async function loadQuestionsFromBackend() {
    try {
        const response = await fetch('http://127.0.0.1:5000/get-questions');
        const data = await response.json();
        questionsData = data;
        renderQuestion();
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

// This function "grabs" the letter (A, B, C, or D) you clicked
function saveCurrentAnswer() {
    // Look for the radio button that is "checked"
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    
    if (selectedOption) {
        // Save it into our questionsData list so Python can see it later
        questionsData[currentQuestionIndex].answer = selectedOption.value;
        console.log("Saved answer:", selectedOption.value);
    }
}

// --- Function to draw the question on the screen ---
function renderQuestion() {
    if (questionsData.length === 0) return;

    const question = questionsData[currentQuestionIndex];
    
    // Check if these IDs exist in your HTML before using them
    const qNumElement = document.getElementById('question-number');
    const qTextElement = document.getElementById('question-text');
    const optionsContainer = document.querySelector('.option-container');

    if (qNumElement) qNumElement.textContent = `Question ${currentQuestionIndex + 1} of ${questionsData.length}`;
    if (qTextElement) qTextElement.textContent = question.text;

    if (optionsContainer) {
        optionsContainer.innerHTML = ''; 
        for (const key in question.options) {
            const label = document.createElement('label');
            label.className = 'option-item';

            label.innerHTML = `
                <input type="radio" name="answer" value="${key}" ${question.answer === key ? 'checked' : ''}>
                <span class="option-text">${key}. ${question.options[key]}</span>
            `;
            optionsContainer.appendChild(label);
        }
    }
    updateNavigationGrid();
}

function updateNavigationGrid() {
    const grid = document.getElementById('question-navigation-grid');
    if (!grid) return;
    grid.innerHTML = '';
    questionsData.forEach((q, index) => {
        const button = document.createElement('button');
        button.textContent = index + 1;
        button.className = index === currentQuestionIndex ? 'nav-q-btn current' : 'nav-q-btn';
        button.onclick = () => { currentQuestionIndex = index; renderQuestion(); };
        grid.appendChild(button);
    });
}
// This function packs up your answers and sends them to Python
async function submitExam() {
    if (!confirm("Are you sure you want to submit your exam?")) return;

    try {
        const response = await fetch('http://127.0.0.1:5000/submit-exam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // CRITICAL: This allows the session cookie to be sent to Python
            credentials: 'include', 
            body: JSON.stringify(questionsData),
        });

        const result = await response.json();

        if (result.status === "success") {
            // Success! The alert is removed for an instant redirect
            window.location.href = 'results.html';
        } else {
            // We keep the failure alert so the student knows why it didn't work
            alert("Submission failed: " + result.message);
        }
    } catch (error) {
        console.error("Submission error:", error);
        alert("Server error: Could not submit exam. Check if Python is running.");
    }
}

// --- WAIT FOR HTML TO BE READY BEFORE ADDING BUTTON CLICKS ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Check if buttons exist before adding "click" instructions
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-exam-btn');

    if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        saveCurrentAnswer(); // Save what was picked BEFORE moving
        if (currentQuestionIndex < questionsData.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        }
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        saveCurrentAnswer(); // Save answer before going back
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion();
        }
    });
}

if (submitBtn) {
    submitBtn.addEventListener('click', () => {
        saveCurrentAnswer(); // Save the final answer
        submitExam(); // Now send the full list to Python
    });
}

    // Now call the Librarian
    loadQuestionsFromBackend();
});

function startTimer() {
    const timerDisplay = document.getElementById('timer'); // Make sure you have <div id="timer"></div> in HTML
    
    timerInterval = setInterval(() => {
        let minutes = Math.floor(timeRemaining / 60);
        let seconds = timeRemaining % 60;

        // Add a leading zero to seconds (e.g., 09 instead of 9)
        seconds = seconds < 10 ? '0' + seconds : seconds;

        if (timerDisplay) {
            timerDisplay.textContent = `Time Remaining: ${minutes}:${seconds}`;
        }

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert("Time is up! Submitting your exam automatically.");
            submitExam(); // Auto-submit when time hits zero
        }

        timeRemaining--;
    }, 1000);
}

// Update your loadQuestionsFromBackend to start the timer
async function loadQuestionsFromBackend() {
    try {
        const response = await fetch('http://127.0.0.1:5000/get-questions', { credentials: 'include' });
        const data = await response.json();
        questionsData = data;
        renderQuestion();
        startTimer(); // <--- START THE CLOCK HERE
    } catch (error) {
        console.error("Fetch error:", error);
    }
}