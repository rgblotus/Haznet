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
    Grid3X3, Table2, Zap, ClipboardList, Shield, Check
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
        <div className="p-4 space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-100/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</h3>
                </div>
                <div className="p-3 space-y-2">
                    {onCreate && (
                        <button onClick={onCreate} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-indigo-200">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
                                <Plus size={14} className="text-white" />
                            </div>
                            <span className="text-sm font-semibold">Create Requisition</span>
                        </button>
                    )}
                    <Link to="/requisitions" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-50 to-cyan-100/50 text-cyan-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-cyan-200 no-underline">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                            <FileText size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold">View All</span>
                    </Link>
                    <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-amber-200">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
                            <Download size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold">Export Report</span>
                    </button>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-100/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">View Mode</h3>
                </div>
                <div className="p-3">
                    <div className="flex gap-2">
                        <button onClick={() => onViewModeChange?.('table')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${viewMode === 'table' ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'}`}>
                            <Table2 size={14} /> Table
                        </button>
                        <button onClick={() => onViewModeChange?.('grid')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${viewMode === 'grid' ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'}`}>
                            <Grid3X3 size={14} /> Grid
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="p-3 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 border-b border-slate-100/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter by Status</h3>
                </div>
                <div className="p-3 space-y-1.5">
                    {statusOptions.slice(0, 5).map((s) => {
                        const isActive = currentStatus === s.value
                        return (
                            <button 
                                key={s.value} 
                                onClick={() => onStatusFilter(s.value)} 
                                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 border border-indigo-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}
                            >
                                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${isActive ? 'bg-indigo-500 shadow-sm shadow-indigo-500/50 scale-110' : 'bg-slate-300'}`} />
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
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center group-hover:from-indigo-100 group-hover:to-violet-100 transition-colors">
                        <FileText size={18} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                        {req.file_reference && (
                            <span className="text-amber-600 text-sm font-mono font-bold block">{req.file_reference}</span>
                        )}
                        <span className="text-[10px] text-indigo-500 font-medium block">{req.requisition_no}</span>
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
            <h3 className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">{req.title || req.job_description?.slice(0, 50) || '-'}</h3>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100/50 gap-4">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-mono text-slate-400 truncate">{req.sap_requisition_number || req.financial_year || '-'}</span>
                </div>
                <span className="text-base font-extrabold text-slate-700 shrink-0">₹{(req.cost_estimate || req.total_estimate)?.toLocaleString() || '0'}</span>
            </div>
        </Link>
    )
}

export default function RequisitionsPage() {
    const user = useAuthStore((s) => s.user)
    const role = user?.role || 'indentor'
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
    const [page, setPage] = useState(1)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        description: '', category: 'materials', priority: 'Medium', quantity: '1',
        unit_price_estimate: '', total_estimate: '',
        financial_year: 'FY 2025-2026',
        sap_requisition_number: '',
        requisition_create_date: new Date().toISOString().split('T')[0],
        requisition_hod_release_date: '',
        job_description: '',
        cost_estimate: '',
        startup_applicable: false,
        industry: '',
        sector: '',
        contract_period_months: '',
    })
    const queryClient = useQueryClient()
    const pageSize = 12

    const canCreate = ['indentor', 'hod', 'cnp_hod', 'procurement_officer', 'admin', 'oic'].includes(role)

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
            setFormData({ description: '', category: 'materials', priority: 'Medium', quantity: '1', unit_price_estimate: '', total_estimate: '', financial_year: 'FY 2025-2026', sap_requisition_number: '', requisition_create_date: new Date().toISOString().split('T')[0], requisition_hod_release_date: '', job_description: '', cost_estimate: '', startup_applicable: false, industry: '', sector: '', contract_period_months: '' })
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
        if (formData.sap_requisition_number && !/^\d{8}$/.test(formData.sap_requisition_number)) {
            return
        }
        const payload = {
            ...formData,
            title: formData.job_description.slice(0, 50) || `Requisition ${formData.sap_requisition_number}`,
            description: formData.job_description,
            quantity: parseInt(formData.quantity) || 1,
            unit_price_estimate: parseFloat(formData.unit_price_estimate) || undefined,
            total_estimate: parseFloat(formData.total_estimate) || undefined,
            cost_estimate: parseFloat(formData.cost_estimate) || undefined,
            contract_period_months: formData.contract_period_months ? parseInt(formData.contract_period_months) : undefined,
            requisition_create_date: formData.requisition_create_date ? new Date(formData.requisition_create_date).toISOString() : undefined,
            requisition_hod_release_date: formData.requisition_hod_release_date ? new Date(formData.requisition_hod_release_date).toISOString() : undefined,
        }
        createMut.mutate(payload)
    }

    const integrityPact = (parseFloat(formData.cost_estimate) || 0) > 10000000

    const fileReferencePreview = formData.financial_year && formData.sap_requisition_number && /^\d{8}$/.test(formData.sap_requisition_number)
        ? (() => {
            const yearPart = formData.financial_year.replace(/^FY\s*/, '')
            return `GAIL/HZR/CNP/${yearPart}/${formData.sap_requisition_number}/0001`
          })()
        : ''

    const userDepartment = user?.department_name || ''

    return (
        <PageLayout
            rightSidebar={
                <RightSidebar 
                    onStatusFilter={(s) => { setStatusFilter(s); setPage(1); }} 
                    currentStatus={statusFilter}
                    onCreate={canCreate ? () => setShowModal(true) : undefined}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
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
                    </Card>
                ) : viewMode === 'table' ? (
                    <Card className="overflow-hidden border border-slate-100/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/10">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
                                        <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Req No / File Ref</th>
                                        <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Title</th>
                                        <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">FY / SAP</th>
                                        <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                                        <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3.5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cost</th>
                                        <th className="px-4 py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
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
                                            <td className="px-4 py-3.5 align-middle">
                                                <div className="flex flex-col gap-0.5">
                                                    {req.file_reference && (
                                                        <span className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-mono font-bold rounded-lg">{req.file_reference}</span>
                                                    )}
                                                    <span className="text-[10px] text-indigo-500 font-medium">{req.requisition_no}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 align-middle">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-1">{req.title || req.job_description?.slice(0, 40) || '-'}</p>
                                                    <p className="text-xs text-slate-400">{req.category || 'General'}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 align-middle">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[11px] font-semibold text-slate-600">{req.financial_year || '-'}</span>
                                                    <span className="text-[11px] font-mono font-semibold text-slate-500">{req.sap_requisition_number || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 align-middle">
                                                <span className={cn('px-2.5 py-1 rounded-lg text-[11px] font-bold border', priorityColors[req.priority] || priorityColors.Medium)}>
                                                    {req.priority || 'Medium'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 align-middle">
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
                                            <td className="px-4 py-3.5 align-middle text-right">
                                                <span className="text-sm font-bold text-slate-700">₹{(req.cost_estimate || req.total_estimate)?.toLocaleString() || '0'}</span>
                                            </td>
                                            <td className="px-4 py-3.5 align-middle text-center">
                                                <Link
                                                    to={'/requisitions/' + req.id}
                                                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 inline-flex items-center justify-center text-indigo-500 transition-all hover:scale-110"
                                                >
                                                    <Eye size={14} />
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

                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Requisition" size="xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Basic Information Section */}
                        <div className="bg-gradient-to-r from-indigo-500/5 to-violet-500/5 rounded-xl p-4 border border-indigo-100/50">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
                                    <FileText size={14} className="text-white" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Basic Information</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <FormField label="Category">
                                    <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="rounded-lg border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 text-sm">
                                        <option value="materials">Materials</option>
                                        <option value="equipment">Equipment</option>
                                        <option value="services">Services</option>
                                    </Select>
                                </FormField>
                                <FormField label="Priority">
                                    <Select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="rounded-lg border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 text-sm">
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </Select>
                                </FormField>
                                <FormField label="Quantity">
                                    <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} min={1} className="rounded-lg border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 text-sm" />
                                </FormField>
                            </div>
                            <div className="mt-3">
                                <FormField label="Department">
                                    <Input type="text" value={userDepartment} disabled className="bg-slate-50/80 rounded-lg border-slate-200 text-slate-500 text-sm" />
                                </FormField>
                            </div>
                        </div>

                        {/* Reference & Dates Section */}
                        <div className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-xl p-4 border border-amber-100/50">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                                    <Calendar size={14} className="text-white" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Reference & Dates</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label="Financial Year">
                                    <Select value={formData.financial_year} onChange={(e) => setFormData({ ...formData, financial_year: e.target.value })} className="rounded-lg border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-sm">
                                        <option value="FY 2023-2024">FY 2023-2024</option>
                                        <option value="FY 2024-2025">FY 2024-2025</option>
                                        <option value="FY 2025-2026">FY 2025-2026</option>
                                        <option value="FY 2026-2027">FY 2026-2027</option>
                                    </Select>
                                </FormField>
                                <FormField label="SAP Requisition Number">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            value={formData.sap_requisition_number}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 8)
                                                setFormData({ ...formData, sap_requisition_number: val })
                                            }}
                                            placeholder="12345678"
                                            maxLength={8}
                                            className="rounded-lg border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 font-mono tracking-wider text-sm"
                                        />
                                        {formData.sap_requisition_number && (
                                            <div className={cn(
                                                'absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold',
                                                formData.sap_requisition_number.length === 8 ? 'text-emerald-500' : 'text-red-500'
                                            )}>
                                                {formData.sap_requisition_number.length}/8
                                            </div>
                                        )}
                                    </div>
                                    {formData.sap_requisition_number && formData.sap_requisition_number.length !== 8 && (
                                        <p className="text-[10px] text-red-500 mt-0.5">Must be exactly 8 digits</p>
                                    )}
                                </FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <FormField label="Create Date">
                                    <Input
                                        type="date"
                                        value={formData.requisition_create_date}
                                        onChange={(e) => setFormData({ ...formData, requisition_create_date: e.target.value })}
                                        className="rounded-lg border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-sm"
                                    />
                                </FormField>
                                <FormField label="HoD Release Date">
                                    <Input
                                        type="date"
                                        value={formData.requisition_hod_release_date}
                                        onChange={(e) => setFormData({ ...formData, requisition_hod_release_date: e.target.value })}
                                        className="rounded-lg border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-sm"
                                    />
                                </FormField>
                            </div>
                            {fileReferencePreview && (
                                <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-200">
                                    <p className="text-[10px] text-slate-400 font-medium">File Reference</p>
                                    <p className="text-xs font-bold text-slate-700 font-mono truncate">{fileReferencePreview}</p>
                                </div>
                            )}
                        </div>

                        {/* Job Details Section */}
                        <div className="bg-gradient-to-r from-emerald-500/5 to-emerald-100/50 rounded-xl p-4 border border-emerald-100/50">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                                    <ClipboardList size={14} className="text-white" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Job Details</h3>
                            </div>
                            <FormField label="Job Description">
                                <Textarea
                                    value={formData.job_description}
                                    onChange={(e) => setFormData({ ...formData, job_description: e.target.value.slice(0, 300) })}
                                    rows={2}
                                    placeholder="Brief job description"
                                    className="rounded-lg border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 resize-none text-sm"
                                />
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-[10px] text-slate-400">Max 300 chars</p>
                                    <p className={cn('text-[10px] font-bold', formData.job_description.length >= 280 ? 'text-red-500' : 'text-slate-400')}>{formData.job_description.length}/300</p>
                                </div>
                            </FormField>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <FormField label="Cost Estimate">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                                        <Input
                                            type="number"
                                            value={formData.cost_estimate}
                                            onChange={(e) => setFormData({ ...formData, cost_estimate: e.target.value })}
                                            placeholder="0.00"
                                            className="rounded-lg border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 pl-7 text-sm"
                                        />
                                    </div>
                                </FormField>
                                <FormField label="Contract Period (Months)">
                                    <Input
                                        type="number"
                                        value={formData.contract_period_months}
                                        onChange={(e) => setFormData({ ...formData, contract_period_months: e.target.value })}
                                        placeholder="12"
                                        min={1}
                                        className="rounded-lg border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 text-sm"
                                    />
                                </FormField>
                            </div>
                        </div>

                        {/* Startup & Compliance Section */}
                        <div className="bg-gradient-to-r from-violet-500/5 to-purple-500/5 rounded-xl p-4 border border-violet-100/50">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-sm">
                                    <Shield size={14} className="text-white" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Startup & Compliance</h3>
                            </div>
                            <div className={cn(
                                'p-3 rounded-lg border transition-all duration-200 cursor-pointer mb-3',
                                formData.startup_applicable 
                                    ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 shadow-sm' 
                                    : 'bg-white border-slate-200 hover:border-violet-200'
                            )} onClick={() => setFormData({ ...formData, startup_applicable: !formData.startup_applicable, industry: !formData.startup_applicable ? formData.industry : '', sector: !formData.startup_applicable ? formData.sector : '' })}>
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                                        formData.startup_applicable ? 'bg-violet-500 border-violet-500' : 'border-slate-300'
                                    )}>
                                        {formData.startup_applicable && <Check size={10} className="text-white" />}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">Startup Applicable</span>
                                </div>
                            </div>
                            {formData.startup_applicable && (
                                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-gradient-to-r from-violet-50/50 to-purple-50/50 border border-violet-100 mb-3">
                                    <FormField label="Industry" required>
                                        <Input
                                            type="text"
                                            value={formData.industry}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                            placeholder="Enter industry"
                                            className="rounded-lg border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 text-sm"
                                        />
                                    </FormField>
                                    <FormField label="Sector" required>
                                        <Input
                                            type="text"
                                            value={formData.sector}
                                            onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                                            placeholder="Enter sector"
                                            className="rounded-lg border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 text-sm"
                                        />
                                    </FormField>
                                </div>
                            )}
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            'w-7 h-7 rounded-lg flex items-center justify-center',
                                            integrityPact ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-slate-200 to-slate-300'
                                        )}>
                                            <Shield size={14} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-medium">Integrity Pact</p>
                                            <p className={cn('text-xs font-bold', integrityPact ? 'text-amber-600' : 'text-slate-500')}>
                                                {integrityPact ? 'Required (> ₹1 Cr)' : 'Not Required'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        'px-2 py-1 rounded text-[10px] font-bold',
                                        integrityPact ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                    )}>
                                        {integrityPact ? 'YES' : 'NO'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setShowModal(false)} className="rounded-lg px-5 text-sm">Cancel</Button>
                            <Button type="submit" disabled={createMut.isPending || !!(formData.sap_requisition_number && formData.sap_requisition_number.length !== 8)} variant="primary" loading={createMut.isPending} className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/20 rounded-lg px-6 text-sm">
                                {createMut.isPending ? 'Creating...' : 'Create Requisition'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageLayout>
    )
}