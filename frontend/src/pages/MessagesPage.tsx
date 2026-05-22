import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import type { Requisition } from '@/types/models'
import PageLayout from '@/components/PageLayout'
import { Badge } from '@/components/ui'
import { WelcomeHeader } from '@/components/shared'
import { FadeIn } from '@/components/ui/AnimatedList'
import { motion } from 'framer-motion'
import {
    Send, User as UserIcon, FileText, Clock, ChevronDown,
    Check, MessageSquare, Calendar,
    Building2, DollarSign
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const statusToBadgeVariant: Record<string, string> = {
    draft: 'neutral',
    submitted: 'warning',
    under_review: 'warning',
    returned: 'danger',
    pending_inventory: 'primary',
    inventory_checked: 'primary',
    processing: 'warning',
    tender_awaiting: 'primary',
    order_created: 'success',
    shipped: 'primary',
    receiving: 'primary',
    inspection_pending: 'warning',
    completed: 'success',
    cancelled: 'danger',
}

interface RequisitionMessage {
    id: string
    content: string
    created_at: string
    sender_id: string
    requisition_id: string
    receiver_id: string
    sender?: { id: string; first_name?: string; last_name?: string }
}

interface CurrentUser {
    id: string
    first_name: string
    last_name: string
}

function MessageBubble({ message, isOwn }: { message: any; isOwn: boolean }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex items-end gap-3 mb-4', isOwn ? 'flex-row-reverse' : 'flex-row')}
        >
            {!isOwn && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shrink-0">
                    <UserIcon size={16} className="text-white" />
                </div>
            )}
            <div className={cn(
                'max-w-[70%] px-4 py-3 rounded-2xl shadow-md',
                isOwn 
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 rounded-tr-none text-white' 
                    : 'bg-white/80 backdrop-blur-sm border border-slate-100 rounded-tl-none'
            )}>
                {!isOwn && <p className="text-xs font-bold text-indigo-500 mb-2">{message.sender?.first_name} {message.sender?.last_name}</p>}
                <p className="text-sm leading-relaxed text-slate-700">{message.content}</p>
                <p className={cn('text-xs mt-2 flex items-center gap-1', isOwn ? 'text-white/70 justify-end' : 'text-slate-400')}>
                    {!isOwn && <Clock size={12} />}
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isOwn && <Check size={12} className="ml-1" />}
                </p>
            </div>
        </motion.div>
    )
}

function ActionSidebar({ req, onSelect, showDropdown, setShowDropdown, reqs }: { req: any; onSelect: (id: string) => void; showDropdown: boolean; setShowDropdown: (v: boolean) => void; reqs: any[] }) {
    return (
        <div className="p-4 space-y-3">
            <div className="p-4 bg-white rounded-xl border border-slate-100/60 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Conversations</p>
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/50 rounded-lg cursor-pointer flex items-center justify-between text-slate-700 text-sm hover:bg-slate-100 transition-all"
                    >
                        {req ? (
                            <>
                                <span className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                                        <FileText size={12} className="text-amber-500" />
                                    </div>
                                    <span className="font-medium text-sm font-mono">{req.file_reference || req.requisition_no}</span>
                                </span>
                                <ChevronDown size={14} className="text-slate-400" />
                            </>
                        ) : (
                            <span className="text-slate-400 text-sm">Select a requisition</span>
                        )}
                    </button>
                    {showDropdown && (
                        <div className="absolute w-full mt-1.5 bg-white border border-slate-200/50 rounded-lg shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                            {(reqs || []).map((r: any) => (
                                <motion.button 
                                    key={r.id} 
                                    whileHover={{ backgroundColor: 'rgb(241, 245, 249)' }}
                                    onClick={() => { onSelect(r.id); setShowDropdown(false) }} 
                                    className="flex items-center gap-2 p-3 cursor-pointer w-full text-left border-b border-slate-100/50 last:border-b-0"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                                        <FileText size={12} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 font-mono">{r.file_reference || r.requisition_no}</p>
                                        <p className="text-xs text-slate-400">{r.title}</p>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {req && (
                <>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-white rounded-xl border border-slate-100/60 shadow-sm"
                    >
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Requisition Details</p>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Status</p>
                                <Badge variant={(statusToBadgeVariant[req.status] || 'default') as any} className="font-medium text-xs" dot>
                                    {req.status?.replace(/_/g, ' ')}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Requestor</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                                        <UserIcon size={12} className="text-violet-500" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">{req.requestor?.first_name} {req.requestor?.last_name}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Department</p>
                                <p className="text-sm text-slate-600 flex items-center gap-1.5">
                                    <Building2 size={12} className="text-slate-400" />
                                    {req.department?.name || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Expected Date</p>
                                <p className="text-sm text-slate-600 flex items-center gap-1.5">
                                    <Calendar size={12} className="text-slate-400" />
                                    {req.expected_date ? new Date(req.expected_date).toLocaleDateString() : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Budget</p>
                                <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                    <DollarSign size={12} className="text-emerald-500" />
                                    {req.estimated_budget ? `$${req.estimated_budget.toLocaleString()}` : '-'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                    {req.description && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-4 bg-slate-50 rounded-xl border border-slate-200/50"
                        >
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Description</p>
                            <p className="text-sm text-slate-600 leading-relaxed">{req.description}</p>
                        </motion.div>
                    )}
                </>
            )}
        </div>
    )
}

export default function MessagesPage() {
    const user = useAuthStore((s) => s.user)
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const { reqId } = useParams<{ reqId: string }>()
    const [selectedReq, setSelectedReq] = useState<string>('')
    const [showDropdown, setShowDropdown] = useState(false)
    const [messageText, setMessageText] = useState('')
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)


    const { data: reqsResponse } = useQuery({
        queryKey: ['requisitions'],
        queryFn: () => api.requisitions.list({ page_size: 100 }),
    })
    const reqs = reqsResponse?.data || []

    useEffect(() => {
        if (reqId) {
            setSelectedReq(reqId)
            navigate(`/messages/${reqId}`, { replace: true })
        } else if (reqs.length > 0) {
            setSelectedReq(reqs[0].id)
            navigate(`/messages/${reqs[0].id}`, { replace: true })
        }
    }, [reqId, reqs])

    const { data: reqMessages } = useQuery({
        queryKey: ['messages', selectedReq],
        queryFn: () => selectedReq ? api.messages.listByReq(selectedReq) as Promise<RequisitionMessage[]> : Promise.resolve([]),
        enabled: !!selectedReq,
    })

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [reqMessages])

    const { data: me } = useQuery({
        queryKey: ['authMe'],
        queryFn: () => api.auth.getMe() as unknown as Promise<CurrentUser>
    })

    const currentReq = reqs?.find((r) => r.id === selectedReq) as Requisition | undefined

    const sendMutation = useMutation({
        mutationFn: (data: { content: string; requisition_id: string; receiver_id: string }) => api.messages.send(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', selectedReq] })
            setMessageText('')
            setIsSending(false)
        },
    })

    const handleSend = () => {
        if (!messageText.trim() || !selectedReq || !currentReq || isSending) return
        setIsSending(true)
        const receiverId = me?.id === currentReq.creator_id ? currentReq.current_owner_id : currentReq.creator_id
        sendMutation.mutate({ content: messageText, requisition_id: selectedReq, receiver_id: receiverId || '' })
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    const handleSelect = (id: string) => {
        setSelectedReq(id)
        navigate(`/messages/${id}`)
    }

    return (
        <PageLayout
            title="Messages"
            rightSidebar={<ActionSidebar req={currentReq} onSelect={handleSelect} showDropdown={showDropdown} setShowDropdown={setShowDropdown} reqs={reqs || []} />}
        >
            <div className="max-w-7xl mx-auto space-y-6">
                <WelcomeHeader />

                <FadeIn delay={0.1}>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100/50 shadow-lg shadow-slate-200/10 flex flex-col flex-1 h-[calc(100vh-280px)] overflow-hidden">
                    {!currentReq ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4 shadow-md">
                                <MessageSquare size={40} className="text-slate-300" />
                            </div>
                            <p className="text-lg font-bold text-slate-600">Select a requisition</p>
                            <p className="text-sm mt-1 text-slate-400">From the right sidebar to start messaging</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                                    <FileText size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-slate-800 font-mono">{currentReq.file_reference || currentReq.requisition_no}</p>
                                    <p className="text-sm text-slate-500">{currentReq.title}</p>
                                </div>
                                <Badge variant={(statusToBadgeVariant[currentReq.status] || 'default') as any} className="ml-auto font-medium" dot>
                                    {currentReq.status?.replace(/_/g, ' ')}
                                </Badge>
                            </div>

                            <div className="flex-1 overflow-auto p-6 space-y-2">
                                {reqMessages?.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mb-4">
                                            <MessageSquare size={32} className="text-slate-300" />
                                        </div>
                                        <p className="text-sm font-medium">No messages yet</p>
                                        <p className="text-xs mt-1 text-slate-400">Start the conversation!</p>
                                    </div>
                                ) : (
                                    reqMessages?.map((m) => <MessageBubble key={m.id} message={m} isOwn={m.sender_id === me?.id} />)
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="px-5 py-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                                <div className="flex gap-3">
                                    <input
                                        placeholder="Type your message..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        className="flex-1 px-4 py-3 bg-white/80 border border-slate-200/50 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                                    />
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSend}
                                        disabled={!messageText.trim() || sendMutation.isPending || isSending}
                                        className={cn(
                                            'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                                            messageText.trim()
                                                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20 text-white' 
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        )}
                                    >
                                        {isSending ? (
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        ) : (
                                            <Send size={18} />
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                </FadeIn>
            </div>
        </PageLayout>
    )
}