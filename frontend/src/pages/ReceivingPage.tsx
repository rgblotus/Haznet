import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import PageLayout from '@/components/PageLayout'
import Modal from '@/components/ui/modal'
import { Button, Badge, Card } from '@/components/ui'
import { EmptyState, TableSkeleton } from '@/components/ui/skeleton'
import { FadeIn, AnimatedList, AnimatedItem } from '@/components/ui/AnimatedList'
import { WelcomeHeader } from '@/components/shared'
import { motion } from 'framer-motion'
import { Plus, Package, Truck, Clock, Eye, LayoutGrid, List, Search, CheckCircle, AlertCircle, X, ChevronRight, ChevronLeft, ClipboardCheck, XCircle, Scale, QrCode, ShieldCheck, Check, RefreshCw, Download, Zap, Gauge } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

function RightSidebar({ pendingCount, passedCount, failedCount }: { pendingCount: number; passedCount: number; failedCount: number }) {
    return (
        <div className="p-4 space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-100/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</h3>
                </div>
                <div className="p-3 space-y-2">
                    <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-50 to-cyan-100/50 text-cyan-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-cyan-200">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                            <ClipboardCheck size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold">Start Inspection</span>
                    </button>
                    <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-50 to-violet-100/50 text-violet-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-violet-200">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm">
                            <QrCode size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold">Scan Receipt</span>
                    </button>
                    <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-emerald-200">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                            <Truck size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold">View Deliveries</span>
                    </button>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="p-3 bg-gradient-to-r from-emerald-500/5 to-emerald-100/50 border-b border-slate-100/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inspection Stats</h3>
                </div>
                <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-100/50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                        <span className="text-xs text-amber-600 font-semibold">Pending</span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 shadow-sm">{pendingCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-100/50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                        <span className="text-xs text-emerald-600 font-semibold">Passed</span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 shadow-sm">{passedCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 border border-red-100/50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                        <span className="text-xs text-red-600 font-semibold">Failed</span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-100 text-red-700 shadow-sm">{failedCount}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="p-3 bg-gradient-to-r from-violet-500/5 to-violet-100/50 border-b border-slate-100/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Process Steps</h3>
                </div>
                <div className="p-3 space-y-1.5">
                    {['Goods Received', 'Quantity Check', 'Quality Inspection', 'Update Inventory', 'Close Order'].map((step, i) => (
                        <div key={step} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50/80 transition-all duration-200 border border-transparent hover:border-slate-100">
                            <div className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-200',
                                i < 2 ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-sm shadow-cyan-500/30' : 'bg-slate-100 text-slate-400'
                            )}>
                                {i < 2 ? <Check size={10} /> : i + 1}
                            </div>
                            <span className={cn('text-xs font-medium transition-colors', i < 2 ? 'text-slate-700' : 'text-slate-400')}>{step}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function ReceivingCard({ postOrder, onInspect }: { postOrder: any; onInspect: (id: number) => void }) {
    const qualityBg = postOrder.quality_status === 'passed' 
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
        : postOrder.quality_status === 'failed' 
        ? 'bg-red-50 text-red-600 border border-red-200' 
        : 'bg-amber-50 text-amber-600 border border-amber-200'
    
    const statusBg = postOrder.status === 'passed' 
        ? 'bg-emerald-50 text-emerald-600' 
        : postOrder.status === 'failed' 
        ? 'bg-red-50 text-red-600' 
        : 'bg-amber-50 text-amber-600'
    
    return (
        <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 flex flex-col gap-4 border border-slate-100/50 hover:shadow-lg transition-all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 flex items-center justify-center">
                        <Truck size={18} className="text-cyan-500" />
                    </div>
                    <div>
                        <span className="text-cyan-600 text-sm font-bold">{postOrder.order?.order_no || '-'}</span>
                        <p className="text-xs text-slate-400">{postOrder.items?.length || 0} items</p>
                    </div>
                </div>
                <span className={cn('px-3 py-1.5 rounded-lg text-xs font-bold', statusBg)}>{postOrder.status || 'pending'}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-100/50">
                <div>
                    <p className="text-xs text-slate-400">Ordered / Received</p>
                    <p className="text-sm font-bold text-slate-700">{postOrder.ordered_quantity} / {postOrder.received_quantity || '-'}</p>
                </div>
                <span className={cn('px-3 py-1.5 rounded-lg text-xs font-bold', qualityBg)}>
                    {postOrder.quality_status || 'pending'}
                </span>
            </div>
            <Button 
                variant="primary" 
                size="sm" 
                onClick={() => onInspect(postOrder.id)} 
                className="bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/25"
            >
                <ClipboardCheck size={16} /> Inspect
            </Button>
        </motion.div>
    )
}

export default function ReceivingPage() {
    const user = useAuthStore((s) => s.user)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
    const [currentPage, setCurrentPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [preselectedOrderId, setPreselectedOrderId] = useState<number | null>(null)
    const [modalSelectedOrders, setModalSelectedOrders] = useState<Set<number>>(new Set())
    const [inspectionResults, setInspectionResults] = useState<Record<number, 'passed' | 'failed'>>({})
    const [notes, setNotes] = useState<Record<number, string>>({})
    const itemsPerPage = 12

    const { data: postOrders } = useQuery({ queryKey: ['post-orders'], queryFn: () => api.postOrders.list() })

    useEffect(() => {
        if (isModalOpen && preselectedOrderId) setModalSelectedOrders(new Set([preselectedOrderId]))
        else if (isModalOpen && !preselectedOrderId) setModalSelectedOrders(new Set())
        setInspectionResults({})
        setNotes({})
    }, [isModalOpen, preselectedOrderId])

    const pendingCount = postOrders?.filter((po: any) => po.status === 'pending_inspection').length || 0
    const passedCount = postOrders?.filter((po: any) => po.quality_status === 'passed').length || 0
    const failedCount = postOrders?.filter((po: any) => po.quality_status === 'failed').length || 0

    const totalPages = Math.ceil((postOrders?.length || 0) / itemsPerPage)
    const paginatedOrders = postOrders?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || []
    const pendingOrders = postOrders?.filter((po: any) => po.status === 'pending_inspection') || []


    const handleStartInspection = () => { setPreselectedOrderId(null); setIsModalOpen(true) }
    const handleInspectOrder = (orderId: number) => { setPreselectedOrderId(orderId); setIsModalOpen(true) }
    const handleConfirmInspection = (selectedOrders: any[]) => { console.log('Starting inspection for orders:', selectedOrders); setIsModalOpen(false); setPreselectedOrderId(null) }
    const handleToggleOrder = (id: number) => {
        const newSelected = new Set(modalSelectedOrders)
        if (newSelected.has(id)) newSelected.delete(id)
        else newSelected.add(id)
        setModalSelectedOrders(newSelected)
    }
    const handleInspectionResult = (id: number, result: 'passed' | 'failed') => { setInspectionResults(prev => ({ ...prev, [id]: result })) }
    const handleNoteChange = (id: number, note: string) => { setNotes(prev => ({ ...prev, [id]: note })) }
    const handleModalConfirm = () => {
        const selectedData = pendingOrders.filter((po: any) => modalSelectedOrders.has(po.id))
        const results = selectedData.map((po: any) => ({ ...po, result: inspectionResults[po.id] || 'passed', notes: notes[po.id] || '' }))
        handleConfirmInspection(results)
        setModalSelectedOrders(new Set())
        setInspectionResults({})
        setNotes({})
    }
    const hasAllResults = Array.from(modalSelectedOrders).every(id => inspectionResults[id])

    return (
        <PageLayout 
            rightSidebar={<RightSidebar pendingCount={pendingCount} passedCount={passedCount} failedCount={failedCount} />}
        >
            <div className="max-w-7xl mx-auto space-y-6">
                <WelcomeHeader />

                <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Pending Inspection', value: pendingCount, icon: Clock, color: 'from-amber-500 to-amber-600' },
                        { label: 'Passed', value: passedCount, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
                        { label: 'Failed', value: failedCount, icon: XCircle, color: 'from-red-500 to-red-600' },
                    ].map((stat) => (
                        <div 
                            key={stat.label} 
                            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-100/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br', stat.color, 'flex items-center justify-center shadow-lg')}>
                                    <stat.icon size={22} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-extrabold text-slate-700">{stat.value}</p>
                                    <p className="text-sm text-slate-500">{stat.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                </FadeIn>

                <FadeIn delay={0.15}>
                {viewMode === 'list' ? (
                    <Card className="overflow-hidden border border-slate-100/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/10">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Order</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Ordered</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Received</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Quality</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-16 text-center">
                                                <EmptyState icon={<Truck size={48} className="text-slate-300" />} title="No items to receive" />
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedOrders.map((po: any, index: number) => (
                                            <motion.tr 
                                                key={po.id} 
                                                className="border-b border-slate-50 hover:bg-cyan-50/30 transition-colors"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <td className="px-5 py-3 align-middle text-sm font-semibold text-slate-700">{po.order?.order_no || '-'}</td>
                                                <td className="px-5 py-3 align-middle text-sm text-slate-500">{po.ordered_quantity}</td>
                                                <td className="px-5 py-3 align-middle text-sm text-slate-500">{po.received_quantity || '-'}</td>
                                                <td className="px-5 py-3 align-middle">
                                                    <Badge variant={po.quality_status === 'passed' ? 'success' : po.quality_status === 'failed' ? 'danger' : 'warning'} className="font-medium" dot>
                                                        {po.quality_status || 'pending'}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3 align-middle">
                                                    <Badge variant={po.status === 'completed' ? 'success' : po.status === 'pending_inspection' ? 'warning' : 'neutral'} className="font-medium" dot>
                                                        {po.status || 'pending'}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3 align-middle text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleInspectOrder(po.id)} className="text-cyan-600 hover:bg-cyan-50">
                                                        <Eye size={16} />
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                        {paginatedOrders.length === 0 ? (
                            <Card className="p-16 text-center col-span-full bg-white/80 backdrop-blur-sm">
                                <EmptyState icon={<Truck size={48} className="text-slate-300" />} title="No items to receive" />
                            </Card>
                        ) : (
                            paginatedOrders.map((po: any) => <ReceivingCard key={po.id} postOrder={po} onInspect={handleInspectOrder} />)
                        )}
                    </div>
                )}
                </FadeIn>

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="rounded-xl">
                            <ChevronLeft size={18} />
                        </Button>
                        <div className="px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-xl text-sm font-semibold text-slate-500 border border-slate-100/50">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="rounded-xl">
                            <ChevronRight size={18} />
                        </Button>
                    </div>
                )}

                <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setPreselectedOrderId(null) }} title="Start Inspection" size="xl">
                    {!postOrders && isModalOpen ? (
                        <div className="p-8 text-center text-slate-400">Loading orders...</div>
                    ) : !postOrders && !isModalOpen ? (
                        <div className="p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3">
                            <XCircle size={18} className="text-red-600" />
                            <span className="text-sm text-red-600">Failed to load orders. Please try again.</span>
                        </div>
                    ) : pendingOrders.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Package size={32} className="text-slate-300" />
                            </div>
                            <p className="text-lg font-bold text-slate-700">No pending orders for inspection</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 p-3 bg-cyan-50 rounded-xl border border-cyan-200">
                                <p className="text-sm font-semibold text-cyan-700">Select orders to inspect ({modalSelectedOrders.size} selected)</p>
                            </div>
                            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
                                {pendingOrders.map((po: any) => (
                                    <motion.div 
                                        key={po.id} 
                                        className={cn(
                                            'p-4 border-2 rounded-xl cursor-pointer transition-all',
                                            modalSelectedOrders.has(po.id) 
                                                ? 'border-cyan-500 bg-cyan-50' 
                                                : 'border-slate-200 bg-white hover:border-cyan-200'
                                        )} 
                                        onClick={() => handleToggleOrder(po.id)}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">{po.order?.order_no || 'N/A'}</p>
                                                <p className="text-xs text-slate-400">Ordered: {po.ordered_quantity} | Received: {po.received_quantity || '-'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button" 
                                                    onClick={(e) => { e.stopPropagation(); handleInspectionResult(po.id, 'passed') }} 
                                                    className={cn(
                                                        'px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all',
                                                        inspectionResults[po.id] === 'passed' 
                                                            ? 'bg-emerald-500 text-white border-emerald-500' 
                                                            : 'bg-emerald-50 text-emerald-600 border-2 border-emerald-500'
                                                    )}
                                                >
                                                    <CheckCircle size={14} /> Pass
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={(e) => { e.stopPropagation(); handleInspectionResult(po.id, 'failed') }} 
                                                    className={cn(
                                                        'px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all',
                                                        inspectionResults[po.id] === 'failed' 
                                                            ? 'bg-red-500 text-white border-red-500' 
                                                            : 'bg-red-50 text-red-600 border-2 border-red-500'
                                                    )}
                                                >
                                                    <XCircle size={14} /> Fail
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ClipboardCheck size={14} className="text-slate-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Add inspection notes (optional)" 
                                                value={notes[po.id] || ''} 
                                                onChange={(e) => handleNoteChange(po.id, e.target.value)} 
                                                onClick={(e) => e.stopPropagation()} 
                                                className="flex-1 px-3 py-2 rounded-lg border-2 border-slate-200 text-xs bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="mt-5 flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button variant="secondary" onClick={() => { setIsModalOpen(false); setPreselectedOrderId(null) }}>Cancel</Button>
                                <Button 
                                    variant="primary" 
                                    onClick={handleModalConfirm} 
                                    disabled={modalSelectedOrders.size === 0 || !hasAllResults} 
                                    className="bg-gradient-to-br from-cyan-500 to-cyan-600"
                                >
                                    Complete Inspection ({modalSelectedOrders.size})
                                </Button>
                            </div>
                        </>
                    )}
                </Modal>
            </div>
        </PageLayout>
    )
}