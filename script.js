async function expandKeywords() {
    const input = document.getElementById("keywordInput");
    const resultList = document.getElementById("resultList");
    const keyword = input.value.trim();

    if (!keyword) {
        alert("Please enter a word!");
        return;
    }

    resultList.innerHTML = "<li>🔍 Finding keywords...</li>";

    try {
        const response = await fetch("https://ai-keyword-expander.onrender.com", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ keyword: keyword })
        });

        if (!response.ok) {
            throw new Error("Server error or Method Not Allowed");
        }

        const data = await response.json();
        resultList.innerHTML = ""; // Clear loading text

        if (data.keywords.length === 0) {
            resultList.innerHTML = "<li>No results found.</li>";
        } else {
            data.keywords.forEach(word => {
                const li = document.createElement("li");
                li.textContent = word;
                resultList.appendChild(li);
            });
        }

    } catch (error) {
        console.error("Error:", error);
        resultList.innerHTML = "<li style='color:red;'>❌ Error connecting to backend. Make sure main.py is running!</li>";
    }
}
