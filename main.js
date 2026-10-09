const chatConsole = document.getElementById('chatConsole');
const promptInput = document.getElementById('promptInput');
const submitBtn = document.getElementById('submitBtn');
const statusText = document.getElementById('statusText');
const modelSelector = document.getElementById('modelSelector');

function getBestMatch(userInput, responsesDict) {
    const text = userInput.toLowerCase().trim();
    if (responsesDict[text]) return text;
    
    let bestKey = null;
    let maxScore = 0.0;
    
    for (const key in responsesDict) {
        const userSet = new Set(text);
        const keySet = new Set(key.toLowerCase());
        const intersection = new Set([...userSet].filter(x => keySet.has(x)));
        const score = intersection.size / Math.max(text.length, key.length);
        
        if (score > maxScore && score > 0.35) {
            maxScore = score;
            bestKey = key;
        }
    }
    return bestKey;
}

async function handleExecution() {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    chatConsole.innerHTML += `
        <div class="message user">
            <div class="avatar">Вы</div>
            <div class="text">${prompt}</div>
        </div>
    `;
    promptInput.value = '';
    chatConsole.scrollTop = chatConsole.scrollHeight;

    statusText.innerText = "Вычисления...";

    try {
        const targetModel = modelSelector.value;
        const response = await fetch(`./${targetModel}`);
        if (!response.ok) throw new Error(`Файл модели '${targetModel}' не найден!`);
        
        const modelData = await response.json();
        const responses = modelData.responses || {};
        const matchedKey = getBestMatch(prompt, responses);
        
        let output = "";
        let badgeText = "";

        if (matchedKey) {
            output = responses[matchedKey];
            badgeText = `Переход: ${matchedKey}`;
        } else if (modelData.random_code_pool && modelData.random_code_pool.length > 0) {
            const pool = modelData.random_code_pool;
            output = pool[Math.floor(Math.random() * pool.length)];
            badgeText = "Случайная генерация";
        } else {
            output = modelData.default_response || "Запрос не распознан.";
            badgeText = "Фолбек";
        }

        chatConsole.innerHTML += `
            <div class="message ai">
                <div class="avatar">${modelData.model_name || '🤖'}</div>
                <div class="text"><strong>[${modelData.model_name || 'ИИ'} | ${badgeText}]:</strong>\n${output}</div>
            </div>
        `;
        statusText.innerText = "Ядро готово";

    } catch (err) {
        chatConsole.innerHTML += `
            <div class="message system"><div class="avatar">⚠️</div><div class="text">Ошибка: ${err.message}</div></div>
        `;
        statusText.innerText = "Ошибка";
    }
    chatConsole.scrollTop = chatConsole.scrollHeight;
}

submitBtn.addEventListener('click', handleExecution);
promptInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleExecution(); });
