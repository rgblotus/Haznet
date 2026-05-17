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
import { Plus, Package, Clock, CheckCircle, Truck, FileText, DollarSign, Eye, LayoutGrid, List, Search, X, ArrowRight, Zap, FileCheck, ClipboardList, Download, RefreshCw, Grid3X3, Filter } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const statusBadgeColors: Record<string, string> = {
    draft: 'neutral',
    issued: 'default',
    partial: 'warning',
    completed: 'success',
    cancelled: 'danger',
}

function RightSidebar({ onStatusFilter, currentStatus, viewMode, onViewModeChange }: { onStatusFilter: (s: string) => void; currentStatus: string; viewMode?: 'list' | 'grid'; onViewModeChange?: (mode: 'list' | 'grid') => void }) {
    const statuses = [
        { value: 'all', label: 'All', icon: Package },
        ...['draft', 'issued', 'partial', 'completed', 'cancelled'].map(s => ({ 
            value: s, 
            label: s.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), 
            icon: Package 
        })),
    ]

    const colorMap: Record<string, string> = {
        all: 'neutral',
        draft: 'neutral',
        issued: 'primary',
        partial: 'warning',
        completed: 'success',
        cancelled: 'danger',
    }

    const bgColors: Record<string, string> = {
        neutral: '',
        primary: 'bg-indigo-50 border-indigo-200 text-indigo-600',
        warning: 'bg-amber-50 border-amber-200 text-amber-600',
        success: 'bg-emerald-50 border-emerald-200 text-emerald-600',
        danger: 'bg-red-50 border-red-200 text-red-600',
    }

    return (
        <div className="p-4 space-y-3">
            <div className="p-4 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 rounded-xl border border-slate-200/60">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Actions</h3>
                <div className="space-y-1.5">
                    <Link to="/orders/new" className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-200 border border-transparent no-underline">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                            <Plus size={14} className="text-rose-500" />
                        </div>
                        <span className="text-sm font-medium">Create Order</span>
                    </Link>
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

            {viewMode !== undefined && (
                <div className="p-4 bg-white rounded-xl border border-slate-100/60 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">View Mode</h3>
                    <div className="flex gap-2">
                        <button onClick={() => onViewModeChange?.('list')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'list' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                            <List size={14} /> List
                        </button>
                        <button onClick={() => onViewModeChange?.('grid')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'grid' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                            <Grid3X3 size={14} /> Grid
                        </button>
                    </div>
                </div>
            )}

            <div className="p-4 bg-white rounded-xl border border-slate-100/60 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Filter by Status</h3>
                <div className="space-y-1">
                    {statuses.map((s) => {
                        const Icon = s.icon
                        const isActive = currentStatus === s.value
                        return (
                            <button 
                                key={s.value} 
                                onClick={() => onStatusFilter(s.value)} 
                                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left text-sm font-medium transition-all duration-200 ${isActive ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
                            >
                                <Icon size={14} className={isActive ? 'text-rose-500' : 'text-slate-400'} />
                                {s.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center">
                        <FileCheck size={12} className="text-slate-500" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">Order Workflow</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Orders are created from approved requisitions or tender awards.</p>
            </div>
        </div>
    )
}

function OrderCard({ order }: { order: any }) {
    return (
        <Link 
            to={'/orders/' + order.id} 
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 flex flex-col gap-4 border border-slate-100/50 hover:border-rose-300/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 no-underline group"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                        <Package size={18} className="text-rose-500" />
                    </div>
                    <div>
                        <span className="text-rose-600 text-sm font-bold">{order.order_no}</span>
                        <p className="text-xs text-slate-400">{order.vendor?.name || 'No vendor'}</p>
                    </div>
                </div>
                <Badge variant={statusBadgeColors[order.status] || 'neutral'} dot>{order.status}</Badge>
            </div>
            <h3 className="text-base font-bold text-slate-700 group-hover:text-rose-600 transition-colors line-clamp-2">{order.title}</h3>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100/50">
                <div className="flex items-center gap-2">
                    <Truck size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-500">{order.quantity || 0} items</span>
                </div>
                <span className="text-lg font-extrabold text-slate-700">${order.total_amount?.toLocaleString() || '0'}</span>
            </div>
        </Link>
    )
}

export default function OrdersPage() {
    const user = useAuthStore((s) => s.user)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
    const [currentPage, setCurrentPage] = useState(1)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ title: '', vendor_id: '', delivery_date: '', notes: '' })
    const queryClient = useQueryClient()
    const itemsPerPage = 12

    const { data: ordersResponse, isLoading } = useQuery({
        queryKey: ['orders', statusFilter, currentPage, search],
        queryFn: () => api.orders.list({ 
            page: currentPage, 
            page_size: itemsPerPage, 
            status: statusFilter !== 'all' ? statusFilter : undefined, 
            search: search || undefined 
        }),
    })
    const { data: vendorsResponse } = useQuery({ queryKey: ['vendors-list'], queryFn: () => api.vendors.list({ page_size: 100 }).then(r => r.data) })
    
    const createMut = useMutation({ 
        mutationFn: (data: any) => api.orders.create(data), 
        onSuccess: () => { 
            setShowModal(false); 
            setFormData({ title: '', vendor_id: '', delivery_date: '', notes: '' })
            queryClient.invalidateQueries({ queryKey: ['orders'] })
        } 
    })

    const orders = ordersResponse?.data || []
    const meta = ordersResponse?.meta
    const totalCount = meta?.total || 0

    const filteredOrders = orders.filter((o: any) => {
        const matchesSearch = o.title?.toLowerCase().includes(search.toLowerCase()) || o.order_no?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter
        return matchesSearch && matchesStatus
    }) || []

    const pendingCount = filteredOrders.filter((o: any) => o.status === 'draft').length || 0
    const inTransitCount = filteredOrders.filter((o: any) => o.status === 'issued').length || 0
    const completedCount = filteredOrders.filter((o: any) => o.status === 'completed').length || 0
    const totalValue = filteredOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createMut.mutate(formData)
    }

    return (
        <PageLayout
            title="Purchase Orders"
            rightSidebar={
                <RightSidebar 
                    onStatusFilter={(s) => { setStatusFilter(s); setCurrentPage(1) }} 
                    currentStatus={statusFilter}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
            }
            actions={
                <Button variant="primary" onClick={() => setShowModal(true)} className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-500/25 btn-shine">
                    <Plus size={18} /> Create Order
                </Button>
            }
        >
            <div className="max-w-7xl mx-auto space-y-6">
                <WelcomeHeader />

                <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Orders', value: filteredOrders.length || 0, icon: Package, color: 'from-rose-500 to-rose-600' },
                        { label: 'Pending', value: pendingCount, icon: Clock, color: 'from-amber-500 to-amber-600' },
                        { label: 'In Transit', value: inTransitCount, icon: Truck, color: 'from-violet-500 to-violet-600' },
                        { label: 'Total Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
                    ].map((stat, i) => (
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

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-100/50 rounded-xl focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10 transition-all">
                        <Search size={20} className="text-slate-400 shrink-0" />
                        <Input 
                            type="text" 
                            placeholder="Search orders..." 
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
                            className={cn('p-2.5 rounded-lg transition-all', viewMode === 'list' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-400')}
                        >
                            <List size={18} />
                        </button>
                        <button 
                            onClick={() => { setViewMode('grid'); setCurrentPage(1) }} 
                            className={cn('p-2.5 rounded-lg transition-all', viewMode === 'grid' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-400')}
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
                ) : viewMode === 'list' ? (
                    <Card className="overflow-hidden border border-slate-100/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/10">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-28">Order No</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Title</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-28">Vendor</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-20">Qty</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Status</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Total</th>
                                        <th className="px-5 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-20">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-16 text-center">
                                                <EmptyState icon={<Package size={48} className="text-slate-300" />} title="No orders found" />
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedOrders.map((o: any) => (
                                            <motion.tr 
                                                key={o.id} 
                                                className="border-b border-slate-50 hover:bg-rose-50/30 transition-colors group"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <td className="px-5 py-3 align-middle">
                                                    <span className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold rounded-lg">{o.order_no}</span>
                                                </td>
                                                <td className="px-5 py-3 align-middle">
                                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-rose-600 transition-colors max-w-xs truncate">{o.title}</p>
                                                </td>
                                                <td className="px-5 py-3 align-middle text-sm text-slate-500">{o.vendor?.name || '-'}</td>
                                                <td className="px-5 py-3 align-middle text-sm text-slate-500">{o.quantity || '-'}</td>
                                                <td className="px-5 py-3 align-middle">
                                                    <Badge variant={statusBadgeColors[o.status] || 'neutral'} className="font-medium" dot>{o.status}</Badge>
                                                </td>
                                                <td className="px-5 py-3 align-middle text-right text-sm font-bold text-slate-700">${o.total_amount?.toLocaleString() || '0'}</td>
                                                <td className="px-5 py-3 align-middle text-center">
                                                    <Link 
                                                        to={'/orders/' + o.id} 
                                                        className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-50 to-rose-100/50 hover:from-rose-100 hover:to-rose-100 inline-flex items-center justify-center text-rose-500 transition-all hover:scale-110"
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
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                        {paginatedOrders.length === 0 ? (
                            <Card className="p-16 text-center col-span-full bg-white/80 backdrop-blur-sm">
                                <EmptyState icon={<Package size={48} className="text-slate-300" />} title="No orders found" />
                            </Card>
                        ) : (
                            paginatedOrders.map((o: any) => <OrderCard key={o.id} order={o} />)
                        )}
                    </div>
                )}

                {totalPages > 1 && (
                    <FadeIn delay={0.3}>
                    <div className="flex items-center justify-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="rounded-xl">
                            <ArrowRight size={16} className="rotate-180" />
                        </Button>
                        <div className="px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-xl text-sm font-semibold text-slate-500 border border-slate-100/50">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="rounded-xl">
                            <ArrowRight size={16} />
                        </Button>
                    </div>
                    </FadeIn>
                )}
                </FadeIn>

                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Order" size="lg">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <FormField label="Order Title *" required>
                            <Input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="Enter order title" />
                        </FormField>
                        <FormField label="Vendor *" required>
                            <Select value={formData.vendor_id} onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })} required>
                                <option value="">Select vendor</option>
                                {(vendorsResponse as any)?.data?.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </Select>
                        </FormField>
                        <FormField label="Expected Delivery Date">
                            <Input type="date" value={formData.delivery_date} onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })} />
                        </FormField>
                        <FormField label="Notes">
                            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} placeholder="Additional notes" />
                        </FormField>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={createMut.isPending} variant="primary" loading={createMut.isPending} className="bg-gradient-to-r from-rose-500 to-rose-600">
                                {createMut.isPending ? 'Creating...' : 'Create Order'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageLayout>
    )
}