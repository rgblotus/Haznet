import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import PageLayout from '@/components/PageLayout'
import { FadeIn } from '@/components/ui/AnimatedList'
import { motion } from 'framer-motion'
import { ArrowLeft, Building2, Mail, Phone, MapPin, Star, Edit, Printer, TrendingUp, Clock, User, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const statusFlow = [
    { key: 'inactive', label: 'Inactive', icon: Building2 },
    { key: 'active', label: 'Active', icon: TrendingUp },
    { key: 'suspended', label: 'Suspended', icon: Clock },
]

export default function VendorDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [vendor, setVendor] = useState<Awaited<ReturnType<typeof api.vendors.get>> | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        api.vendors.get(id)
            .then(setVendor)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    const currentStatusIndex = statusFlow.findIndex(s => s.key === vendor?.status?.toLowerCase())

    if (loading) {
        return <PageLayout title="Vendor Details"><div className="flex items-center justify-center h-[60vh] skeleton text-slate-400">Loading...</div></PageLayout>
    }

    if (!vendor) {
        return (
            <PageLayout title="Vendor Details">
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
                        <Building2 size={40} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 mb-4 font-medium">Vendor not found</p>
                    <Link to="/vendors" className="text-indigo-500 no-underline flex items-center gap-2 hover:text-indigo-600 transition-colors font-medium">
                        <ArrowLeft size={16} /> Back to Vendors
                    </Link>
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout 
            title="Vendor Details"
            actions={
                <div className="flex items-center gap-3">
                    <Link to="/vendors" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
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
                                <div className="flex items-center gap-4">
                                    <motion.div 
                                        className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                    >
                                        <Building2 size={28} className="text-white" />
                                    </motion.div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-800">{vendor.name}</h1>
                                        <p className="text-sm text-slate-400">{vendor.name || 'No name'}</p>
                                    </div>
                                </div>
                                <Badge variant={vendor.status?.toLowerCase() === 'active' ? 'success' : vendor.status?.toLowerCase() === 'suspended' ? 'danger' : 'neutral'} className="font-semibold">
                                    {vendor.status || 'Inactive'}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-4 gap-4 pt-5 border-t border-slate-100/50">
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Package size={14} className="text-emerald-500" />
                                        <p className="text-xs text-slate-400">Category</p>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700">{vendor.category || '-'}</p>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Mail size={14} className="text-indigo-500" />
                                        <p className="text-xs text-slate-400">Email</p>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 truncate">{vendor.email}</p>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Phone size={14} className="text-violet-500" />
                                        <p className="text-xs text-slate-400">Phone</p>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">{vendor.phone || 'N/A'}</p>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Star size={14} className="text-amber-500" />
                                        <p className="text-xs text-slate-400">Rating</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[1,2,3,4,5].map(i => (
                                            <Star 
                                                key={i} 
                                                size={14} 
                                                className={i <= (vendor.rating || 3) ? 'text-amber-500 fill-amber-500' : 'text-slate-200 fill-none'} 
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 mb-6 shadow-lg shadow-slate-200/10">
                            <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Mail size={18} className="text-indigo-500" />
                                Contact Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                                        <Mail size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Email</p>
                                        <p className="text-sm font-medium text-slate-700">{vendor.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                                        <Phone size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Phone</p>
                                        <p className="text-sm font-medium text-slate-700">{vendor.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl col-span-2">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                                        <MapPin size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Address</p>
                                        <p className="text-sm font-medium text-slate-700">{vendor.address || 'No address provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 shadow-lg shadow-slate-200/10">
                            <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Building2 size={18} className="text-emerald-500" />
                                Company Details
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl">
                                    <span className="text-sm text-slate-400">Company Name</span>
                                    <span className="text-sm font-semibold text-slate-700">{vendor.name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl">
                                    <span className="text-sm text-slate-400">Category</span>
                                    <span className="text-sm font-semibold text-slate-700">{vendor.category || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl">
                                    <span className="text-sm text-slate-400">Vendor Status</span>
                                    <Badge variant={vendor.status?.toLowerCase() === 'active' ? 'success' : vendor.status?.toLowerCase() === 'suspended' ? 'danger' : 'neutral'}>
                                        {vendor.status || 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>

                <div className="space-y-4">
                    {/* Quick Actions */}
                    <FadeIn>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-100/50">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</h2>
                            </div>
                            <div className="p-3 space-y-2">
                                <Link to={`/vendors/${id}/edit`} className="no-underline">
                                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-emerald-200">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                                            <Edit size={14} className="text-white" />
                                        </div>
                                        <span className="text-sm font-semibold">Edit Vendor</span>
                                    </div>
                                </Link>
                                <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-50 to-cyan-100/50 text-cyan-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-cyan-200 w-full">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                                        <Mail size={14} className="text-white" />
                                    </div>
                                    <span className="text-sm font-semibold">Contact</span>
                                </button>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Status */}
                    <FadeIn delay={0.1}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                            <div className="p-3 bg-gradient-to-r from-emerald-500/5 to-emerald-100/50 border-b border-slate-100/50">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</h2>
                            </div>
                            <div className="p-3 space-y-1.5">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50">
                                    <span className="text-xs text-slate-400">Status</span>
                                    <span className={cn(
                                        'text-xs font-bold px-2 py-0.5 rounded-md',
                                        vendor.status?.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                        vendor.status?.toLowerCase() === 'suspended' ? 'bg-red-50 text-red-600' :
                                        'bg-slate-100 text-slate-500'
                                    )}>
                                        {vendor.status || 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50">
                                    <span className="text-xs text-slate-400">Category</span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{vendor.category || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Performance */}
                    <FadeIn delay={0.15}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                            <div className="p-3 bg-gradient-to-r from-amber-500/5 to-amber-100/50 border-b border-slate-100/50">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Performance</h2>
                            </div>
                            <div className="p-3 space-y-1.5">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50">
                                    <span className="text-xs text-emerald-600 font-medium">On-time</span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">95%</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50">
                                    <span className="text-xs text-amber-600 font-medium">Rating</span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">{vendor.rating || 4.5}/5</span>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Contact Info */}
                    <FadeIn delay={0.2}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                            <div className="p-3 bg-gradient-to-r from-violet-500/5 to-violet-100/50 border-b border-slate-100/50">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</h2>
                            </div>
                            <div className="p-3 space-y-1.5">
                                {vendor.email && (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50">
                                        <Mail size={12} className="text-slate-400 shrink-0" />
                                        <span className="text-xs text-slate-600 truncate">{vendor.email}</span>
                                    </div>
                                )}
                                {vendor.phone && (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50">
                                        <Phone size={12} className="text-slate-400 shrink-0" />
                                        <span className="text-xs text-slate-600">{vendor.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </PageLayout>
    )
}