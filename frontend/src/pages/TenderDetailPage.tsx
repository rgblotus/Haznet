import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import PageLayout from '@/components/PageLayout'
import { Button, Badge, Card } from '@/components/ui'
import StatusTimeline from '@/components/shared/StatusTimeline'
import { FadeIn } from '@/components/ui/AnimatedList'
import { motion } from 'framer-motion'
import { ArrowLeft, ClipboardList, Send, CheckCircle, AlertCircle, Printer, Calendar, DollarSign, Users, Gavel, Award, Trash2 } from 'lucide-react'
import { useAuthStore, canCreateTender, canAwardBid } from '@/stores/authStore'

const statusFlow = [
    { key: 'draft', label: 'Draft', icon: ClipboardList },
    { key: 'published', label: 'Published', icon: Send },
    { key: 'bidding', label: 'Bidding', icon: Send },
    { key: 'evaluating', label: 'Evaluation', icon: AlertCircle },
    { key: 'awarded', label: 'Awarded', icon: Award },
    { key: 'closed', label: 'Closed', icon: CheckCircle },
]

const statusBadgeColors: Record<string, string> = {
    draft: 'neutral',
    published: 'info',
    bidding: 'default',
    evaluating: 'warning',
    awarded: 'success',
    closed: 'neutral',
    cancelled: 'danger',
}

export default function TenderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [showAwardModal, setShowAwardModal] = useState(false)
    const [selectedBidId, setSelectedBidId] = useState<string | null>(null)
    
    const user = useAuthStore((s) => s.user)
    const role = user?.role || 'indentor'
    const canProcess = canCreateTender(role) || canAwardBid(role)
    const isAdmin = role === 'admin'

    const { data: fetchedTender, isLoading } = useQuery({
        queryKey: ['tender', id],
        queryFn: () => api.tenders.get(id!),
        enabled: !!id,
    })

    const [tender, setTender] = useState<any>(undefined)
    useEffect(() => { if (fetchedTender) setTender(fetchedTender) }, [fetchedTender])

    const { data: fetchedBids = [] } = useQuery({
        queryKey: ['tender-bids', id],
        queryFn: () => api.tenders.getBids(id!),
        enabled: !!id,
    })

    const [bids, setBids] = useState<any[]>([])
    useEffect(() => { if (fetchedBids?.length) setBids(fetchedBids) }, [fetchedBids])

    const currentStatusIndex = statusFlow.findIndex(s => s.key === tender?.status)

    const handleAction = async (action: string, bidId?: string) => {
        if (!id) return
        setActionLoading(action)
        try {
            switch (action) {
                case 'publish':
                    await api.tenders.publish(id)
                    break
                case 'award':
                    if (bidId) await api.tenders.awardBid(id, bidId)
                    break
                case 'delete':
                    await api.tenders.delete(id)
                    window.location.href = '/tenders'
                    return
            }
            const updated = await api.tenders.get(id)
            setTender(updated)
            if (action !== 'delete') {
                const updatedBids = await api.tenders.getBids(id)
                setBids(updatedBids)
            }
            setShowAwardModal(false)
            setSelectedBidId(null)
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Action failed'
            console.error(err)
            alert(msg)
        } finally {
            setActionLoading(null)
        }
    }

    if (isLoading) {
        return <PageLayout title="Tender Details"><div className="flex items-center justify-center h-[60vh] skeleton text-slate-400">Loading...</div></PageLayout>
    }

    if (!tender) {
        return (
            <PageLayout title="Tender Details">
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
                        <Gavel size={40} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 mb-4 font-medium">Tender not found</p>
                    <Link to="/tenders" className="text-indigo-500 no-underline flex items-center gap-2 hover:text-indigo-600 transition-colors font-medium">
                        <ArrowLeft size={16} /> Back to Tenders
                    </Link>
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout 
            title={`Tender ${tender.tender_no}`}
            actions={
                <div className="flex items-center gap-3">
                    <Link to="/tenders" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
                        <ArrowLeft size={14} /> Back
                    </Link>
                </div>
            }
        >
            <div className="grid grid-cols-[1fr_320px] gap-6">
                <div>
                    <FadeIn>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 mb-6 shadow-lg shadow-slate-200/10">
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-2 mb-2"
                                    >
                                        <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">{tender.tender_no}</span>
                                    </motion.div>
                                    <h1 className="text-2xl font-bold text-slate-800">{tender.title}</h1>
                                </div>
                                <Badge variant={statusBadgeColors[tender.status] || 'default'} className="font-semibold" dot>{tender.status?.replace(/_/g, ' ')}</Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-4 pt-5 border-t border-slate-100/50">
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar size={14} className="text-amber-500" />
                                        <p className="text-xs text-slate-400">Issue Date</p>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700">{tender.issue_date ? new Date(tender.issue_date).toLocaleDateString() : '-'}</p>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar size={14} className="text-rose-500" />
                                        <p className="text-xs text-slate-400">Closing Date</p>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700">{tender.closing_date ? new Date(tender.closing_date).toLocaleDateString() : '-'}</p>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <DollarSign size={14} className="text-emerald-500" />
                                        <p className="text-xs text-slate-400">Est. Value</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">${tender.estimated_value?.toLocaleString() || '0'}</p>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Users size={14} className="text-violet-500" />
                                        <p className="text-xs text-slate-400">Bids Received</p>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700">{bids.length}</p>
                                </motion.div>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 shadow-lg shadow-slate-200/10">
                            <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <ClipboardList size={18} className="text-amber-500" />
                                Description
                            </h2>
                            <p className="text-sm text-slate-500 leading-relaxed">{tender.description || 'No description provided.'}</p>
                        </div>
                    </FadeIn>

                    {/* Bids Table */}
                    {canProcess && bids.length > 0 && (
                        <FadeIn delay={0.15}>
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 shadow-lg shadow-slate-200/10">
                                <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <Gavel size={18} className="text-amber-500" />
                                    Bids ({bids.length})
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-400 uppercase">Vendor</th>
                                                <th className="px-4 py-2 text-right text-xs font-bold text-slate-400 uppercase">Amount</th>
                                                <th className="px-4 py-2 text-right text-xs font-bold text-slate-400 uppercase">Technical</th>
                                                <th className="px-4 py-2 text-right text-xs font-bold text-slate-400 uppercase">Financial</th>
                                                <th className="px-4 py-2 text-right text-xs font-bold text-slate-400 uppercase">Total</th>
                                                <th className="px-4 py-2 text-center text-xs font-bold text-slate-400 uppercase">Status</th>
                                                {tender.status === 'evaluating' && (
                                                    <th className="px-4 py-2 text-center text-xs font-bold text-slate-400 uppercase">Action</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bids.map((bid) => (
                                                <tr key={bid.id} className="border-b border-slate-50 hover:bg-amber-50/30 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-slate-700">Vendor #{bid.vendor_id?.slice(0, 8)}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-slate-700">${bid.amount?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{bid.technical_score?.toFixed(1) || '-'}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{bid.financial_score?.toFixed(1) || '-'}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-700">{bid.total_score?.toFixed(1) || '-'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {bid.is_awarded ? (
                                                            <Badge variant="success" className="text-xs">Awarded</Badge>
                                                        ) : (
                                                            <Badge variant="neutral" className="text-xs">Pending</Badge>
                                                        )}
                                                    </td>
                                                    {tender.status === 'evaluating' && (
                                                        <td className="px-4 py-3 text-center">
                                                            <button 
                                                                onClick={() => { setSelectedBidId(bid.id); setShowAwardModal(true) }}
                                                                className="px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                                            >
                                                                Award
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </FadeIn>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Quick Actions */}
                    <FadeIn>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-100/50">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</h2>
                            </div>
                            <div className="p-3 space-y-2">
                                {canProcess && tender.status === 'draft' && (
                                    <button
                                        onClick={() => handleAction('publish')}
                                        disabled={actionLoading === 'publish'}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-amber-200 disabled:opacity-50"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                                            <Send size={14} className="text-white" />
                                        </div>
                                        <span className="text-sm font-semibold">Publish Tender</span>
                                    </button>
                                )}
                                {canProcess && tender.status === 'evaluating' && bids.length > 0 && (
                                    <button
                                        onClick={() => setShowAwardModal(true)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-emerald-200"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                                            <Award size={14} className="text-white" />
                                        </div>
                                        <span className="text-sm font-semibold">Award Bid</span>
                                    </button>
                                )}
                                {isAdmin && tender.status !== 'awarded' && (
                                    <button
                                        onClick={() => { if (confirm('Delete this tender?')) handleAction('delete') }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-red-200"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                                            <Trash2 size={14} className="text-white" />
                                        </div>
                                        <span className="text-sm font-semibold">Delete</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </FadeIn>

                    {/* Progress Timeline */}
                    <FadeIn delay={0.1}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                            <div className="p-3 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-b border-slate-100/50">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</h2>
                            </div>
                            <div className="p-3">
                                <StatusTimeline steps={statusFlow} currentIndex={currentStatusIndex >= 0 ? currentStatusIndex : 0} variant="warning" />
                            </div>
                        </div>
                    </FadeIn>

                    {/* Bid Summary */}
                    {bids.length > 0 && (
                        <FadeIn delay={0.15}>
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                                <div className="p-3 bg-gradient-to-r from-violet-500/5 to-purple-500/5 border-b border-slate-100/50">
                                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bids</h2>
                                </div>
                                <div className="p-3 space-y-1.5">
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50">
                                        <span className="text-xs text-slate-400">Total</span>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{bids.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50">
                                        <span className="text-xs text-slate-400">Highest</span>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600">${Math.max(...bids.map((b) => b.amount || 0)).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50">
                                        <span className="text-xs text-slate-400">Lowest</span>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600">${Math.min(...bids.map((b) => b.amount || 0)).toLocaleString()}</span>
                                    </div>
                                    {bids.some(b => b.is_awarded) && (
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                                            <span className="text-xs text-emerald-600 font-medium">Awarded</span>
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">Yes</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </FadeIn>
                    )}

                    {/* Awarded Status */}
                    {tender.status === 'awarded' && (
                        <FadeIn delay={0.2}>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-4 border border-emerald-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <CheckCircle size={16} className="text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-bold text-emerald-800">Tender Awarded</p>
                                </div>
                                <p className="text-xs text-emerald-600">Order can now be created from this tender.</p>
                            </div>
                        </FadeIn>
                    )}
                </div>
            </div>

            {/* Award Modal */}
            {showAwardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
                    >
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Award Bid</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            {selectedBidId 
                                ? 'Are you sure you want to award this bid?' 
                                : 'Select a bid from the table to award, or choose below:'}
                        </p>
                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                            {bids.map((bid) => (
                                <button
                                    key={bid.id}
                                    onClick={() => setSelectedBidId(bid.id)}
                                    className={`w-full p-3 rounded-xl border text-left transition-colors ${
                                        selectedBidId === bid.id 
                                            ? 'border-emerald-300 bg-emerald-50' 
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium text-slate-700">Vendor #{bid.vendor_id?.slice(0, 8)}</span>
                                        <span className="text-sm font-bold text-slate-700">${bid.amount?.toLocaleString()}</span>
                                    </div>
                                    {bid.total_score && (
                                        <span className="text-xs text-slate-400">Score: {bid.total_score.toFixed(1)}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => { setShowAwardModal(false); setSelectedBidId(null) }} className="flex-1">Cancel</Button>
                            <Button 
                                variant="primary" 
                                onClick={() => selectedBidId && handleAction('award', selectedBidId)} 
                                loading={actionLoading === 'award'} 
                                disabled={!selectedBidId}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600"
                            >
                                Award
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </PageLayout>
    )
}
