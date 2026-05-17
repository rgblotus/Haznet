import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import PageLayout from '@/components/PageLayout'
import { Button, Badge, Card } from '@/components/ui'
import StatusTimeline from '@/components/shared/StatusTimeline'
import { FadeIn } from '@/components/ui/AnimatedList'
import { motion } from 'framer-motion'
import { ArrowLeft, ClipboardList, Send, CheckCircle, AlertCircle, Printer, Calendar, DollarSign, Users, Gavel } from 'lucide-react'

const statusFlow = [
    { key: 'draft', label: 'Draft', icon: ClipboardList },
    { key: 'bidding', label: 'Bidding', icon: Send },
    { key: 'evaluation', label: 'Evaluation', icon: AlertCircle },
    { key: 'awarded', label: 'Awarded', icon: CheckCircle },
    { key: 'closed', label: 'Closed', icon: CheckCircle },
]

const statusBadgeColors: Record<string, string> = {
    draft: 'neutral',
    bidding: 'default',
    evaluation: 'warning',
    awarded: 'success',
    closed: 'neutral',
}

export default function TenderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [tender, setTender] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        api.tenders.get(id)
            .then(setTender)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    const currentStatusIndex = statusFlow.findIndex(s => s.key === tender?.status)

    if (loading) {
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
                <div className="flex gap-3">
                    {tender.status === 'evaluation' && (
                        <Button variant="primary" size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 btn-shine">
                            <CheckCircle size={16} /> Evaluate
                        </Button>
                    )}
                    {tender.status === 'awarded' && (
                        <Button variant="primary" size="sm" className="bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 btn-shine">
                            <ClipboardList size={16} /> Award
                        </Button>
                    )}
                    <Button variant="secondary" size="sm" className="bg-white/80 backdrop-blur-sm border border-slate-200/50">
                        <Printer size={16} /> Print
                    </Button>
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
                                <Badge variant={statusBadgeColors[tender.status] || 'default'} className="font-semibold">{tender.status}</Badge>
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
                                    <p className="text-sm font-semibold text-slate-700">{tender.bids_count || 0}</p>
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
                </div>

                <div className="space-y-6">
                    <FadeIn delay={0.15}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 shadow-lg shadow-slate-200/10">
                            <h2 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2">
                                <Gavel size={16} className="text-amber-500" />
                                Tender Timeline
                            </h2>
                            <StatusTimeline steps={statusFlow} currentIndex={currentStatusIndex >= 0 ? currentStatusIndex : 0} variant="warning" />
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 shadow-lg shadow-slate-200/10">
                            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Users size={16} className="text-violet-500" />
                                Bids Summary
                            </h2>
                            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                    <ClipboardList size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">{tender.bids_count || 0} bids received</p>
                                    <p className="text-xs text-slate-400">Awaiting evaluation</p>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    {tender.status === 'awarded' && (
                        <FadeIn delay={0.25}>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-5 border border-emerald-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <CheckCircle size={16} className="text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-bold text-emerald-800">Tender Awarded</p>
                                </div>
                                <p className="text-sm text-emerald-600">Order can now be created from this tender.</p>
                            </div>
                        </FadeIn>
                    )}
                </div>
            </div>
        </PageLayout>
    )
}