import { useRef, useState } from 'react'
import { Eye, FileText, PencilLine, Upload } from 'lucide-react'
import Markdown from './Markdown.jsx'
import { readMarkdownFile } from '../lib/markdown.js'

export default function MarkdownEditor({ value, onChange, onFileLoaded, rows = 18 }) {
  const [tab, setTab] = useState('write')
  const fileRef = useRef(null)

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await readMarkdownFile(file)
      if (onFileLoaded) {
        onFileLoaded(text, file.name)
      } else {
        onChange(text)
      }
    } catch (err) {
      alert(err.message || 'Не удалось прочитать файл')
    }
  }

  return (
    <div className="editor">
      <div className="editor-toolbar">
        <div className="editor-tabs">
          <button
            type="button"
            className={`tab${tab === 'write' ? ' active' : ''}`}
            onClick={() => setTab('write')}
          >
            <PencilLine size={15} /> Текст
          </button>
          <button
            type="button"
            className={`tab${tab === 'preview' ? ' active' : ''}`}
            onClick={() => setTab('preview')}
          >
            <Eye size={15} /> Превью
          </button>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> Загрузить .md
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          hidden
          onChange={handleFile}
        />
      </div>

      <div className="editor-panes">
        <div className={`editor-pane${tab === 'write' ? ' is-active' : ''}`}>
          <div className="pane-label">
            <FileText size={14} /> Markdown · формулы $...$ и $$...$$
          </div>
          <textarea
            className="editor-input"
            value={value}
            rows={rows}
            spellCheck={false}
            placeholder={'# Заголовок урока\n\nТекст с формулой $E = mc^2$\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$'}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <div className={`editor-pane${tab === 'preview' ? ' is-active' : ''}`}>
          <div className="pane-label">
            <Eye size={14} /> Предпросмотр
          </div>
          <div className="editor-preview">
            <Markdown>{value || '_Пусто_'}</Markdown>
          </div>
        </div>
      </div>
    </div>
  )
}
