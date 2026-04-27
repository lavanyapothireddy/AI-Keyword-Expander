// src/services/groqService.js
// Calls Groq API using fetch directly (browser-compatible)

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

function getApiKey() {
  return window.__GROQ_KEY_OVERRIDE__ || import.meta.env.VITE_GROQ_API_KEY
}

async function callGroq(systemPrompt, userPrompt) {
  const key = getApiKey()
  if (!key || key === 'your_groq_api_key_here') {
    throw new Error('Please set your VITE_GROQ_API_KEY in the .env file.')
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Groq API error: ${res.status}`)
  }

  const data = await res.json()
  return data.choices[0].message.content.trim()
}

// ── 1. Expand keywords into synonyms, related words & variants ───────────────
export async function expandKeywords(seedKeywords, count = 10) {
  const system = `You are a linguistic and semantic keyword expansion expert. When given seed words, you generate synonyms, related words, word variations, and semantically similar terms. Always respond ONLY with a valid JSON array of strings. No explanations, no markdown, no extra text.`

  const user = `Expand these seed keywords: ${seedKeywords.join(', ')}

Generate ${count} expanded keywords per seed word that include:
1. Direct synonyms (same/similar meaning words)
2. Related words (semantically connected terms)
3. Word form variations (noun, verb, adjective, adverb forms)
4. Broader terms (hypernyms) and narrower terms (hyponyms)
5. Contextual or domain-specific alternatives

Rules:
- Each entry must be a single word or a short 2-3 word phrase
- NO full sentences, NO questions, NO long phrases
- Keep entries concise and relevant

Return ONLY a flat JSON array like:
["swift", "rapid", "velocity", "acceleration", "fast-paced", "brisk", "nimble"]`

  const raw = await callGroq(system, user)
  return parseJsonArray(raw)
}

// ── 2. SEO intent classification ─────────────────────────────────────────────
export async function classifyIntent(keywords) {
  const system = `You are an SEO intent classifier. Classify each keyword into one of: Informational, Navigational, Commercial, or Transactional. Respond ONLY with a valid JSON array of objects. No markdown, no extra text.`

  const user = `Classify the search intent for these keywords:
${keywords.join('\n')}

Return ONLY a JSON array like:
[{"keyword": "...", "intent": "Informational", "reason": "short reason"}]`

  const raw = await callGroq(system, user)
  return parseJsonArray(raw)
}

// ── 3. Keyword clustering by topic ───────────────────────────────────────────
export async function clusterKeywords(keywords) {
  const system = `You are an SEO specialist who groups keywords into topical clusters. Respond ONLY with valid JSON. No markdown, no extra text.`

  const user = `Group these keywords into topical clusters:
${keywords.join('\n')}

Return ONLY a JSON object like:
{
  "Cluster Name": ["keyword1", "keyword2"],
  "Another Cluster": ["keyword3"]
}`

  const raw = await callGroq(system, user)
  return parseJsonObject(raw)
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseJsonArray(raw) {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const match = cleaned.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Could not parse JSON array from response.')
  return JSON.parse(match[0])
}

function parseJsonObject(raw) {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Could not parse JSON object from response.')
  return JSON.parse(match[0])
}
