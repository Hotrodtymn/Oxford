import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

// Use Vite's existing TSX loader and real React rendering, without a DOM dependency.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
after(() => server.close())
const { default: App } = await server.ssrLoadModule('/src/App.tsx')
const { default: SuggestionPanels } = await server.ssrLoadModule('/src/features/grammar/SuggestionPanels.tsx')
const { default: HighlightedEditor } = await server.ssrLoadModule('/src/features/grammar/HighlightedEditor.tsx')
const { analyzeWriting } = await server.ssrLoadModule('/src/features/writing/localEngines.ts')

// Inspect rendered HTML elements and attributes, never component source strings.
function elements(markup, tag) {
  return [...markup.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, 'g'))]
    .map(([, attributes, text]) => ({
      attributes: Object.fromEntries([...attributes.matchAll(/([\w-]+)="([^"]*)"/g)]
        .map(([, key, value]) => [key, decode(value)])),
      text: decode(text),
    }))
}
function decode(text) {
  return text.replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}
function assertUniqueIds(markup) {
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id)
  assert.equal(new Set(ids).size, ids.length, 'all rendered IDs must be unique')
}
const documentText = 'She go home. I recieved teh letter. In order to finish, we started early.'
const suggestions = analyzeWriting(documentText)
const panelProps = {
  hasContent: true,
  issues: suggestions.filter(({ type }) => type !== 'style'),
  visibleStyleSuggestions: suggestions.filter(({ type }) => type === 'style'),
  onApply() {},
  onDismiss() {},
}
const renderPanels = () => renderToStaticMarkup(createElement(SuggestionPanels, panelProps))

test('multiple editors have unique IDs and valid visible label and instruction associations', () => {
  const markup = renderToStaticMarkup(createElement('div', null, createElement(App), createElement(App)))
  assertUniqueIds(markup)
  const editors = elements(markup, 'textarea')
  const labels = elements(markup, 'label')
  const paragraphs = elements(markup, 'p')
  assert.equal(editors.length, 2)
  for (const { attributes } of editors) {
    assert.ok(attributes.id)
    assert.equal(attributes['aria-label'], 'Writing editor')
    assert.ok(attributes.placeholder.startsWith('Start writing here...'))
    assert.equal(attributes.spellCheck, 'true')
    const label = labels.find(({ attributes: labelAttributes }) => labelAttributes.for === attributes.id)
    assert.equal(label?.text.trim(), 'START WRITING')
    const descriptionIds = attributes['aria-describedby']?.split(/\s+/)
    assert.ok(descriptionIds?.length)
    for (const id of descriptionIds) {
      const description = paragraphs.find(({ attributes }) => attributes.id === id)
      assert.ok(description?.text.includes('Review suggestions below the editor.'))
    }
  }
})

test('rendered editor retains its controlled text and hides its decorative mirror', () => {
  const markup = renderToStaticMarkup(createElement(HighlightedEditor, {
    id: 'fixture-editor', describedBy: 'fixture-help', value: documentText,
    issues: suggestions, onChange() {}, placeholder: 'Write here',
  }))
  assert.equal(elements(markup, 'textarea')[0].text, documentText)
  assert.match(markup, /class="highlight-layer" aria-hidden="true"/)
})

test('grammar, spelling, and style buttons identify the action and correction context', () => {
  const buttons = elements(renderPanels(), 'button')
  assert.ok(panelProps.issues.some(({ type }) => type === 'grammar'))
  assert.ok(panelProps.issues.some(({ type }) => type === 'spelling'))
  assert.ok(panelProps.visibleStyleSuggestions.length)
  const expected = [
    ...panelProps.issues.map(({ type, original, suggestion }) =>
      `Apply ${type} suggestion: “${original}” to “${suggestion}”`),
    ...panelProps.visibleStyleSuggestions.flatMap(({ original, suggestion }) => [
      `Accept style suggestion: “${original}” to “${suggestion}”`,
      `Dismiss style suggestion for “${original}”`,
    ]),
  ]
  assert.deepEqual(buttons.map(({ attributes }) => attributes['aria-label']), expected)
  for (const button of buttons) {
    assert.ok(button.attributes['aria-label'].startsWith(button.text.trim()))
  }
})

test('panels reference their visible headings with unique IDs across instances', () => {
  const markup = renderToStaticMarkup(createElement('div', null,
    createElement(SuggestionPanels, panelProps), createElement(SuggestionPanels, panelProps)))
  assertUniqueIds(markup)
  const headings = elements(markup, 'h2')
  const panels = elements(markup, 'section')
  assert.equal(panels.length, 4)
  for (const panel of panels) {
    const heading = headings.find(({ attributes }) => attributes.id === panel.attributes['aria-labelledby'])
    assert.ok(heading)
    assert.ok(['Writing suggestions', 'Writing improvements'].includes(heading.text))
    assert.ok(panel.text.includes(`id="${heading.attributes.id}"`))
    assert.equal(panel.attributes['aria-live'], 'polite')
  }
})

test('all suggestion actions retain native non-submit button semantics', () => {
  const markup = renderPanels()
  const buttons = elements(markup, 'button')
  assert.equal(buttons.length, panelProps.issues.length + 2 * panelProps.visibleStyleSuggestions.length)
  for (const { attributes, text } of buttons) {
    assert.equal(attributes.type, 'button')
    assert.equal(attributes.role, undefined)
    assert.equal(attributes.tabindex, undefined)
    assert.equal(attributes['aria-disabled'], undefined)
    assert.ok(['Apply', 'Accept', 'Dismiss'].includes(text.trim()))
  }
  assert.doesNotMatch(markup, /\s(?:disabled|tabindex|onkeydown|onkeyup)(?:=|[\s>])/i)
})

test('empty panels preserve guidance and heading association without actions', () => {
  const markup = renderToStaticMarkup(createElement(SuggestionPanels, {
    ...panelProps, hasContent: false, issues: [], visibleStyleSuggestions: [],
  }))
  assert.equal(elements(markup, 'section').length, 1)
  assert.equal(elements(markup, 'button').length, 0)
  assert.ok(elements(markup, 'p').some(({ text }) => text.includes('Start writing to check')))
  assert.equal(elements(markup, 'section')[0].attributes['aria-labelledby'], elements(markup, 'h2')[0].attributes.id)
})
