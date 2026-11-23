import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { diffDocuments } from '@/domain/diff'
import type { DocumentVersion } from '@/domain/types'
import FullDocumentView from '../FullDocumentView.vue'

const doc = (version: number, ids: string[]): DocumentVersion => ({
  id: 'doc',
  version,
  title: 'Doc',
  updatedAt: '2026-01-01',
  children: ids.map((id) => ({ id, type: 'section', title: id.toUpperCase(), children: [] })),
})

describe('FullDocumentView', () => {
  it('gives removed top-level sections their own heading in the outline', () => {
    const result = diffDocuments(doc(1, ['a', 'gone']), doc(2, ['a']))
    const panel = mount(FullDocumentView, { props: { result } }).find(
      'section[aria-labelledby="removed-sections"]',
    )
    expect(panel.find('h2#removed-sections').text()).toBe('Removed sections')
    expect(panel.find('.removed-note').text()).toContain('Section: GONE')
  })
})
