import React from 'react'
import MonacoEditor, {
  EditorDidMount,
  ChangeHandler,
} from 'react-monaco-editor'
import { transformAsync, traverse } from '@babel/core'
import { DefaultButton } from '@fluentui/react'
import * as monaco from 'monaco-editor'

type SourcecodeLocation = {
  line: number
  column: number
}

type Loc = {
  start: SourcecodeLocation
  end: SourcecodeLocation
}

type Nodes = { [p: string]: Loc[] }

const parse = async (
  source: string,
  setNodes: React.Dispatch<React.SetStateAction<Nodes>>,
) => {
  const res = await transformAsync(source, {
    filename: 'file.tsx',
    ast: true,
    presets: [
      require('@babel/preset-typescript'),
      require('@babel/preset-react'),
    ],
  }).catch((err) => {
    console.log(err)
    return null
  })
  if (!res) {
    return
  }

  const { ast } = res
  if (!ast) {
    return
  }
  const nodes: Nodes = {}
  traverse(ast.program, {
    enter(nodePath) {
      const { type, loc } = nodePath.node
      if (loc === null || loc === undefined) {
        return
      }
      nodes[type] = [...(nodes[type] || []), loc]
      // console.log(nodePath)
    },
  })
  setNodes(nodes)
}

export const App: React.FC = () => {
  const [source, setSource] = React.useState('')
  const [nodes, setNodes] = React.useState<Nodes>({})
  const [cursor, setCursor] = React.useState<SourcecodeLocation>({
    line: 1,
    column: 0,
  })
  const [pressedButton, setPressedButton] = React.useState<string | undefined>(
    undefined,
  )
  const decorationsRef = React.useRef<any>([])
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>()

  React.useEffect(() => {
    parse(source, setNodes)
  }, [source])

  React.useEffect(() => {
    const ranges = pressedButton ? nodes[pressedButton] : []

    const newDecorations = ranges.map(({ start, end }) => {
      return {
        range: new monaco.Range(
          start.line,
          start.column + 1,
          end.line,
          end.column + 1,
        ),
        options: { inlineClassName: 'deco' },
      }
    })
    decorationsRef.current = editorRef.current?.deltaDecorations(
      decorationsRef.current,
      newDecorations,
    )
  }, [pressedButton, nodes])

  const handleChange: ChangeHandler = React.useCallback(
    (value, ev) => {
      setSource(value)
    },
    [setSource],
  )

  const handleDidMount: EditorDidMount = React.useCallback((editor, ev) => {
    editorRef.current = editor

    editor.focus()
    editor.onDidChangeCursorPosition((ev) => {
      // console.log(ev)
      const { lineNumber: line, column } = ev.position
      setCursor({ line, column: column - 1 })
      setPressedButton(undefined)
    })
  }, [])

  const options: monaco.editor.IEditorConstructionOptions = {
    selectOnLineNumbers: true,
    minimap: { enabled: false },
    wordWrap: 'on',
  }
  return (
    <div
      style={{
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: 'auto 600px',
      }}
    >
      <MonacoEditor
        language="typescript"
        value={source}
        onChange={handleChange}
        options={options}
        editorDidMount={handleDidMount}
      />
      <div
        style={{
          display: 'grid',
          overflowY: 'scroll',
          gridTemplateColumns: '1fr 1fr',
          height: 'fit-content',
        }}
      >
        {Object.keys(nodes)
          .sort()
          .map((key) => {
            const primary = pressedButton
              ? pressedButton === key
              : !!nodes[key].find((loc) => {
                  return !(
                    loc.start.line > cursor.line ||
                    (loc.start.line === cursor.line &&
                      loc.start.column > cursor.column) ||
                    loc.end.line < cursor.line ||
                    (loc.start.line === cursor.line &&
                      loc.end.column < cursor.column)
                  )
                })
            return (
              <DefaultButton
                key={key}
                primary={primary}
                style={{
                  width: 'calc(100% - 8px)',
                  margin: 4,
                }}
                onClick={() => {
                  setPressedButton(key)
                }}
              >
                {key}
              </DefaultButton>
            )
          })}
      </div>
    </div>
  )
}

// https://microsoft.github.io/monaco-editor/playground.html#interacting-with-the-editor-line-and-inline-decorations
