// src/services/groqService.js
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

// ── 1. Expand keywords with POS tag ─────────────────────────────────────────
export async function expandKeywords(seedKeywords, count = 10) {
  const system = `You are a linguistic and semantic keyword expansion expert. When given seed words, you generate synonyms and related words along with their part of speech. Always respond ONLY with a valid JSON array of objects. No explanations, no markdown, no extra text.`

  const user = `Expand these seed keywords: ${seedKeywords.join(', ')}

Generate ${count} expanded keywords per seed word. For each word provide:
- "word": the synonym or related word (single word or short 2-3 word phrase)
- "pos": part of speech — exactly one of: "Noun", "Verb", "Adjective", "Adverb", "Phrase"
- "type": relationship type — exactly one of: "Synonym", "Related", "Variation", "Broader", "Narrower"

Include a mix of synonyms, related words, word form variations, broader and narrower terms.
NO full sentences. Keep words concise and relevant.

Return ONLY a flat JSON array like:
[
  {"word": "swift", "pos": "Adjective", "type": "Synonym"},
  {"word": "velocity", "pos": "Noun", "type": "Related"},
  {"word": "accelerate", "pos": "Verb", "type": "Variation"}
]`

  const raw = await callGroq(system, user)
  return parseJsonArray(raw)
}

// ── 2. SEO intent classification ─────────────────────────────────────────────
export async function classifyIntent(keywords) {
  const system = `You are an SEO intent classifier. Classify each keyword into one of: Informational, Navigational, Commercial, or Transactional. Respond ONLY with a valid JSON array of objects. No markdown, no extra text.`

  const user = `Classify the search intent for these keywords:
${keywords.map(k => k.word || k).join('\n')}

Return ONLY a JSON array like:
[{"keyword": "...", "intent": "Informational", "reason": "short reason"}]`

  const raw = await callGroq(system, user)
  return parseJsonArray(raw)
}

// ── 3. Keyword clustering ─────────────────────────────────────────────────────
export async function clusterKeywords(keywords) {
  const system = `You are an SEO specialist who groups keywords into topical clusters. Respond ONLY with valid JSON. No markdown, no extra text.`

  const user = `Group these keywords into topical clusters:
${keywords.map(k => k.word || k).join('\n')}

Return ONLY a JSON object like:
{
  "Cluster Name": ["keyword1", "keyword2"],
  "Another Cluster": ["keyword3"]
}`

  const raw = await callGroq(system, user)
  return parseJsonObject(raw)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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
