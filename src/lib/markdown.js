export function parseFrontMatter(text) {
  const source = String(text || '')
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, body: source }

  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    if (!key) continue
    let value = line.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    data[key] = value
  }

  return { data, body: source.slice(match[0].length) }
}

export function readMarkdownFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsText(file, 'utf-8')
  })
}

export function extractTitle(markdown, fallback = 'Без названия') {
  const { data, body } = parseFrontMatter(markdown)
  if (data.title) return data.title
  const heading = body.match(/^#\s+(.+)$/m)
  return heading ? heading[1].trim() : fallback
}
