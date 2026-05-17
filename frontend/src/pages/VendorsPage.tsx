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
import { Plus, Search, Building2, Star, CheckCircle, Eye, LayoutGrid, List, ChevronLeft, ChevronRight, Mail, Phone, TrendingUp, Clock, X, Users, Download, RefreshCw, Grid3X3, Zap, FileText } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

function VendorCard({ vendor }: { vendor: any }) {
    return (
        <Link 
            to={'/vendors/' + vendor.id} 
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 flex flex-col gap-4 border border-slate-100/50 hover:border-emerald-300/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 no-underline group"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <Building2 size={22} className="text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">{vendor.name}</h3>
                        <p className="text-xs text-slate-400">{vendor.category || 'General'}</p>
                    </div>
                </div>
                <Badge variant={vendor.status === 'Active' ? 'success' : vendor.status === 'Inactive' ? 'danger' : 'neutral'} dot>
                    {vendor.status}
                </Badge>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                        <Star key={i} size={14} className={i <= (vendor.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-slate-200 fill-none'} />
                    ))}
                </div>
                <Badge variant="neutral">{vendor.category || 'General'}</Badge>
            </div>
            {vendor.email && (
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Mail size={12} /> {vendor.email}
                </div>
            )}
        </Link>
    )
}

export default function VendorsPage() {
    const user = useAuthStore((s) => s.user)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
    const [page, setPage] = useState(1)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ 
        name: '', contact_person: '', email: '', phone: '', address: '', category: '' 
    })
    const queryClient = useQueryClient()
    const pageSize = 12

    const { data: vendorsResponse, isLoading } = useQuery({
        queryKey: ['vendors', statusFilter, page, search],
        queryFn: () => api.vendors.list({ 
            page, page_size: pageSize, 
            status: statusFilter !== 'all' ? statusFilter : undefined, 
            search: search || undefined 
        }),
    })

    const createMut = useMutation({
        mutationFn: (data: any) => api.vendors.create(data),
        onSuccess: () => {
            setShowModal(false)
            setFormData({ name: '', contact_person: '', email: '', phone: '', address: '', category: '' })
            queryClient.invalidateQueries({ queryKey: ['vendors'] })
        },
    })

    const vendors = vendorsResponse?.data || []
    const meta = vendorsResponse?.meta
    const totalPages = meta?.total_pages || 1
    const totalCount = meta?.total || 0
    const activeCount = vendors.filter((v: any) => v.status === 'Active').length


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createMut.mutate(formData)
    }

    return (
        <PageLayout
            rightSidebar={
                <div className="p-4 space-y-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                        <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-100/50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</h3>
                        </div>
                        <div className="p-3 space-y-2">
                            <button onClick={() => setShowModal(true)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-emerald-200">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                                    <Plus size={14} className="text-white" />
                                </div>
                                <span className="text-sm font-semibold">Add Vendor</span>
                            </button>
                            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-50 to-violet-100/50 text-violet-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-violet-200">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm">
                                    <Star size={14} className="text-white" />
                                </div>
                                <span className="text-sm font-semibold">Top Rated</span>
                            </button>
                            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-amber-200">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
                                    <FileText size={14} className="text-white" />
                                </div>
                                <span className="text-sm font-semibold">Performance Report</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                        <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-100/50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">View Mode</h3>
                        </div>
                        <div className="p-3">
                            <div className="flex gap-2">
                                <button onClick={() => setViewMode('list')} className={cn('flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200', viewMode === 'list' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-50 border border-slate-200 hover:border-slate-300')}>
                                    <List size={14} /> List
                                </button>
                                <button onClick={() => setViewMode('grid')} className={cn('flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200', viewMode === 'grid' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-50 border border-slate-200 hover:border-slate-300')}>
                                    <Grid3X3 size={14} /> Grid
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                        <div className="p-3 bg-gradient-to-r from-emerald-500/5 to-emerald-100/50 border-b border-slate-100/50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor Stats</h3>
                        </div>
                        <div className="p-3">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl text-center border border-emerald-100/50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                                    <p className="text-lg font-bold text-emerald-600">{activeCount}</p>
                                    <p className="text-xs text-emerald-500 font-medium">Active</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl text-center border border-slate-100/50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                                    <p className="text-lg font-bold text-slate-400">{totalCount - activeCount}</p>
                                    <p className="text-xs text-slate-400 font-medium">Inactive</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl text-center border border-amber-100/50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                                    <p className="text-lg font-bold text-amber-600">{totalCount}</p>
                                    <p className="text-xs text-amber-500 font-medium">Total</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                        <div className="p-3 bg-gradient-to-r from-violet-500/5 to-purple-500/5 border-b border-slate-100/50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categories</h3>
                        </div>
                        <div className="p-3 space-y-2">
                            {['IT Equipment', 'Office Supplies', 'Raw Materials', 'Services'].map((cat) => (
                                <div key={cat} className="flex items-center justify-between p-2.5 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-100/50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                                    <span className="text-sm font-medium text-slate-600">{cat}</span>
                                    <span className="text-xs font-bold text-slate-500 px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-sm">{Math.floor(Math.random() * 10) + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                        <div className="p-3 bg-gradient-to-r from-cyan-500/5 to-cyan-100/50 border-b border-slate-100/50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Activity</h3>
                        </div>
                        <div className="p-3 space-y-2">
                            <div className="p-2.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-100/50">
                                <p className="text-sm font-medium text-slate-600">New vendor added</p>
                                <p className="text-xs text-slate-400 mt-0.5">Tech Solutions Inc - 2 hours ago</p>
                            </div>
                            <div className="p-2.5 bg-gradient-to-r from-violet-50 to-violet-100/50 rounded-xl border border-violet-100/50">
                                <p className="text-sm font-medium text-slate-600">Vendor approved</p>
                                <p className="text-xs text-slate-400 mt-0.5">Global Supplies Ltd - 1 day ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="max-w-7xl mx-auto space-y-6">
                <WelcomeHeader />

                <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-100/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                                <Building2 size={22} className="text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-slate-700">{totalCount || 0}</p>
                                <p className="text-sm text-slate-500">Total Vendors</p>
                            </div>
                        </div>
                    </div>
                    <div 
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-100/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <CheckCircle size={22} className="text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-slate-700">{activeCount}</p>
                                <p className="text-sm text-slate-500">Active Vendors</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-100/50 rounded-xl focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                        <Search size={20} className="text-slate-400 shrink-0" />
                        <Input 
                            type="text" 
                            placeholder="Search vendors..." 
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
                            onClick={() => setViewMode('list')} 
                            className={cn('p-2.5 rounded-lg transition-all', viewMode === 'list' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-400')}
                        >
                            <List size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')} 
                            className={cn('p-2.5 rounded-lg transition-all', viewMode === 'grid' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-400')}
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
                ) : vendors.length === 0 ? (
                    <Card className="p-16 text-center bg-white/80 backdrop-blur-sm border border-slate-100/50">
                        <EmptyState 
                            icon={<Building2 size={48} className="text-slate-300" />} 
                            title="No vendors found"
                        />
                        <div className="mt-4">
                            <Button variant="primary" onClick={() => setShowModal(true)} className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                                <Plus size={18} /> Add Vendor
                            </Button>
                        </div>
                    </Card>
                ) : viewMode === 'list' ? (
                    <Card className="overflow-hidden border border-slate-100/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/10">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-28">Rating</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Status</th>
                                        <th className="px-5 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-20">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vendors.map((v: any) => (
                                        <motion.tr 
                                            key={v.id} 
                                            className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors group"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <td className="px-5 py-3 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center">
                                                        <Building2 size={18} className="text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">{v.name}</p>
                                                        <p className="text-xs text-slate-400">{v.category || 'General'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <p className="text-sm font-semibold text-slate-700">{v.contact_person || '-'}</p>
                                                <p className="text-xs text-slate-400">{v.email}</p>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <div className="flex items-center gap-1">
                                                    {[1,2,3,4,5].map(i => (
                                                        <Star key={i} size={14} className={i <= (v.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-slate-200 fill-none'} />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <Badge variant={v.status === 'Active' ? 'success' : v.status === 'Inactive' ? 'danger' : 'neutral'} className="font-medium" dot>
                                                    {v.status}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-center">
                                                <Link 
                                                    to={'/vendors/' + v.id} 
                                                    className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-100 inline-flex items-center justify-center text-emerald-600 transition-all hover:scale-110"
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
                        {vendors.map((v: any) => <VendorCard key={v.id} vendor={v} />)}
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

                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Vendor" size="lg">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <FormField label="Vendor Name *" required>
                            <Input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Enter vendor name" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Contact Person">
                                <Input type="text" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} placeholder="Contact name" />
                            </FormField>
                            <FormField label="Phone">
                                <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" />
                            </FormField>
                        </div>
                        <FormField label="Email *" required>
                            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="vendor@example.com" />
                        </FormField>
                        <FormField label="Category">
                            <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                <option value="">Select category</option>
                                <option value="Raw Materials">Raw Materials</option>
                                <option value="Electrical Equipment">Electrical Equipment</option>
                                <option value="Construction">Construction</option>
                                <option value="Heavy Machinery">Heavy Machinery</option>
                                <option value="Safety Equipment">Safety Equipment</option>
                                <option value="IT Equipment">IT Equipment</option>
                            </Select>
                        </FormField>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={createMut.isPending} variant="primary" loading={createMut.isPending} className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                                {createMut.isPending ? 'Adding...' : 'Add Vendor'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageLayout>
    )
}