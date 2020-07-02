import React from 'react'
import MonacoEditor, {
  EditorDidMount,
  ChangeHandler,
} from 'react-monaco-editor'
import { transformAsync, traverse } from '@babel/core'
import { Stack, DefaultButton } from '@fluentui/react'
import monaco from 'monaco-editor'

type Node = {
  type: string
  start: number
  end: number
}

const parse = async (
  source: string,
  setNodes: React.Dispatch<React.SetStateAction<readonly Node[]>>,
) => {
  const res = await transformAsync(source, { ast: true }).catch((err) => null)
  if (!res) {
    return
  }

  const { ast } = res
  if (!ast) {
    return
  }
  const nodes: Node[] = []
  traverse(ast.program, {
    enter(nodePath) {
      const { type, start, end } = nodePath.node
      if (start === null || end === null) {
        return
      }
      nodes.push({ type, start, end })
      // console.log(nodePath)
    },
  })
  setNodes(nodes)
}

export const App: React.FC = () => {
  const [source, setSource] = React.useState('')
  const [nodes, setNodes] = React.useState<ReadonlyArray<Node>>([])
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>()

  const handleChange: ChangeHandler = React.useCallback(
    (value, ev) => {
      setSource(value)
      parse(value, setNodes)
    },
    [setSource],
  )

  const handleDidMount: EditorDidMount = React.useCallback((editor, ev) => {
    editorRef.current = editor

    editor.focus()
    editor.onDidChangeCursorPosition((ev) => {
      console.log(ev)
    })
  }, [])

  const options: monaco.editor.IEditorConstructionOptions = {
    selectOnLineNumbers: true,
    minimap: { enabled: false },
    wordWrap: 'on',
  }
  return (
    <Stack horizontal style={{ height: '100vh' }}>
      <MonacoEditor
        language="typescript"
        value={source}
        onChange={handleChange}
        options={options}
        editorDidMount={handleDidMount}
      />
      <Stack
        style={{ minWidth: '300px', padding: '10px 20px' }}
        tokens={{ childrenGap: 10 }}
      >
        {nodes.map((node) => (
          <DefaultButton>{node.type}</DefaultButton>
        ))}
      </Stack>
    </Stack>
  )
}
