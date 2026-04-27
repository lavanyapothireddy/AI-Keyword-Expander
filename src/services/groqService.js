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

// ── 2. Word type & usage classification ─────────────────────────────────────
export async function classifyIntent(keywords) {
  const system = `You are a linguistic classifier. For each keyword, identify its word type and usage context. Respond ONLY with a valid JSON array of objects. No markdown, no extra text.`
  const user = `Classify each of these keywords:
${keywords.join('\n')}

For each keyword identify:
- type: one of "Synonym", "Related Word", "Variation", "Broader Term", "Narrower Term"
- partOfSpeech: one of "Noun", "Verb", "Adjective", "Adverb", "Phrase"
- reason: one short sentence explaining the relationship to the original seed

Return ONLY a JSON array like:
[{"keyword": "swift", "type": "Synonym", "partOfSpeech": "Adjective", "reason": "Direct synonym meaning fast"}]`

  const raw = await callGroq(system, user)
  return parseJsonArray(raw)
}

// ── 3. Keyword clustering by semantic group ──────────────────────────────────
export async function clusterKeywords(keywords) {
  const system = `You are a linguistic expert who groups words into semantic clusters by meaning and usage. Respond ONLY with valid JSON. No markdown, no extra text.`
  const user = `Group these keywords into semantic clusters based on meaning similarity:
${keywords.join('\n')}

Return ONLY a JSON object like:
{
  "Cluster Name": ["word1", "word2"],
  "Another Cluster": ["word3"]
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
