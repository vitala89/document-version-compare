import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/App.vue'
import ChangesView from '@/components/ChangesView.vue'
import { diffDocuments } from '@/domain/diff'
import { getVersion } from '@/domain/versions'

// Screen-level regressions: what the reader sees, on the real snapshots.
let wrapper: VueWrapper | undefined
const open = () => (wrapper = mount(App, { attachTo: document.body }))
afterEach(() => wrapper?.unmount())

const total = (w: VueWrapper) => w.find('.summary .stat-value').text()
const fullDocument = async (w: VueWrapper) => {
  await w.find('input[value="full"]').setValue()
  await flushPromises()
}
const pickBase = async (w: VueWrapper, version: number) => {
  await w.findAll('.pair select')[0]!.setValue(String(version))
  await flushPromises()
}

describe('App', () => {
  it('opens on v2 → v3 with 10 changes and updates when the base changes', async () => {
    const w = open()
    expect(total(w)).toBe('10')
    expect(w.find('.pair-chip').text()).toBe('v2 → v3')
    await pickBase(w, 1)
    expect(total(w)).toBe('20')
  })

  it('renders the v3 Reimbursement paragraph without the injected image, keeping a safe link', async () => {
    const w = open()
    await fullDocument(w)
    const doc = w.find('#document')
    expect(doc.find('img').exists()).toBe(false)
    expect(doc.html()).not.toContain('onerror')
    const link = doc.find('a[href="https://intranet.example.com/expenses"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(link.attributes('target')).toBe('_blank')
  })

  it('never renders paragraph markup in Changes only', () => {
    const w = open()
    expect(w.find('#document img').exists()).toBe(false)
    expect(w.find('#document a').exists()).toBe(false)
  })

  it('marks a moved clause and notes a removed one in Full document (v1 → v2)', async () => {
    const w = open()
    await pickBase(w, 1)
    await w.findAll('.pair select')[1]!.setValue('2')
    await flushPromises()
    await fullDocument(w)
    const holidays = w.findAll('.clause').find((c) => c.find('h3').text() === 'Public holidays')!
    expect(holidays.find('.full-mark').text()).toBe('Moved')
    const security = w.find('section[aria-labelledby="sec-security"]')
    expect(security.find('.removed-note').text()).toContain('Passwords')
  })

  it('shows Travel inside Expenses in Changes only', () => {
    const w = open()
    const expenses = w.find('section[aria-labelledby="sec-expenses"]')
    expect(expenses.find('#sec-travel').text()).toBe('Expenses / Travel')
  })
})

describe('Empty comparison', () => {
  it('says there are no changes when both versions are the same document', () => {
    const doc = getVersion(3)
    const w = mount(ChangesView, { props: { result: diffDocuments(doc, { ...doc, version: 4 }) } })
    expect(w.text()).toContain('No changes between v3 and v4.')
  })
})

describe('Screens the reader sees for other pairs', () => {
  it('shows 11 changes for v1 → v2 and the moved clause with where it came from', async () => {
    const w = mount(App, { attachTo: document.body })
    await w.findAll('.pair select')[0]!.setValue('1')
    await flushPromises()
    await w.findAll('.pair select')[1]!.setValue('2')
    await flushPromises()
    expect(w.find('.summary .stat-value').text()).toBe('11')
    const leave = w.find('section[aria-labelledby="sec-leave"]')
    expect(leave.text()).toContain('Moved from Working Hours.')
    w.unmount()
  })

  it('shows a removed top-level section as its own group in Changes only', () => {
    const doc = (version: number, ids: string[]) => ({
      id: 'doc',
      version,
      title: 'Doc',
      updatedAt: '2026-01-01',
      children: ids.map((id) => ({
        id,
        type: 'section' as const,
        title: id.toUpperCase(),
        children: [],
      })),
    })
    const w = mount(ChangesView, {
      props: { result: diffDocuments(doc(1, ['a', 'gone']), doc(2, ['a'])) },
    })
    expect(w.find('h2#gone').text()).toBe('GONE')
    expect(w.find('.tag').text()).toBe('Removed')
  })
})
