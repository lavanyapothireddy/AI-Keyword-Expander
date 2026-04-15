// Replace this with your actual Render URL
const API_URL = "https://ai-keyword-expander.onrender.com/expand";

async function expandKeyword() {
    const keywordInput = document.getElementById('keywordInput');
    const resultDiv = document.getElementById('result');
    const keyword = keywordInput.value.trim();

    if (!keyword) {
        alert("Please enter a keyword first!");
        return;
    }

    // Show loading state
    resultDiv.innerHTML = `
        <div class="loading">
            <p>🤖 AI is thinking...</p>
            <small>(The first search might take 30-60 seconds to wake up the AI model)</small>
        </div>
    `;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ keyword: keyword })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // Clear and display results
        if (data.keywords && data.keywords.length > 0) {
            resultDiv.innerHTML = `<h3>Suggestions for "${data.keyword}":</h3>`;
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
            resultDiv.innerHTML = "<p>No synonyms found. Try another word!</p>";
        }

    } catch (error) {
        console.error("Fetch Error:", error);
        resultDiv.innerHTML = `
            <p style="color: red;">❌ Error connecting to backend.</p>
            <p><small>Check if the Render URL is correct and try again in 1 minute.</small></p>
        `;
    }
}
