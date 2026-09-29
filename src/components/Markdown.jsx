import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export default function Markdown({ children, className = '' }) {
  return (
    <div className={`md ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
          table: (props) => (
            <div className="md-table">
              <table {...props} />
            </div>
          ),
        }}
      >
        {children || ''}
      </ReactMarkdown>
    </div>
  )
}
