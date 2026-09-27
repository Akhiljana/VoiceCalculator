
document.addEventListener('DOMContentLoaded', () => {
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnClear = document.getElementById('btn-clear');
    const btnCalculate = document.getElementById('btn-calculate');
    const keyboardInput = document.getElementById('keyboard-input');
    const expressionDisplay = document.getElementById('expression-display');
    const resultDisplay = document.getElementById('result-display');
    const errorDisplay = document.getElementById('error-display');
    const serverStatus = document.getElementById('server-status');
    const micStatus = document.getElementById('mic-status');
    const historyBody = document.getElementById('history-body');
    const btnClearHistory = document.getElementById('btn-clear-history');

    let recognition = null;
    let isListening = false;

    // Check server health
    async function checkHealth() {
        try {
            const res = await fetch('/health');
            if (res.ok) {
                serverStatus.textContent = '● Server Online';
                serverStatus.className = 'status-online';
            } else {
                throw new Error('Not ok');
            }
        } catch (e) {
            serverStatus.textContent = '● Server Offline';
            serverStatus.className = 'status-offline';
        }
    }
    
    setInterval(checkHealth, 5000);
    checkHealth();
    loadHistory();

    // Speech Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isListening = true;
            btnStart.textContent = '🔴 LISTENING...';
            btnStart.classList.add('hidden');
            btnStop.classList.remove('hidden');
            errorDisplay.textContent = '';
            expressionDisplay.textContent = 'Listening...';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            processSpeech(transcript);
        };

        recognition.onerror = (event) => {
            console.error(event.error);
            if (event.error === 'not-allowed') {
                micStatus.textContent = 'Microphone Permission Denied';
            }
            errorDisplay.textContent = 'Microphone error: ' + event.error;
            stopListening();
        };

        recognition.onend = () => {
            stopListening();
        };
    } else {
        micStatus.textContent = 'Speech Recognition Not Supported';
        btnStart.disabled = true;
    }

    function stopListening() {
        if (isListening) {
            recognition.stop();
        }
        isListening = false;
        btnStart.textContent = '🎙️ START LISTENING';
        btnStart.classList.remove('hidden');
        btnStop.classList.add('hidden');
    }

    btnStart.addEventListener('click', () => {
        if (recognition && !isListening) {
            recognition.start();
        }
    });

    btnStop.addEventListener('click', stopListening);

    btnClear.addEventListener('click', () => {
        expressionDisplay.textContent = '';
        resultDisplay.textContent = '0';
        errorDisplay.textContent = '';
        keyboardInput.value = '';
    });

    btnCalculate.addEventListener('click', () => {
        const expr = keyboardInput.value.trim();
        if (expr) {
            sendCalculation(expr);
        }
    });

    keyboardInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnCalculate.click();
        }
    });
    
    btnClearHistory.addEventListener('click', async () => {
        await fetch('/history', { method: 'DELETE' });
        loadHistory();
    });

    // Normalization mapping
    const wordToMath = {
        'plus': '+',
        'minus': '-',
        'times': '*',
        'multiplied by': '*',
        'multiply by': '*',
        'divide by': '/',
        'divided by': '/',
        'over': '/',
        'point': '.',
        'decimal': '.',
        'equals': '=',
        'square root of': 'sqrt(',
        'percent of': '* 0.01 *',
        'percent': '* 0.01',
        'open parenthesis': '(',
        'close parenthesis': ')'
    };
    
    // Simple number word to digit map for very basic cases 
    // (a full NLP parser would be better, but this handles simple words)
    const numberWords = {
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
        'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
        'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
        'eighteen': '18', 'nineteen': '19', 'twenty': '20',
        'thirty': '30', 'forty': '40', 'fifty': '50', 'sixty': '60',
        'seventy': '70', 'eighty': '80', 'ninety': '90', 'hundred': '100'
    };

    function processSpeech(transcript) {
        btnStart.textContent = '⏳ PROCESSING...';
        let normalized = transcript.toLowerCase();
        
        // Multi-word replacements first
        for (const [word, op] of Object.entries(wordToMath)) {
            normalized = normalized.split(word).join(op);
        }
        
        // Word to number basic replacement (this is simplistic but works for basic test cases)
        let words = normalized.split(' ');
        let parsed = [];
        for(let w of words) {
            if (numberWords[w]) {
                parsed.push(numberWords[w]);
            } else {
                parsed.push(w);
            }
        }
        normalized = parsed.join(' ');
        
        // Fix sqrt closing parens if used
        if (normalized.includes('sqrt(')) {
            normalized += ')';
        }

        normalized = normalized.replace(/[^0-9\+\-\*\/\.\(\)\s]/g, ''); // strip unknown chars just in case

        expressionDisplay.textContent = normalized;
        sendCalculation(normalized);
    }

    async function sendCalculation(expression) {
        try {
            const res = await fetch('/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression })
            });
            const data = await res.json();
            
            if (data.error) {
                errorDisplay.textContent = "I couldn't understand that calculation. Please try again.";
                resultDisplay.textContent = 'Error';
                btnStart.textContent = '⚠ TRY AGAIN';
            } else {
                expressionDisplay.textContent = data.expression + ' =';
                resultDisplay.textContent = data.result;
                btnStart.textContent = '✓ CALCULATION COMPLETE';
                // optionally speak result
                speakText(data.result);
                loadHistory();
            }
            
            setTimeout(() => {
                if (!isListening) {
                    btnStart.textContent = '🎙️ START LISTENING';
                }
            }, 3000);

        } catch (e) {
            errorDisplay.textContent = 'Network error or backend unavailable.';
        }
    }

    async function loadHistory() {
        try {
            const res = await fetch('/history');
            const data = await res.json();
            historyBody.innerHTML = '';
            data.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.time}</td>
                    <td>${item.expression}</td>
                    <td>${item.result}</td>
                `;
                historyBody.appendChild(tr);
            });
        } catch (e) {
            console.error("Failed to load history");
        }
    }

    function speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    }
});
