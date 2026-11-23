import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ContentsNav from '../ContentsNav.vue'

const items = [
  {
    id: 'sec-expenses',
    title: 'Expenses',
    count: 2,
    children: [{ id: 'sec-travel', title: 'Travel', count: 1, children: [] }],
  },
  { id: 'sec-intro', title: 'Introduction', count: 0, children: [] },
]

describe('ContentsNav', () => {
  it('gives each link a readable name with its count', () => {
    const names = mount(ContentsNav, { props: { items } })
      .findAll('.wide-nav a')
      .map((a) => {
        // Accessible name: what a screen reader announces, without aria-hidden parts.
        const clone = a.element.cloneNode(true) as HTMLElement
        clone.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove())
        return (clone.textContent ?? '').replace(/\s+/g, ' ').trim()
      })
    expect(names).toEqual(['Expenses, 2 changes', 'Travel, 1 change', 'Introduction'])
  })

  it('on narrow screens names the chosen section in the pinned bar and closes the list after a jump', async () => {
    const wrapper = mount(ContentsNav, { props: { items }, attachTo: document.body })
    const sheet = wrapper.find('details.compact-nav')
    expect(sheet.find('.compact-label').text()).toBe('Jump to section')
    ;(sheet.element as HTMLDetailsElement).open = true
    await sheet
      .findAll('a')
      .find((a) => a.text().startsWith('Travel'))!
      .trigger('click')
    expect((sheet.element as HTMLDetailsElement).open).toBe(false)
    expect(sheet.find('.compact-label').text()).toBe('Expenses / Travel')
    wrapper.unmount()
  })

  it('closes the open list on Escape even when focus is outside the bar', async () => {
    // After a jump focus sits on the section heading, not inside the bar.
    const wrapper = mount(ContentsNav, { props: { items }, attachTo: document.body })
    const sheet = wrapper.find('details.compact-nav').element as HTMLDetailsElement
    sheet.open = true
    document.body.focus()
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(sheet.open).toBe(false)
    expect(document.activeElement?.tagName).toBe('SUMMARY')
    wrapper.unmount()
  })
})
