import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Upload } from 'lucide-react'
import { useStore } from '../store/hooks.js'
import MarkdownEditor from '../components/MarkdownEditor.jsx'
import { extractTitle, parseFrontMatter } from '../lib/markdown.js'
import { uid } from '../store/storage.js'

const BLOCKS_SUGGEST = ['Алгебра', 'Геометрия', 'Физика', 'Математика', 'Подготовка к экзамену']

export default function LessonEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useStore()

  const existing = state.lessons.find((l) => l.id === id)

  const [title, setTitle] = useState(existing?.title || '')
  const [block, setBlock] = useState(existing?.block || '')
  const [grade, setGrade] = useState(existing?.grade || '')
  const [tags, setTags] = useState((existing?.tags || []).join(', '))
  const [order, setOrder] = useState(existing?.order ?? state.lessons.length + 1)
  const [markdown, setMarkdown] = useState(existing?.markdown || '')
  const [fileNote, setFileNote] = useState('')

  const isEdit = Boolean(existing)

  const nextOrder = useMemo(() => state.lessons.length + 1, [state.lessons.length])

  function handleFileLoaded(text, fileName) {
    const { data, body } = parseFrontMatter(text)
    if (data.title && !title.trim()) setTitle(data.title)
    if (data.block && !block.trim()) setBlock(data.block)
    if (data.grade && !grade.trim()) setGrade(data.grade)
    if (!title.trim()) {
      const derived = extractTitle(text, '')
      if (derived) setTitle(derived)
    }
    setMarkdown(body)
    setFileNote(`Загружен файл: ${fileName}`)
  }

  function submit(event) {
    event.preventDefault()
    const finalTitle = title.trim() || extractTitle(markdown, 'Без названия')
    const lesson = {
      id: existing?.id,
      title: finalTitle,
      block: block.trim(),
      grade: grade.trim(),
      order: Number(order) || nextOrder,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      markdown,
      createdAt: existing?.createdAt,
    }

    dispatch({
      type: 'lesson/save',
      lesson: {
        ...lesson,
        id: lesson.id || uid('lesson'),
        createdAt: lesson.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
    })
    navigate('/program')
  }

  return (
    <div className="page">
      <header className="page-head">
        <div className="head-left">
          <Link className="icon-btn" to={isEdit ? `/lessons/${existing.id}` : '/program'} title="Назад">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="muted small">{isEdit ? 'Редактирование' : 'Новый урок'}</p>
            <h1>{title.trim() || 'Создание урока'}</h1>
          </div>
        </div>
        <div className="head-actions">
          <button type="submit" form="lesson-form" className="btn btn-primary">
            <Check size={16} /> Сохранить
          </button>
        </div>
      </header>

      <form id="lesson-form" className="stack" onSubmit={submit}>
        <section className="card">
          <div className="card-head">
            <h2>Параметры</h2>
            {fileNote && <span className="muted small">{fileNote}</span>}
          </div>

          <div className="form-grid">
            <label className="field">
              <span className="field-label">Название</span>
              <input
                type="text"
                value={title}
                placeholder="Квадратные уравнения"
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Блок / раздел</span>
              <input
                type="text"
                list="block-suggestions"
                value={block}
                placeholder="Алгебра"
                onChange={(e) => setBlock(e.target.value)}
              />
              <datalist id="block-suggestions">
                {BLOCKS_SUGGEST.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </label>

            <label className="field">
              <span className="field-label">Класс</span>
              <input
                type="text"
                value={grade}
                placeholder="9 класс"
                onChange={(e) => setGrade(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Порядок</span>
              <input
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </label>

            <label className="field span-2">
              <span className="field-label">Теги (через запятую)</span>
              <input
                type="text"
                value={tags}
                placeholder="экзамен, практика"
                onChange={(e) => setTags(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Содержание урока</h2>
            <span className="muted small">
              <Upload size={13} /> поддерживается front matter: title, block, grade
            </span>
          </div>
          <MarkdownEditor value={markdown} onChange={setMarkdown} onFileLoaded={handleFileLoaded} />
        </section>

        <div className="form-actions">
          <Link className="btn btn-ghost" to={isEdit ? `/lessons/${existing.id}` : '/program'}>
            Отмена
          </Link>
          <button type="submit" className="btn btn-primary">
            <Check size={16} /> Сохранить урок
          </button>
        </div>
      </form>
    </div>
  )
}
