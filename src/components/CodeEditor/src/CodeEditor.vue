<template>
    <div class="code-editor" ref="editorContainer"></div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { json } from '@codemirror/lang-json'
import { linter, lintGutter } from '@codemirror/lint'
import { jsonParseLinter } from '@codemirror/lang-json'
import { EditorState } from '@codemirror/state'

const props = defineProps({
    value: {
        type: [Object, Array, String],
        default: ''
    },
    readonly: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:value', 'error'])

const editorContainer = ref(null)
let view = null

const formatJson = (value) => {
    if (typeof value === 'string') {
        try {
            return JSON.stringify(JSON.parse(value), null, 2)
        } catch (e) {
            return value
        }
    }
    return JSON.stringify(value, null, 2)
}

const createEditorState = (doc) => {
    return EditorState.create({
        doc,
        extensions: [
            basicSetup,
            json(),
            lintGutter(),
            linter(jsonParseLinter()),
            EditorState.readOnly.of(props.readonly),
            EditorView.updateListener.of(update => {
                if (update.docChanged) {
                    const value = update.state.doc.toString()
                    try {
                        const parsed = JSON.parse(value)
                        emit('update:value', parsed)
                        emit('error', null)
                    } catch (e) {
                        emit('error', e.message)
                    }
                }
            })
        ]
    })
}

onMounted(() => {
    nextTick(() => {
        const initialDoc = props.value ? formatJson(props.value) : ''
        view = new EditorView({
            state: createEditorState(initialDoc),
            parent: editorContainer.value
        })
    })
})

watch(() => props.value, (newValue) => {
    if (view) {
        const formatted = formatJson(newValue)
        if (view.state.doc.toString() !== formatted) {
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: formatted }
            })
        }
    }
})

watch(() => props.readonly, (newValue) => {
    if (view) {
        view.dispatch({
            effects: EditorState.readOnly.reconfigure(newValue)
        })
    }
})
</script>

<style lang="less">
.code-editor {
    width: 100%;
    height: 100%;

    .cm-editor {
        height: 100%;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
    }

    .ͼ1 {
        .cm-gutter-lint {
            width: 2px;

            .cm-gutterElement {
                padding: 0;
                position: absolute;
                left: 0px;
            }
        }


        .cm-lint-marker {
            width: 0.6em;
            height: 100%;
            background: #ff00004d;
        }

        .cm-lint-marker-error {
            content: none;
        }
    }

    .ͼ2 {
        .cm-gutters {
            border-right: 1px solid var(--border-color);
            background-color: var(--component-bg-color);
        }

        .cm-activeLineGutter {
            background-color: var(--hover-bg-color);
        }
    }

    .cm-scroller {
        overflow: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--hover-bg-color) transparent;

        &::-webkit-scrollbar {
            width: 4px;
            height: 4px;
        }

        &::-webkit-scrollbar-track {
            background: var(--hover-bg-color);
        }

        &::-webkit-scrollbar-thumb {
            background: transparent;
        }

        &::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }
    }
}
</style>