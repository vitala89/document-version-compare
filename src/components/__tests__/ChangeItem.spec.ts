import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { DiffEntry } from '@/domain/types'
import ChangeItem from '../ChangeItem.vue'

describe('ChangeItem', () => {
  it('labels added and removed lines in words inside a moved clause, not only by colour', () => {
    const entry: DiffEntry = {
      id: 'c',
      kind: 'moved',
      reason: 'moved',
      scope: 'clause',
      title: 'Public holidays',
      parentId: 'sec-leave',
      sectionId: 'sec-leave',
      movedFrom: 'Working Hours',
      details: [
        { type: 'field-added', label: 'Days', value: '10' },
        { type: 'text-removed', text: 'Old rule.' },
      ],
    }
    const text = mount(ChangeItem, { props: { entry, level: 3 } }).text()
    expect(text).toContain('Field added')
    expect(text).toContain('Text removed')
  })

  it('shows the clauses of a nested section inside an added section', () => {
    const entry: DiffEntry = {
      id: 'sec-new',
      kind: 'added',
      reason: 'added',
      scope: 'section',
      title: 'New area',
      parentId: null,
      sectionId: 'sec-new',
      details: [],
      node: {
        id: 'sec-new',
        type: 'section',
        title: 'New area',
        children: [
          { id: 'c1', type: 'clause', title: 'Top rule', children: [] },
          {
            id: 'sec-sub',
            type: 'section',
            title: 'Sub area',
            children: [{ id: 'c2', type: 'clause', title: 'Nested rule', children: [] }],
          },
        ],
      },
    }
    const text = mount(ChangeItem, { props: { entry, level: 3 } }).text()
    expect(text).toContain('Top rule')
    expect(text).toContain('Nested rule')
  })
})
