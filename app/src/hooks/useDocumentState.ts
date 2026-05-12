import { useState, useCallback, useRef, useEffect } from 'react'
import type { Document, DocumentListItem, CreateDocumentRequest, UpdateDocumentRequest } from '../types'
import * as api from '../services/api'

export function useDocumentState() {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [documentList, setDocumentList] = useState<DocumentListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const undoStackRef = useRef<Document[]>([])
  const redoStackRef = useRef<Document[]>([])

  const pushUndo = useCallback((doc: Document) => {
    undoStackRef.current = [...undoStackRef.current.slice(-49), doc]
    redoStackRef.current = []
  }, [])

  const updateCurrentDocument = useCallback((updates: Partial<Document>) => {
    setCurrentDocument(prev => {
      if (!prev) return prev
      pushUndo(prev)
      const next = { ...prev, ...updates, updatedAt: new Date().toISOString() }
      setIsDirty(true)
      return next
    })
  }, [pushUndo])

  const undo = useCallback(() => {
    setCurrentDocument(current => {
      const stack = undoStackRef.current
      if (stack.length === 0) return current
      const previous = stack[stack.length - 1]
      undoStackRef.current = stack.slice(0, -1)
      if (current) {
        redoStackRef.current = [...redoStackRef.current, current]
      }
      setIsDirty(true)
      return previous
    })
  }, [])

  const redo = useCallback(() => {
    setCurrentDocument(current => {
      const stack = redoStackRef.current
      if (stack.length === 0) return current
      const next = stack[stack.length - 1]
      redoStackRef.current = stack.slice(0, -1)
      if (current) {
        undoStackRef.current = [...undoStackRef.current, current]
      }
      setIsDirty(true)
      return next
    })
  }, [])

  const loadDocument = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const doc = await api.fetchDocument(id)
      setCurrentDocument(doc)
      setIsDirty(false)
      undoStackRef.current = []
      redoStackRef.current = []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadDocumentList = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const docs = await api.fetchDocumentList()
      setDocumentList(docs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createDocument = useCallback(async (req: CreateDocumentRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      const doc = await api.createDocument(req)
      setCurrentDocument(doc)
      setIsDirty(false)
      undoStackRef.current = []
      redoStackRef.current = []
      await loadDocumentList()
      return doc
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [loadDocumentList])

  const saveDocument = useCallback(async (req: UpdateDocumentRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      const doc = await api.updateDocument(req)
      setCurrentDocument(doc)
      setIsDirty(false)
      await loadDocumentList()
      return doc
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [loadDocumentList])

  const removeDocument = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await api.deleteDocument(id)
      if (currentDocument?.id === id) {
        setCurrentDocument(null)
        setIsDirty(false)
      }
      await loadDocumentList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [currentDocument, loadDocumentList])

  useEffect(() => {
    loadDocumentList()
  }, [loadDocumentList])

  return {
    currentDocument,
    documentList,
    isLoading,
    error,
    isDirty,
    updateCurrentDocument,
    loadDocument,
    loadDocumentList,
    createDocument,
    saveDocument,
    removeDocument,
    undo,
    redo,
  }
}
