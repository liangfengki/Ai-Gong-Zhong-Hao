import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDocumentState } from '../useDocumentState'

vi.mock('../../services/api', () => ({
  fetchDocumentList: vi.fn().mockResolvedValue([]),
  fetchDocument: vi.fn().mockResolvedValue({
    id: '1',
    title: 'Test Doc',
    content: 'Hello',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }),
  createDocument: vi.fn().mockResolvedValue({
    id: '2',
    title: 'New Doc',
    content: '',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  }),
  updateDocument: vi.fn().mockResolvedValue({
    id: '1',
    title: 'Updated',
    content: 'Hello',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  }),
  deleteDocument: vi.fn().mockResolvedValue(undefined),
}))

import * as api from '../../services/api'

describe('useDocumentState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads document list on mount', async () => {
    renderHook(() => useDocumentState())

    await act(async () => {})

    expect(api.fetchDocumentList).toHaveBeenCalled()
  })

  it('loads a document by id', async () => {
    const { result } = renderHook(() => useDocumentState())

    await act(async () => {
      await result.current.loadDocument('1')
    })

    expect(result.current.currentDocument).toMatchObject({ id: '1', title: 'Test Doc' })
    expect(result.current.isDirty).toBe(false)
  })

  it('updates current document and marks dirty', async () => {
    const { result } = renderHook(() => useDocumentState())

    await act(async () => {
      await result.current.loadDocument('1')
    })

    act(() => {
      result.current.updateCurrentDocument({ title: 'Changed' })
    })

    expect(result.current.currentDocument?.title).toBe('Changed')
    expect(result.current.isDirty).toBe(true)
  })

  it('creates a document', async () => {
    const { result } = renderHook(() => useDocumentState())

    await act(async () => {
      await result.current.createDocument({ title: 'New Doc', content: '' })
    })

    expect(api.createDocument).toHaveBeenCalledWith({ title: 'New Doc', content: '' })
    expect(result.current.currentDocument?.id).toBe('2')
    expect(result.current.isDirty).toBe(false)
  })

  it('saves a document', async () => {
    const { result } = renderHook(() => useDocumentState())

    await act(async () => {
      await result.current.loadDocument('1')
    })

    act(() => {
      result.current.updateCurrentDocument({ title: 'Updated' })
    })

    await act(async () => {
      await result.current.saveDocument({ id: '1', title: 'Updated' })
    })

    expect(api.updateDocument).toHaveBeenCalled()
    expect(result.current.isDirty).toBe(false)
  })

  it('deletes a document', async () => {
    const { result } = renderHook(() => useDocumentState())

    await act(async () => {
      await result.current.loadDocument('1')
    })

    await act(async () => {
      await result.current.removeDocument('1')
    })

    expect(api.deleteDocument).toHaveBeenCalledWith('1')
    expect(result.current.currentDocument).toBeNull()
  })

  it('undoes document changes', async () => {
    const { result } = renderHook(() => useDocumentState())

    await act(async () => {
      await result.current.loadDocument('1')
    })

    act(() => {
      result.current.updateCurrentDocument({ title: 'Changed' })
    })

    expect(result.current.currentDocument?.title).toBe('Changed')

    act(() => {
      result.current.undo()
    })

    expect(result.current.currentDocument?.title).toBe('Test Doc')
  })

  it('redoes document changes after undo', async () => {
    const { result } = renderHook(() => useDocumentState())

    await act(async () => {
      await result.current.loadDocument('1')
    })

    act(() => {
      result.current.updateCurrentDocument({ title: 'Changed' })
    })

    act(() => {
      result.current.undo()
    })

    act(() => {
      result.current.redo()
    })

    expect(result.current.currentDocument?.title).toBe('Changed')
  })
})
