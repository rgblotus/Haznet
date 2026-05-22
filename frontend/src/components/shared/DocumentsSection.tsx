import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import type { Document } from '@/types/models'
import {
  FileText, Upload, X, File, Image, FileSpreadsheet, FileArchive,
  ChevronDown, ChevronRight, Trash2, Download, Paperclip, FolderOpen,
  FileCheck, Clock
} from 'lucide-react'

interface DocumentsSectionProps {
  requisitionId: string
  tenderId?: string | null
  orderId?: string | null
  bidId?: string | null
  status: string
  role: string
}

const categoryLabels: Record<string, string> = {
  requisition_user_docs: 'Indentor/User Documents',
  internal_approval_docs: 'Internal Approval Documents',
  tender_document: 'Tender Documents',
  tender_vetted_docs: 'Vetted Tender Documents',
  bid_documents: 'Bid Documents',
  technical_evaluation: 'Technical Evaluation',
  technical_query_sheet: 'Technical Query Sheet',
  commercial_evaluation: 'Commercial Evaluation',
  commercial_query_sheet: 'Commercial Query Sheet',
  revised_evaluation: 'Revised Evaluation',
  comparative_statement: 'Comparative Statement',
  price_bid_docs: 'Price Bid Documents',
  negotiation_docs: 'Negotiation Documents',
  tender_committee_docs: 'Tender Committee Documents',
  order_documents: 'Order Documents',
  contract_document: 'Contract Document',
  security_deposit: 'Security Deposit',
  execution_docs: 'Execution Documents',
  other: 'Other Documents',
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return File
  if (fileType.startsWith('image/')) return Image
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileSpreadsheet
  if (fileType.includes('zip') || fileType.includes('archive')) return FileArchive
  return FileText
}

export default function DocumentsSection({ 
  requisitionId, 
  tenderId, 
  orderId,
  bidId,
  status,
  role,
}: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('other')
  const [description, setDescription] = useState('')
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [requisitionId])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const docs = await api.documents.list({ requisition_id: requisitionId })
      setDocuments(docs || [])
    } catch (err) {
      console.error('Failed to load documents:', err)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setShowUploadModal(true)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('category', selectedCategory)
      if (description) formData.append('description', description)
      
      const token = localStorage.getItem('token')
      await fetch(`/api/documents/${requisitionId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })
      
      await loadDocuments()
      setShowUploadModal(false)
      setSelectedFile(null)
      setSelectedCategory('other')
      setDescription('')
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document?')) return
    try {
      await api.documents.delete(docId)
      await loadDocuments()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const canUserUpload = ['procurement_officer', 'cnp_hod', 'oic', 'admin', 'indentor'].includes(role)

  const groupedByCategory: Record<string, Document[]> = {}
  documents.forEach(doc => {
    const cat = doc.category || 'other'
    if (!groupedByCategory[cat]) groupedByCategory[cat] = []
    groupedByCategory[cat].push(doc)
  })

  const categories = Object.keys(groupedByCategory).sort()

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
            <Paperclip size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Documents</h3>
            <p className="text-xs text-slate-500">{documents.length} file{documents.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {canUserUpload && (
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <Upload size={16} />
            Upload File
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
          </label>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && documents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <FileText size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-600 font-medium mb-1">No documents uploaded</p>
          <p className="text-slate-400 text-sm">Upload files to attach them to this requisition</p>
        </div>
      )}

      {/* Document List */}
      {!loading && documents.length > 0 && (
        <div className="space-y-2">
          {categories.map(category => (
            <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpandedStage(expandedStage === category ? null : category)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    expandedStage === category ? 'bg-indigo-500' : 'bg-slate-100'
                  )}>
                    {expandedStage === category ? (
                      <ChevronDown size={16} className="text-white" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-700 text-sm">
                      {categoryLabels[category] || category}
                    </p>
                    <p className="text-xs text-slate-400">
                      {groupedByCategory[category].length} file{groupedByCategory[category].length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expandedStage === category && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {groupedByCategory[category].map(doc => {
                        const FileIcon = getFileIcon(doc.file_type)
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                              <FileIcon size={18} className="text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-700 truncate">
                                {doc.file_name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                <span>{formatFileSize(doc.file_size)}</span>
                                <span>•</span>
                                <span>{doc.uploader_name || 'Unknown'}</span>
                                <span>•</span>
                                <span>{formatDate(doc.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-slate-600 transition-colors">
                                <Download size={16} />
                              </button>
                              {(role === 'admin' || role === 'procurement_officer' || doc.uploaded_by === localStorage.getItem('userId')) && (
                                <button 
                                  onClick={() => handleDelete(doc.id)}
                                  className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Upload Document</h3>
              <button onClick={() => { setShowUploadModal(false); setSelectedFile(null) }} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {selectedFile && (
              <div className="mb-4 p-4 bg-indigo-50 rounded-xl flex items-center gap-3">
                <FileText size={24} className="text-indigo-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-indigo-700 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-indigo-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-2 block">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                >
                  <option value="">Select category</option>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600 mb-2 block">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowUploadModal(false); setSelectedFile(null) }}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedCategory}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}