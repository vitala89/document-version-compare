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
})
