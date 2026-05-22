import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import PageLayout from '@/components/PageLayout'
import { FadeIn } from '@/components/ui/AnimatedList'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Send, Printer, Truck, Calendar, DollarSign, User, ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const statusFlow = [
    { key: 'draft', label: 'Draft', icon: Package, color: '#6b7280' },
    { key: 'issued', label: 'Issued', icon: Send, color: '#3b82f6' },
    { key: 'partial', label: 'Partial Delivery', icon: Clock, color: '#f59e0b' },
    { key: 'completed', label: 'Completed', icon: CheckCircle, color: '#10b981' },
    { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: '#ef4444' },
]

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { data: order, isLoading } = useQuery({
        queryKey: ['order', id],
        queryFn: () => api.orders.get(id!),
        enabled: !!id,
    })

    const currentStatusIndex = statusFlow.findIndex(s => s.key === order?.status)

    if (isLoading) {
        return <PageLayout title="Order Details"><div className="flex items-center justify-center h-[60vh] skeleton text-slate-400">Loading...</div></PageLayout>
    }

    if (!order) {
        return (
            <PageLayout title="Order Details">
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
                        <Package size={40} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 mb-4 font-medium">Order not found</p>
                    <Link to="/orders" className="text-indigo-500 no-underline flex items-center gap-2 hover:text-indigo-600 transition-colors font-medium">
                        <ArrowLeft size={16} /> Back to Orders
                    </Link>
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout 
            title={`Order ${order.order_no}`}
            actions={
                <div className="flex items-center gap-3">
                    <Link to="/orders" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
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
                                        <span className="px-3 py-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold rounded-lg">{order.order_no}</span>
                                    </motion.div>
                                    <h1 className="text-2xl font-bold text-slate-800">{order.title}</h1>
                                </div>
                                <Badge 
                                    variant={
                                        statusFlow[currentStatusIndex]?.key === 'completed' ? 'success' : 
                                        statusFlow[currentStatusIndex]?.key === 'cancelled' ? 'danger' : 
                                        statusFlow[currentStatusIndex]?.key === 'partial' ? 'warning' : 
                                        'default'
                                    } 
                                    className="font-semibold"
                                >
                                    {order.status}
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
                                        <Truck size={14} className="text-emerald-500" />
                                        <p className="text-xs text-slate-400">Vendor</p>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700">{order.vendor?.name || '-'}</p>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Package size={14} className="text-indigo-500" />
                                        <p className="text-xs text-slate-400">Quantity</p>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700">{order.quantity}</p>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <DollarSign size={14} className="text-amber-500" />
                                        <p className="text-xs text-slate-400">Total Amount</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">${order.total_amount?.toLocaleString() || '0'}</p>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar size={14} className="text-violet-500" />
                                        <p className="text-xs text-slate-400">Order Date</p>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</p>
                                </motion.div>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 shadow-lg shadow-slate-200/10">
                            <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <ClipboardList size={18} className="text-rose-500" />
                                Delivery Items
                            </h2>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
                                        <th className="p-3 text-left text-xs font-bold text-slate-400 uppercase">Item</th>
                                        <th className="p-3 text-left text-xs font-bold text-slate-400 uppercase">Ordered</th>
                                        <th className="p-3 text-left text-xs font-bold text-slate-400 uppercase">Delivered</th>
                                        <th className="p-3 text-right text-xs font-bold text-slate-400 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <motion.tr 
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 }}
                                    >
                                        <td className="p-3 text-sm text-slate-700 font-medium">{order.title}</td>
                                        <td className="p-3 text-sm text-slate-500">{order.quantity}</td>
                                        <td className="p-3 text-sm text-slate-500">{order.received_quantity || 0}</td>
                                        <td className="p-3 text-right">
                                            <Badge variant={(order.received_quantity ?? 0) >= order.quantity ? 'success' : 'warning'}>
                                                {(order.received_quantity ?? 0) >= order.quantity ? 'Complete' : 'Partial'}
                                            </Badge>
                                        </td>
                                    </motion.tr>
                                </tbody>
                            </table>
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
                                <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-50 to-rose-100/50 text-rose-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-rose-200 w-full">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-sm">
                                        <Truck size={14} className="text-white" />
                                    </div>
                                    <span className="text-sm font-semibold">Mark Shipped</span>
                                </button>
                                <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-50 to-cyan-100/50 text-cyan-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-cyan-200 w-full">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                                        <ClipboardList size={14} className="text-white" />
                                    </div>
                                    <span className="text-sm font-semibold">View Delivery</span>
                                </button>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Progress */}
                    <FadeIn delay={0.1}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                            <div className="p-3 bg-gradient-to-r from-rose-500/5 to-rose-100/50 border-b border-slate-100/50">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</h2>
                            </div>
                            <div className="p-3">
                                <div className="flex flex-col gap-0">
                                    {statusFlow.map((status, i) => {
                                        const isCompleted = i <= currentStatusIndex
                                        const isCurrent = i === currentStatusIndex
                                        const Icon = status.icon
                                        return (
                                            <div key={status.key} className="flex items-start gap-3 relative">
                                                {i < statusFlow.length - 1 && (
                                                    <div className={`absolute left-4 top-8 -bottom-3 w-0.5 ${isCompleted ? 'bg-rose-500' : 'bg-slate-200'}`} />
                                                )}
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${isCurrent ? 'ring-2 ring-rose-400' : ''} ${isCompleted ? 'bg-rose-500' : 'bg-slate-100'}`}>
                                                    <Icon size={14} className={isCompleted ? 'text-white' : 'text-slate-400'} />
                                                </div>
                                                <div className="flex-1 pb-5">
                                                    <p className={`text-sm ${isCompleted ? 'text-slate-700 font-semibold' : 'text-slate-400'} ${isCurrent ? 'font-bold' : ''}`}>{status.label}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Order Quick Stats */}
                    <FadeIn delay={0.15}>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                            <div className="p-3 bg-gradient-to-r from-amber-500/5 to-amber-100/50 border-b border-slate-100/50">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order</h2>
                            </div>
                            <div className="p-3 space-y-1.5">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50">
                                    <span className="text-xs text-slate-400">Quantity</span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{order.quantity}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50">
                                    <span className="text-xs text-slate-400">Amount</span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600">${order.total_amount?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50">
                                    <span className="text-xs text-slate-400">Received</span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">{order.received_quantity || 0}</span>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Vendor */}
                    {order.vendor && (
                        <FadeIn delay={0.2}>
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                                <div className="p-3 bg-gradient-to-r from-emerald-500/5 to-emerald-100/50 border-b border-slate-100/50">
                                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</h2>
                                </div>
                                <div className="p-3">
                                    <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/50">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                            <Truck size={14} className="text-emerald-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate">{order.vendor.name}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{order.vendor.email || 'No email'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    )}
                </div>
            </div>
        </PageLayout>
    )
}