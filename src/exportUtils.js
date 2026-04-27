// src/utils/exportUtils.js

export function exportToCSV(keywords, intentData, clusters) {
  const rows = [['Keyword', 'Intent', 'Intent Reason', 'Cluster']]

  const intentMap = {}
  if (intentData) {
    intentData.forEach(item => {
      intentMap[item.keyword] = { intent: item.intent, reason: item.reason }
    })
  }

  const clusterMap = {}
  if (clusters) {
    Object.entries(clusters).forEach(([clusterName, kws]) => {
      kws.forEach(kw => { clusterMap[kw] = clusterName })
    })
  }

  keywords.forEach(kw => {
    const intent = intentMap[kw]
    rows.push([
      `"${kw}"`,
      intent?.intent || '',
      intent?.reason || '',
      clusterMap[kw] || '',
    ])
  })

  const csv = rows.map(r => r.join(',')).join('\n')
  downloadFile(csv, 'keywords.csv', 'text/csv')
}

export function exportToJSON(keywords, intentData, clusters) {
  const intentMap = {}
  if (intentData) {
    intentData.forEach(item => {
      intentMap[item.keyword] = { intent: item.intent, reason: item.reason }
    })
  }

  const clusterMap = {}
  if (clusters) {
    Object.entries(clusters).forEach(([clusterName, kws]) => {
      kws.forEach(kw => { clusterMap[kw] = clusterName })
    })
  }

  const output = {
    exportedAt: new Date().toISOString(),
    totalKeywords: keywords.length,
    keywords: keywords.map(kw => ({
      keyword: kw,
      intent: intentMap[kw]?.intent || null,
      intentReason: intentMap[kw]?.reason || null,
      cluster: clusterMap[kw] || null,
    })),
    clusters: clusters || {},
  }

  downloadFile(JSON.stringify(output, null, 2), 'keywords.json', 'application/json')
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
