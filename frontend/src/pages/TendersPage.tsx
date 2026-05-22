import { useState, useEffect, useMemo } from 'react'
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
import { Plus, Calendar, Gavel, DollarSign, Eye, LayoutGrid, List, Search, TrendingUp, Award, X, Lightbulb, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import type { Tender } from '@/types/models'
import { cn } from '@/lib/utils'

const statusOptions = [
    { value: 'all', label: 'All Statuses', color: 'neutral' },
    { value: 'draft', label: 'Draft', color: 'neutral' },
    { value: 'bidding', label: 'Bidding', color: 'primary' },
    { value: 'evaluation', label: 'Evaluation', color: 'warning' },
    { value: 'awarded', label: 'Awarded', color: 'success' },
    { value: 'closed', label: 'Closed', color: 'neutral' },
]

const colorMap: Record<string, string> = {
    neutral: 'bg-slate-50 text-slate-500 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
}

function ActionButton({ icon: Icon, label, onClick, active, color = 'indigo', href }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; onClick?: () => void; active?: boolean; color?: string; href?: string }) {
    const colorClasses: Record<string, string> = {
        indigo: active ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'hover:bg-slate-50 border-transparent',
        violet: active ? 'bg-violet-50 border-violet-300 text-violet-600' : 'hover:bg-slate-50 border-transparent',
        emerald: active ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'hover:bg-slate-50 border-transparent',
        amber: active ? 'bg-amber-50 border-amber-300 text-amber-600' : 'hover:bg-slate-50 border-transparent',
    }
    const content = (
        <div className={cn('flex items-center gap-3 w-full px-4 py-3 rounded-xl cursor-pointer text-left transition-all border', colorClasses[color] || colorClasses.indigo)}>
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', active ? 'bg-current/10' : 'bg-slate-100')}>
                <Icon size={16} className={active ? 'text-current' : 'text-slate-400'} />
            </div>
            <span className="text-sm font-semibold">{label}</span>
        </div>
    )
    if (href) return <Link to={href} className="no-underline">{content}</Link>
    return <button onClick={onClick}>{content}</button>
}

function RightSidebar({ onStatusFilter, currentStatus, viewMode, onViewModeChange, canCreate }: { onStatusFilter: (s: string) => void; currentStatus: string; viewMode?: 'list' | 'grid'; onViewModeChange?: (mode: 'list' | 'grid') => void; canCreate?: boolean }) {
    return (
        <div className="p-4 space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-100/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</h3>
                </div>
                <div className="p-3 space-y-2">
                    {canCreate && (
                        <button onClick={() => window.dispatchEvent(new CustomEvent('open-tender-create'))} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-amber-200">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                                <Plus size={14} className="text-white" />
                            </div>
                            <span className="text-sm font-semibold">Create Tender</span>
                        </button>
                    )}
                    <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-emerald-200">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                            <Award size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold">View Awards</span>
                    </button>
                    <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-50 to-violet-100/50 text-violet-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-violet-200">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm">
                            <TrendingUp size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold">Analytics</span>
                    </button>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-100/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">View Mode</h3>
                </div>
                <div className="p-3">
                    <div className="flex gap-2">
                        <button onClick={() => onViewModeChange?.('list')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${viewMode === 'list' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20' : 'text-slate-500 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'}`}>
                            <List size={14} /> List
                        </button>
                        <button onClick={() => onViewModeChange?.('grid')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${viewMode === 'grid' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20' : 'text-slate-500 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'}`}>
                            <Grid3X3 size={14} /> Grid
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="p-3 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-b border-slate-100/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter by Status</h3>
                </div>
                <div className="p-3 space-y-1.5">
                    {statusOptions.map((s) => {
                        const isActive = currentStatus === s.value
                        return (
                            <button 
                                key={s.value} 
                                onClick={() => onStatusFilter(s.value)} 
                                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}
                            >
                                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${isActive ? 'bg-amber-500 shadow-sm shadow-amber-500/50 scale-110' : 'bg-slate-300'}`} />
                                {s.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="p-3 bg-gradient-to-r from-violet-500/5 to-purple-500/5 border-b border-slate-100/50">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                            <Lightbulb size={12} className="text-white" />
                        </div>
                        <span className="text-xs font-bold text-slate-600">Tender Tips</span>
                    </div>
                </div>
                <div className="p-3">
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Ensure clear specifications and evaluation criteria before publishing.
                    </p>
                </div>
            </div>
        </div>
    )
}

function TenderCard({ tender }: { tender: Tender }) {
    return (
        <Link 
            to={'/tenders/' + tender.id} 
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 no-underline flex flex-col gap-4 border border-slate-100/50 hover:border-amber-300/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                        <Gavel size={18} className="text-amber-500" />
                    </div>
                    <div>
                        <span className="text-amber-600 text-sm font-bold">{tender.tender_no}</span>
                        <p className="text-xs text-slate-400">{(tender as any).bids_count || 0} bids</p>
                    </div>
                </div>
                <Badge 
                    variant={
                        tender.status === 'awarded' ? 'success' : 
                        tender.status === 'evaluating' ? 'warning' : 
                        tender.status === 'closed' ? 'neutral' : 
                        'default'
                    }
                    dot
                >
                    {tender.status}
                </Badge>
            </div>
            <h3 className="text-base font-bold text-slate-700 group-hover:text-amber-600 transition-colors">{tender.title}</h3>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-500">{tender.closing_date ? new Date(tender.closing_date).toLocaleDateString() : '-'}</span>
                </div>
                <span className="text-lg font-extrabold text-slate-700">${tender.estimated_value?.toLocaleString() || '0'}</span>
            </div>
        </Link>
    )
}

export default function TendersPage() {
    const user = useAuthStore((s) => s.user)
    const role = user?.role || 'indentor'
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
    const [currentPage, setCurrentPage] = useState(1)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ 
        title: '', description: '', closing_date: '', estimated_value: '', specifications: '' 
    })
    const queryClient = useQueryClient()
    const itemsPerPage = 9

    const canCreate = ['procurement_officer', 'cnp_hod', 'oic'].includes(role)

    useEffect(() => {
        const handleOpenCreate = () => setShowModal(true)
        window.addEventListener('open-tender-create', handleOpenCreate)
        return () => window.removeEventListener('open-tender-create', handleOpenCreate)
    }, [])

    const { data: tendersResponse, isLoading } = useQuery({ 
        queryKey: ['tenders'], 
        queryFn: () => api.tenders.list({ page: 1, page_size: 100 }) 
    })
    
    const createMut = useMutation({ 
        mutationFn: (data: Partial<Tender>) => api.tenders.create(data), 
        onSuccess: () => { 
            setShowModal(false); 
            setFormData({ title: '', description: '', closing_date: '', estimated_value: '', specifications: '' })
            queryClient.invalidateQueries({ queryKey: ['tenders'] })
        } 
    })

    const tenders = tendersResponse?.data || []

    const filtered = tenders.filter((t: any) => {
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter
        const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase()) || t.tender_no?.toLowerCase().includes(search.toLowerCase())
        return matchesStatus && matchesSearch
    }) || []

    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedTenders = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    const totalValue = filtered.reduce((sum: number, t: any) => sum + (t.estimated_value || 0), 0)

    const stats = useMemo(() => [
        { label: 'Total Tenders', value: filtered.length, icon: Gavel, color: 'from-amber-500 to-orange-500' },
        { label: 'Active Bidding', value: filtered.filter((t: any) => t.status === 'bidding').length, icon: TrendingUp, color: 'from-emerald-500 to-emerald-600' },
        { label: 'Total Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: 'from-violet-500 to-violet-600' },
    ], [filtered, totalValue])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createMut.mutate({ ...formData, estimated_value: parseFloat(formData.estimated_value) || 0 })
    }

    return (
        <PageLayout
            rightSidebar={
                <RightSidebar 
                    onStatusFilter={(s) => { setStatusFilter(s); setCurrentPage(1) }} 
                    currentStatus={statusFilter}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    canCreate={canCreate}
                />
            }
        >
            <div className="max-w-7xl mx-auto space-y-6">
                <WelcomeHeader />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.map((stat) => (
                        <div 
                            key={stat.label} 
                            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-100/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                        >
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

                <FadeIn delay={0.1}>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-100/50 rounded-xl focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all">
                        <Search size={20} className="text-slate-400 shrink-0" />
                        <Input
                            type="text"
                            placeholder="Search tenders..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
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
                            onClick={() => { setViewMode('list'); setCurrentPage(1) }} 
                            className={cn('p-2.5 rounded-lg transition-all', viewMode === 'list' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'hover:bg-slate-100 text-slate-400')}
                        >
                            <List size={18} />
                        </button>
                        <button 
                            onClick={() => { setViewMode('grid'); setCurrentPage(1) }} 
                            className={cn('p-2.5 rounded-lg transition-all', viewMode === 'grid' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'hover:bg-slate-100 text-slate-400')}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                {isLoading ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                            {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
                        </div>
                    ) : (
                        <TableSkeleton rows={5} />
                    )
                ) : viewMode === 'list' ? (
                    <Card className="overflow-hidden border border-slate-100/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/10">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Tender No</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Title</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-28">Issue Date</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-28">Close Date</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-28">Status</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider w-28">Value</th>
                                        <th className="px-5 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-20">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTenders.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-16 text-center">
                                                <EmptyState icon={<Gavel size={48} className="text-slate-300" />} title="No tenders found" />
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTenders.map((t: any) => (
                                            <motion.tr 
                                                key={t.id} 
                                                className="border-b border-slate-50 hover:bg-amber-50/30 transition-colors group"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <td className="px-5 py-3 align-middle">
                                                    <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg">{t.tender_no}</span>
                                                </td>
                                                <td className="px-5 py-3 align-middle">
                                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-amber-600 transition-colors">{t.title}</p>
                                                </td>
                                                <td className="px-5 py-3 align-middle text-sm text-slate-500">{t.issue_date ? new Date(t.issue_date).toLocaleDateString() : '-'}</td>
                                                <td className="px-5 py-3 align-middle text-sm text-slate-500">{t.closing_date ? new Date(t.closing_date).toLocaleDateString() : '-'}</td>
                                                <td className="px-5 py-3 align-middle">
                                                    <Badge 
                                                        variant={
                                                            t.status === 'awarded' ? 'success' : 
                                                            t.status === 'evaluating' ? 'warning' : 
                                                            t.status === 'closed' ? 'neutral' : 
                                                            'default'
                                                        }
                                                        className="font-medium"
                                                        dot
                                                    >
                                                        {t.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3 align-middle text-right text-sm font-bold text-slate-700">${t.estimated_value?.toLocaleString() || '0'}</td>
                                                <td className="px-5 py-3 align-middle text-center">
                                                    <Link 
                                                        to={'/tenders/' + t.id} 
                                                        className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 inline-flex items-center justify-center text-amber-500 transition-all hover:scale-110"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
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
                        {paginatedTenders.length === 0 ? (
                            <Card className="p-16 text-center col-span-full bg-white/80 backdrop-blur-sm">
                                <EmptyState icon={<Gavel size={48} className="text-slate-300" />} title="No tenders found" />
                            </Card>
                        ) : (
                            paginatedTenders.map((t: any) => <TenderCard key={t.id} tender={t} />)
                        )}
                    </div>
                )}

                {totalPages > 1 && (
                    <FadeIn delay={0.3}>
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
                    </FadeIn>
                )}
                </FadeIn>

                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Tender" size="lg">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <FormField label="Title *">
                            <Input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="Enter tender title" />
                        </FormField>
                        <FormField label="Description">
                            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Describe the tender" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Closing Date *">
                                <Input type="date" value={formData.closing_date} onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })} required />
                            </FormField>
                            <FormField label="Estimated Value ($)">
                                <Input type="number" value={formData.estimated_value} onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })} placeholder="0.00" />
                            </FormField>
                        </div>
                        <FormField label="Specifications">
                            <Textarea value={formData.specifications} onChange={(e) => setFormData({ ...formData, specifications: e.target.value })} rows={4} placeholder="Technical specifications" />
                        </FormField>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={createMut.isPending} variant="primary" loading={createMut.isPending} className="bg-gradient-to-r from-amber-500 to-orange-500">
                                {createMut.isPending ? 'Creating...' : 'Create Tender'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageLayout>
    )
}