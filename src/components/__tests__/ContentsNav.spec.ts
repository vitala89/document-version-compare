import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
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

// Page geometry a test may fake; restored after every test, even a failing one.
const scrollYBefore = Object.getOwnPropertyDescriptor(window, 'scrollY')
const scrollHeightBefore = Object.getOwnPropertyDescriptor(document.documentElement, 'scrollHeight')
afterEach(() => {
  if (scrollYBefore) Object.defineProperty(window, 'scrollY', scrollYBefore)
  else delete (window as { scrollY?: number }).scrollY
  if (scrollHeightBefore)
    Object.defineProperty(document.documentElement, 'scrollHeight', scrollHeightBefore)
  else delete (document.documentElement as { scrollHeight?: number }).scrollHeight
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

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

  it('moves focus to the chosen heading after a jump', async () => {
    const heading = document.createElement('h3')
    heading.id = 'sec-travel'
    heading.tabIndex = -1
    heading.scrollIntoView = vi.fn<() => void>()
    document.body.append(heading)
    const wrapper = mount(ContentsNav, { props: { items }, attachTo: document.body })
    await wrapper
      .findAll('.wide-nav a')
      .find((a) => a.text().startsWith('Travel'))!
      .trigger('click')
    await nextTick()
    expect(document.activeElement?.id).toBe('sec-travel')
    expect(heading.scrollIntoView).toHaveBeenCalled()
    wrapper.unmount()
    heading.remove()
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

  it('keeps the current section when the open list covers the page', async () => {
    // Positions measured on a 390x844 phone: the open list ends at 347px, the closed bar at 52px.
    const rect =
      (top: number, bottom = top + 30) =>
      () =>
        ({ top, bottom }) as DOMRect
    const page = document.createElement('div')
    page.innerHTML = `
      <section><h2 id="sec-expenses"></h2></section>
      <section id="travel-section"><h3 id="sec-travel"></h3></section>
      <section><h2 id="sec-intro"></h2></section>`
    document.body.append(page)
    page.querySelector('#sec-expenses')!.getBoundingClientRect = rect(76)
    page.querySelector('#sec-travel')!.getBoundingClientRect = rect(300)
    page.querySelector('#travel-section')!.getBoundingClientRect = rect(290, 600)
    page.querySelector('#sec-intro')!.getBoundingClientRect = rect(900)
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 4000,
      configurable: true,
    })
    vi.stubGlobal('requestAnimationFrame', (run: FrameRequestCallback) => {
      run(0)
      return 1
    })

    const wrapper = mount(ContentsNav, { props: { items }, attachTo: document.body })
    const sheet = wrapper.find('details.compact-nav').element as HTMLDetailsElement
    Object.defineProperty(sheet, 'offsetParent', { get: () => document.body })
    sheet.getBoundingClientRect = rect(0, 347)
    sheet.querySelector('summary')!.getBoundingClientRect = rect(0, 52)
    sheet.open = true
    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    expect(wrapper.find('.compact-label').text()).toBe('Expenses')
    wrapper.unmount()
  })
})
