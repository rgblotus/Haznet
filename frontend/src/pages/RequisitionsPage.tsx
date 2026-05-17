import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import PageLayout from '@/components/PageLayout'
import Modal from '@/components/ui/modal'
import { Button, Badge, Card } from '@/components/ui'
import { Input, Textarea, Select, FormField } from '@/components/ui/form'
import { EmptyState, TableSkeleton, CardSkeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/ui/AnimatedList'
import { WelcomeHeader } from '@/components/shared'
import { motion } from 'framer-motion'
import {
    Search, Plus, FileText, Clock, CheckCircle, User, Calendar,
    Send, Layers, Eye, LayoutGrid, List, ChevronLeft, ChevronRight,
    X, Package, Download, RefreshCw, Settings, Filter,
    Grid3X3, Table2, Zap
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const statusOptions = [
    { value: 'all', label: 'All Statuses', icon: Layers, color: 'neutral' },
    { value: 'draft', label: 'Draft', icon: FileText, color: 'neutral' },
    { value: 'submitted', label: 'Submitted', icon: Send, color: 'warning' },
    { value: 'under_review', label: 'Under Review', icon: Clock, color: 'secondary' },
    { value: 'processing', label: 'Processing', icon: Clock, color: 'primary' },
    { value: 'order_created', label: 'Order Created', icon: CheckCircle, color: 'success' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'success' },
]

const priorityColors: Record<string, string> = {
    High: 'bg-red-50 text-red-600 border-red-200',
    Medium: 'bg-amber-50 text-amber-600 border-amber-200',
    Low: 'bg-emerald-50 text-emerald-600 border-emerald-200',
}

function StatusFilterButton({ option, isActive, onClick }: { option: any; isActive: boolean; onClick: () => void }) {
    const Icon = option.icon
    const colorMap: Record<string, string> = {
        neutral: isActive ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'hover:bg-slate-50 border-transparent',
        warning: isActive ? 'bg-amber-50 border-amber-300 text-amber-600' : 'hover:bg-slate-50 border-transparent',
        secondary: isActive ? 'bg-violet-50 border-violet-300 text-violet-600' : 'hover:bg-slate-50 border-transparent',
        primary: isActive ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'hover:bg-slate-50 border-transparent',
        success: isActive ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'hover:bg-slate-50 border-transparent',
    }
    
    const btnClass = isActive 
        ? `flex items-center gap-3 w-full px-3 py-2.5 rounded-lg cursor-pointer text-left transition-all border ${colorMap[option.color] || colorMap.neutral}`
        : 'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg cursor-pointer text-left transition-all border border-transparent hover:bg-slate-50'
    return (
        <button onClick={onClick} className={btnClass}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-current/10' : 'bg-slate-100'}`}>
                <Icon size={16} className={isActive ? 'text-current' : 'text-slate-400'} />
            </div>
            <span className="text-sm font-semibold">{option.label}</span>
        </button>
    )
}

function ActionButton({ icon: Icon, label, onClick, active, color = 'indigo' }: { icon: any; label: string; onClick?: () => void; active?: boolean; color?: string }) {
    const activeClass = active ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : ''
    const btnClass = active 
        ? `flex items-center gap-3 w-full px-3 py-2.5 rounded-lg cursor-pointer text-left transition-all border ${activeClass}`
        : 'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg cursor-pointer text-left transition-all border border-transparent hover:bg-slate-50'
    return (
        <button onClick={onClick} className={btnClass}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                <Icon size={15} className={active ? 'text-indigo-600' : 'text-slate-400'} />
            </div>
            <span className={`text-sm font-medium ${active ? 'text-indigo-600' : 'text-slate-600'}`}>{label}</span>
        </button>
    )
}

function RightSidebar({ 
    onStatusFilter, 
    currentStatus, 
    onCreate,
    viewMode,
    onViewModeChange,
}: { 
    onStatusFilter: (s: string) => void; 
    currentStatus: string;
    onCreate?: () => void;
    viewMode?: 'table' | 'grid';
    onViewModeChange?: (mode: 'table' | 'grid') => void;
}) {
    return (
        <div className="p-4 space-y-3">
            <div className="p-4 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 rounded-xl border border-slate-200/60">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                <div className="space-y-1.5">
                    <button onClick={onCreate} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200 border border-transparent">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <Plus size={14} className="text-indigo-500" />
                        </div>
                        <span className="text-sm font-medium">Create New</span>
                    </button>
                    <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-all duration-200 border border-transparent">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                            <RefreshCw size={14} className="text-slate-500" />
                        </div>
                        <span className="text-sm font-medium">Refresh</span>
                    </button>
                    <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-all duration-200 border border-transparent">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Download size={14} className="text-slate-500" />
                        </div>
                        <span className="text-sm font-medium">Export</span>
                    </button>
                </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-100/60 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">View Mode</h3>
                <div className="flex gap-2">
                    <button onClick={() => onViewModeChange?.('table')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'table' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                        <Table2 size={14} /> Table
                    </button>
                    <button onClick={() => onViewModeChange?.('grid')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'grid' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                        <Grid3X3 size={14} /> Grid
                    </button>
                </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-100/60 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Filter by Status</h3>
                <div className="space-y-1">
                    {statusOptions.slice(0, 5).map((s) => {
                        const isActive = currentStatus === s.value
                        return (
                            <button 
                                key={s.value} 
                                onClick={() => onStatusFilter(s.value)} 
                                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left text-sm font-medium transition-all duration-200 ${isActive ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                {s.label}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function RequisitionCard({ req }: { req: any }) {
    return (
        <Link 
            to={'/requisitions/' + req.id} 
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 flex flex-col gap-4 border border-slate-100/50 hover:border-indigo-300/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 no-underline group"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center group-hover:from-indigo-100 group-hover:to-violet-100 transition-colors">
                        <FileText size={18} className="text-indigo-500" />
                    </div>
                    <div>
                        <span className="text-indigo-600 text-sm font-bold">{req.requisition_no}</span>
                        <p className="text-xs text-slate-400">{req.category || 'General'}</p>
                    </div>
                </div>
                <Badge 
                    variant={
                        req.status === 'completed' ? 'success' : 
                        req.status === 'under_review' ? 'warning' : 
                        req.status === 'returned' ? 'danger' : 
                        'default'
                    }
                    dot
                >
                    {req.status?.replace('_', ' ')}
                </Badge>
            </div>
            <h3 className="text-base font-bold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-2">{req.title}</h3>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100/50">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-500">{req.created_at ? new Date(req.created_at).toLocaleDateString() : '-'}</span>
                </div>
                <span className="text-lg font-extrabold text-slate-700">${req.total_estimate?.toLocaleString() || '0'}</span>
            </div>
        </Link>
    )
}

export default function RequisitionsPage() {
    const user = useAuthStore((s) => s.user)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
    const [page, setPage] = useState(1)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        title: '', description: '', category: 'materials', priority: 'Medium', quantity: '1',
        unit_price_estimate: '', total_estimate: '',
    })
    const queryClient = useQueryClient()
    const pageSize = 12

    const { data: reqsResponse, isLoading } = useQuery({
        queryKey: ['requisitions', statusFilter, page, search],
        queryFn: () => api.requisitions.list({
            page, page_size: pageSize,
            status_filter: statusFilter !== 'all' ? statusFilter : undefined,
            search: search || undefined,
        }),
    })

    const createMut = useMutation({
        mutationFn: (data: any) => api.requisitions.create(data),
        onSuccess: () => {
            setShowModal(false)
            setFormData({ title: '', description: '', category: 'materials', priority: 'Medium', quantity: '1', unit_price_estimate: '', total_estimate: '' })
            queryClient.invalidateQueries({ queryKey: ['requisitions'] })
        },
    })

    const reqs = reqsResponse?.data || []
    const meta = reqsResponse?.meta
    const totalPages = meta?.total_pages || 1
    const totalCount = meta?.total || 0

    const stats = [
        { label: 'Total', value: totalCount, icon: FileText, color: 'from-indigo-500 to-violet-500' },
        { label: 'Draft', value: reqs.filter((r: any) => r.status === 'draft').length, icon: FileText, color: 'from-slate-400 to-slate-500' },
        { label: 'Submitted', value: reqs.filter((r: any) => r.status === 'submitted').length, icon: Send, color: 'from-amber-500 to-orange-500' },
        { label: 'Processing', value: reqs.filter((r: any) => r.status === 'processing').length, icon: Clock, color: 'from-cyan-500 to-cyan-600' },
    ]


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const payload = {
            ...formData,
            quantity: parseInt(formData.quantity) || 1,
            unit_price_estimate: parseFloat(formData.unit_price_estimate) || undefined,
            total_estimate: parseFloat(formData.total_estimate) || undefined,
        }
        createMut.mutate(payload)
    }

    return (
        <PageLayout
            title="Requisitions"
            rightSidebar={
                <RightSidebar 
                    onStatusFilter={(s) => { setStatusFilter(s); setPage(1); }} 
                    currentStatus={statusFilter}
                    onCreate={() => setShowModal(true)}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
            }
            actions={
                <Button variant="primary" onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/20 btn-shine">
                    <Plus size={18} /> New Requisition
                </Button>
            }
        >
            <div className="max-w-7xl mx-auto space-y-6">
                <WelcomeHeader />

                <FadeIn delay={0.1}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-100/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
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
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-100/50 rounded-xl focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                        <Search size={20} className="text-slate-400 shrink-0" />
                        <Input 
                            type="text" 
                            placeholder="Search requisitions..." 
                            value={search} 
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
                            className="bg-transparent border-none text-base focus:ring-0 p-0" 
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-1.5 border border-slate-100/50">
                        <button 
                            onClick={() => setViewMode('table')} 
                            className={cn(
                                'p-2.5 rounded-lg transition-all',
                                viewMode === 'table' ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md' : 'hover:bg-slate-100 text-slate-400'
                            )}
                        >
                            <List size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')} 
                            className={cn(
                                'p-2.5 rounded-lg transition-all',
                                viewMode === 'grid' ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md' : 'hover:bg-slate-100 text-slate-400'
                            )}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                {isLoading ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                            {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
                        </div>
                    ) : (
                        <TableSkeleton rows={5} />
                    )
                ) : reqs.length === 0 ? (
                    <Card className="p-16 text-center bg-white/80 backdrop-blur-sm border border-slate-100/50">
                        <EmptyState 
                            icon={<FileText size={48} className="text-slate-300" />} 
                            title="No requisitions found"
                            description="Create a new requisition to get started"
                        />
                        <div className="mt-4">
                            <Button variant="primary" onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-500 to-violet-500">
                                <Plus size={18} /> Create Requisition
                            </Button>
                        </div>
                    </Card>
                ) : viewMode === 'table' ? (
                    <Card className="overflow-hidden border border-slate-100/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/10">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Req No</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Title</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-28">Priority</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Status</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider w-28">Amount</th>
                                        <th className="px-5 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-20">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reqs.map((req: any) => (
                                        <motion.tr 
                                            key={req.id} 
                                            className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors group"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <td className="px-5 py-3 align-middle">
                                                <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-lg">{req.requisition_no}</span>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{req.title}</p>
                                                    <p className="text-xs text-slate-400">{req.category || 'General'}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <span className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border', priorityColors[req.priority] || priorityColors.Medium)}>
                                                    {req.priority || 'Medium'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <Badge 
                                                    variant={
                                                        req.status === 'completed' ? 'success' : 
                                                        req.status === 'under_review' ? 'warning' : 
                                                        req.status === 'returned' ? 'danger' : 
                                                        req.status === 'processing' ? 'primary' :
                                                        'default'
                                                    }
                                                    className="font-medium"
                                                    dot
                                                >
                                                    {req.status?.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-right">
                                                <span className="text-sm font-bold text-slate-700">${req.total_estimate?.toLocaleString() || '0'}</span>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-center">
                                                <Link 
                                                    to={'/requisitions/' + req.id} 
                                                    className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 inline-flex items-center justify-center text-indigo-500 transition-all hover:scale-110"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                        {reqs.map((req: any) => <RequisitionCard key={req.id} req={req} />)}
                    </div>
                )}

                {totalPages > 1 && (
                    <FadeIn delay={0.3}>
                    <div className="flex items-center justify-center gap-2">
                        <Button variant="secondary" onClick={() => setPage(p => p - 1)} disabled={page === 1} className="rounded-xl">
                            <ChevronLeft size={18} />
                        </Button>
                        <div className="px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-xl text-sm font-semibold text-slate-500 border border-slate-100/50">
                            Page {page} of {totalPages}
                        </div>
                        <Button variant="secondary" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="rounded-xl">
                            <ChevronRight size={18} />
                        </Button>
                    </div>
                    </FadeIn>
                )}
                </FadeIn>

                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Requisition" size="lg">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <FormField label="Title *" required>
                            <Input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="Enter requisition title" />
                        </FormField>
                        <FormField label="Description">
                            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Describe the requirement" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Category">
                                <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="materials">Materials</option>
                                    <option value="equipment">Equipment</option>
                                    <option value="services">Services</option>
                                </Select>
                            </FormField>
                            <FormField label="Priority">
                                <Select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </Select>
                            </FormField>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Quantity">
                                <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} min={1} />
                            </FormField>
                            <FormField label="Estimated Amount ($)">
                                <Input type="number" value={formData.total_estimate} onChange={(e) => setFormData({ ...formData, total_estimate: e.target.value })} placeholder="0.00" />
                            </FormField>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={createMut.isPending} variant="primary" loading={createMut.isPending} className="bg-gradient-to-r from-indigo-500 to-violet-500">
                                {createMut.isPending ? 'Creating...' : 'Create Requisition'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageLayout>
    )
}