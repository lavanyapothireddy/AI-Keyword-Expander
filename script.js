const API_URL = "https://ai-keyword-expander.onrender.com/expand";

async function expandKeyword() {
    const keywordInput = document.getElementById('keywordInput');
    const resultDiv = document.getElementById('result');
    const keyword = keywordInput.value.trim();

    if (!keyword) {
        alert("Please enter a word!");
        return;
    }

    // 1. Show Loading UI
    resultDiv.innerHTML = `
        <div class="loading">
            <p>🤖 AI is loading the model...</p>
            <small>This takes about 40 seconds on the first search.</small>
        </div>
    `;

    try {
        // 2. Send request to Render
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ keyword: keyword })
        });

        if (!response.ok) {
            throw new Error("Server is still waking up...");
        }

        const data = await response.json();

        // 3. Display Results
        if (data.keywords && data.keywords.length > 0) {
            resultDiv.innerHTML = `<h3>Results for "${data.keyword}":</h3>`;
            const list = document.createElement('div');
            list.className = "keyword-list";

            data.keywords.forEach(word => {
                const span = document.createElement('span');
                span.className = "keyword-tag";
                span.innerText = word;
                list.appendChild(span);
            });

            resultDiv.appendChild(list);
        } else {
            resultDiv.innerHTML = "<p>No common synonyms found. Try another word!</p>";
        }

    } catch (error) {
        console.error("Error:", error);
        resultDiv.innerHTML = `
            <p style="color: #d32f2f;">❌ Connection failed.</p>
            <p><small>The AI is still loading. Please wait 30 seconds and click 'Expand' again.</small></p>
        `;
    }
}
