import React from 'react'
import MonacoEditor, {
  EditorDidMount,
  ChangeHandler,
} from 'react-monaco-editor'
import { transform } from '@babel/standalone'
import traverse from '@babel/traverse'
import { DefaultButton } from '@fluentui/react'
import * as monaco from 'monaco-editor'
import { parseConfigFileTextToJson } from 'typescript'
import { css } from '@emotion/core'

const conf = parseConfigFileTextToJson(
  '/tsconfig.json',
  '{ "compilerOptions": {"jsx": "react"} }',
)
monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
  conf.config.compilerOptions,
)

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
  try {
    const res = transform(source, {
      filename: 'file.tsx',
      ast: true,
      parserOpts: { plugins: ['typescript', 'jsx'] },
    })
    if (!res) {
      return
    }
    const { ast } = res
    if (!ast) {
      return
    }
    const nodes: Nodes = {}
    const ignores = ['Program']
    traverse(ast, {
      enter(nodePath) {
        if (ignores.includes(nodePath.type)) {
          return
        }
        const { type, loc } = nodePath.node
        if (loc === null || loc === undefined) {
          return
        }
        nodes[type] = [...(nodes[type] || []), loc]
        // console.log(nodePath)
      },
    })
    setNodes(nodes)
  } catch (e) {
    console.log(e)
  }
}

type Props = {
  pressedButton: string | undefined
  setPressedButton: React.Dispatch<React.SetStateAction<string | undefined>>
  type: string
  locations: Loc[]
  cursor: SourcecodeLocation
}

const Button: React.FC<Props> = ({
  pressedButton,
  type,
  locations,
  cursor,
  setPressedButton,
}) => {
  const primary = React.useMemo(() => {
    return pressedButton
      ? pressedButton === type
      : !!locations.find((loc) => {
          return !(
            loc.start.line > cursor.line ||
            (loc.start.line === cursor.line &&
              loc.start.column > cursor.column) ||
            loc.end.line < cursor.line ||
            (loc.start.line === cursor.line && loc.end.column < cursor.column)
          )
        })
  }, [cursor.column, cursor.line, type, locations, pressedButton])

  const handleClick = React.useCallback(() => {
    setPressedButton(type)
  }, [setPressedButton, type])

  return (
    <DefaultButton
      key={type}
      primary={primary}
      css={css({
        width: 'calc(100% - 8px)',
        margin: 4,
      })}
      onClick={handleClick}
    >
      {type}
    </DefaultButton>
  )
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
      css={css({
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: 'auto 600px',
      })}
    >
      <MonacoEditor
        language="plaintext"
        value={source}
        onChange={handleChange}
        options={options}
        editorDidMount={handleDidMount}
      />
      <div
        css={css({
          display: 'grid',
          overflowY: 'auto',
          gridTemplateColumns: '1fr 1fr',
          margin: '1em',
          height: 'fill-available',
        })}
      >
        {Object.keys(nodes)
          .sort()
          .map((key) => (
            <Button
              pressedButton={pressedButton}
              type={key}
              key={key}
              locations={nodes[key]}
              cursor={cursor}
              setPressedButton={setPressedButton}
            />
          ))}
      </div>
    </div>
  )
}
