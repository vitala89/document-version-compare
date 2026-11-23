import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ValuePair from '../ValuePair.vue'

describe('ValuePair', () => {
  it('shows a missing value as a plain hyphen and reads it as "none"', () => {
    const wrapper = mount(ValuePair, { props: { before: undefined, after: 'draft' } })
    const old = wrapper.find('.old-value')
    expect(old.find('[aria-hidden="true"]').text()).toBe('-')
    expect(old.find('.sr-only').text()).toBe('Before: none')
    expect(wrapper.html()).not.toMatch(/[–—]/)
  })
})
