import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { DocumentVersion } from '@/domain/types'
import VersionPicker from '../VersionPicker.vue'

const v = (version: number): DocumentVersion => ({
  id: 'doc',
  version,
  title: 'Doc',
  updatedAt: '2026-01-15',
  children: [],
})
const disabled = (select: ReturnType<ReturnType<typeof mount>['find']>) =>
  select
    .findAll('option')
    .filter((o) => (o.element as HTMLOptionElement).disabled)
    .map((o) => o.attributes('value'))

describe('VersionPicker', () => {
  const versions = [v(1), v(3), v(5)] // gaps on purpose

  it('disables pairs that are not older → newer, in both lists', () => {
    const wrapper = mount(VersionPicker, { props: { versions, base: 3, target: 5 } })
    const [base, target] = wrapper.findAll('select')
    expect(disabled(base!)).toEqual([])
    expect(disabled(target!)).toEqual(['3'])
  })

  it('never changes the other list on its own', async () => {
    const wrapper = mount(VersionPicker, { props: { versions, base: 1, target: 5 } })
    await wrapper.findAll('select')[1]!.setValue('3')
    expect(wrapper.emitted('update:target')?.slice(-1)[0]).toEqual([3])
    expect(wrapper.emitted('update:base')).toBeUndefined()
  })

  it('keeps every pair older → newer with ten versions', () => {
    const many = Array.from({ length: 10 }, (_, i) => v(i + 1))
    const wrapper = mount(VersionPicker, { props: { versions: many, base: 4, target: 9 } })
    const [base, target] = wrapper.findAll('select')
    expect(base!.findAll('option')).toHaveLength(9)
    expect(target!.findAll('option')).toHaveLength(9)
    expect(disabled(base!)).toEqual(['9'])
    expect(disabled(target!)).toEqual(['2', '3', '4'])
  })
})
