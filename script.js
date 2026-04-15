async function expand() {
    let keywordInput = document.getElementById("keyword");
    let keyword = keywordInput.value.trim();

    if (!keyword) {
        alert("Please enter a keyword");
        return;
    }

    let list = document.getElementById("result");
    list.innerHTML = "<li>⏳ Thinking...</li>";

    try {
        // Change this URL if your Render name changes!
        let res = await fetch("https://ai-keyword-expander.onrender.com/expand", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ keyword: keyword })
        });

        if (!res.ok) {
            throw new Error(`Server responded with ${res.status}`);
        }

        let data = await res.json();
        list.innerHTML = "";

        if (!data.keywords || data.keywords.length === 0) {
            list.innerHTML = "<li>No keywords found</li>";
            return;
        }

        data.keywords.forEach(k => {
            let li = document.createElement("li");
            li.innerText = k;
            list.appendChild(li);
        });

    } catch (error) {
        console.error("Fetch Error:", error);
        list.innerHTML = "<li>❌ Connection Error. Is the backend awake?</li>";
    }
}
