async function expand() {
    let keyword = document.getElementById("keyword").value.trim();

    if (!keyword) {
        alert("Please enter a keyword");
        return;
    }

    let list = document.getElementById("result");
    list.innerHTML = "<li>⏳ Processing...</li>";

    try {
        let res = await fetch("https://ai-keyword-expander.onrender.com/expand", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ keyword: keyword })
        });

        if (!res.ok) {
            throw new Error("Server error: " + res.status);
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
        console.error(error);
        list.innerHTML = "<li>❌ Error connecting to server</li>";
    }
}
