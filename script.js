// DOM Elements
const listenBtn = document.getElementById('listenBtn');
const questionEl = document.getElementById('question');
const answerEl = document.getElementById('answer');
const textInputForm = document.getElementById('text-input-form');
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');

// Check for browser support for Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    alert("Sorry, your browser does not support the Web Speech API. Please use Chrome or Edge.");
}
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

/**
 * Speaks a given text using the Web Speech Synthesis API.
 * @param {string} text - The text to be spoken.
 */
function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
}

/**
 * Updates the UI to display the question and answer bubbles.
 * @param {string} questionText - The user's question.
 * @param {string} answerText - The AI's answer.
 */
function updateUI(questionText, answerText) {
    questionEl.textContent = `You: ${questionText}`;
    questionEl.style.display = 'block';
    answerEl.textContent = `Gemini: ${answerText}`;
    answerEl.style.display = 'block';
}

/**
 * Disables all inputs and fetches an answer from the backend.
 * @param {string} promptText - The user's transcribed question.
 */
async function getGeminiAnswer(promptText) {
    // Disable all input methods
    listenBtn.textContent = 'Thinking...';
    listenBtn.disabled = true;
    textInput.disabled = true;
    sendBtn.disabled = true;

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText }),
        });

        if (!response.ok) throw new Error(`API error: ${response.statusText}`);

        const data = await response.json();
        const text = data.text;
        
        updateUI(promptText, text);
        speak(text);

    } catch (error) {
        console.error("Error fetching from backend:", error);
        const errorMessage = "Sorry, I couldn't get an answer. Please check the console for details.";
        updateUI(promptText, errorMessage);
        speak(errorMessage);
    } finally {
        // Re-enable all input methods
        listenBtn.textContent = 'Ask Gemini';
        listenBtn.disabled = false;
        textInput.disabled = false;
        sendBtn.disabled = false;
    }
}

// --- EVENT LISTENERS ---

// Listener for the voice button
listenBtn.addEventListener('click', () => {
    recognition.start();
});

// Listener for the text input form
textInputForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Stop the page from reloading
    const promptText = textInput.value.trim();
    if (promptText) {
        getGeminiAnswer(promptText);
        textInput.value = ''; // Clear the input field
    }
});

// --- SPEECH RECOGNITION EVENTS ---

recognition.onstart = () => {
    listenBtn.textContent = 'Listening...';
    listenBtn.disabled = true;
};

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    getGeminiAnswer(transcript);
};

recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    listenBtn.textContent = 'Ask Gemini';
    listenBtn.disabled = false;
};

recognition.onend = () => {
    // Re-enable button only if we are not already waiting for Gemini
    if (listenBtn.textContent === 'Listening...') {
        listenBtn.textContent = 'Ask Gemini';
        listenBtn.disabled = false;
    }
};
