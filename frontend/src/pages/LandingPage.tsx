import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import {
    ArrowRight,
    FileText,
    ClipboardList,
    Package,
    Truck,
    LayoutDashboard,
    PieChart,
    Hexagon,
    CheckCircle,
    TrendingUp,
} from 'lucide-react'

interface PublicStats {
    total_requisitions: number
    completed_requisitions: number
    active_tenders: number
    total_vendors: number
    active_orders: number
}

interface Feature {
    icon: LucideIcon
    title: string
    desc: string
    color: string
}

const features: Feature[] = [
    {
        icon: FileText,
        title: 'Requisitions',
        desc: 'Create and track purchase requests through approval workflow.',
        color: 'indigo',
    },
    {
        icon: ClipboardList,
        title: 'Tenders',
        desc: 'Manage bidding processes with vendor collaboration.',
        color: 'amber',
    },
    {
        icon: Package,
        title: 'Orders',
        desc: 'Generate and track purchase orders from approval to delivery.',
        color: 'emerald',
    },
    {
        icon: Truck,
        title: 'Receiving',
        desc: 'Streamline delivery inspection and quality verification.',
        color: 'cyan',
    },
    {
        icon: LayoutDashboard,
        title: 'Dashboard',
        desc: 'Real-time visibility into procurement operations.',
        color: 'violet',
    },
    {
        icon: PieChart,
        title: 'Analytics',
        desc: 'Insights on spending, vendor performance, and costs.',
        color: 'rose',
    },
]

const colorMap: Record<
    string,
    { bg: string; border: string; icon: string; glow: string }
> = {
    indigo: {
        bg: 'bg-indigo-100',
        border: 'border-indigo-200',
        icon: 'text-indigo-600',
        glow: 'hover:shadow-indigo-500/20',
    },
    amber: {
        bg: 'bg-amber-100',
        border: 'border-amber-200',
        icon: 'text-amber-600',
        glow: 'hover:shadow-amber-500/20',
    },
    emerald: {
        bg: 'bg-emerald-100',
        border: 'border-emerald-200',
        icon: 'text-emerald-600',
        glow: 'hover:shadow-emerald-500/20',
    },
    cyan: {
        bg: 'bg-cyan-100',
        border: 'border-cyan-200',
        icon: 'text-cyan-600',
        glow: 'hover:shadow-cyan-500/20',
    },
    violet: {
        bg: 'bg-violet-100',
        border: 'border-violet-200',
        icon: 'text-violet-600',
        glow: 'hover:shadow-violet-500/20',
    },
    rose: {
        bg: 'bg-rose-100',
        border: 'border-rose-200',
        icon: 'text-rose-600',
        glow: 'hover:shadow-rose-500/20',
    },
    slate: {
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        icon: 'text-slate-600',
        glow: 'hover:shadow-slate-500/20',
    },
}

export default function LandingPage() {
    const [stats, setStats] = useState<PublicStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/public/stats')
            .then((res) => res.json())
            .then((data) => {
                setStats(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const openLogin = () => window.dispatchEvent(new CustomEvent('open-login'))

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-500/[0.08] blur-3xl animate-pulse" />
                <div
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-500/[0.08] blur-3xl animate-pulse"
                    style={{ animationDelay: '1s' }}
                />
            </div>

            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
                <div className="max-w-6xl mx-auto h-16 px-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform">
                            <Hexagon size={20} className="text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-slate-800">
                                HAZNET
                            </span>
                            <span className="block text-xs text-slate-500 -mt-0.5">
                                Supply Chain
                            </span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openLogin}
                            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </nav>

            <section className="pt-28 pb-16 px-4">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 text-xs font-semibold text-indigo-600 mb-5 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Enterprise Procurement Platform
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-5 leading-tight">
                            Modernize Your
                            <br />
                            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                Procurement Operations
                            </span>
                        </h1>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Centralize requisitions, vendor management,
                            purchasing, approvals, and receiving into one
                            intelligent platform.
                        </p>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={openLogin}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium rounded-xl hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-1 transition-all inline-flex items-center gap-2"
                            >
                                Get Started <ArrowRight size={18} />
                            </button>
                            <button
                                onClick={() =>
                                    (window.location.href = '/api/docs')
                                }
                                className="px-6 py-3 bg-white text-slate-700 font-medium rounded-xl border border-slate-200 hover:bg-slate-50 hover:shadow-md hover:-translate-y-1 transition-all"
                            >
                                API Docs
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-violet-500/20 to-indigo-500/20 rounded-3xl blur-3xl" />
                        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-2xl shadow-indigo-500/10 overflow-hidden">
                            <div className="p-5 border-b border-slate-100/50 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/50">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        Procurement Overview
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Real-time analytics
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/50 text-xs font-semibold text-emerald-600 shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Live
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-500 mb-3">
                                        Monthly Procurement
                                    </p>
                                    <div className="flex items-end gap-1.5 h-20">
                                        {[65, 45, 80, 55, 90, 70, 85].map(
                                            (h, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1 rounded-t-lg bg-gradient-to-t from-indigo-500 to-violet-400 shadow-lg shadow-indigo-500/30"
                                                    style={{ height: `${h}%` }}
                                                />
                                            ),
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        {
                                            icon: CheckCircle,
                                            text: 'Requisition approved',
                                            time: '2m ago',
                                            color: 'emerald',
                                        },
                                        {
                                            icon: TrendingUp,
                                            text: 'New tender published',
                                            time: '15m ago',
                                            color: 'indigo',
                                        },
                                        {
                                            icon: Package,
                                            text: 'Order shipped',
                                            time: '1h ago',
                                            color: 'amber',
                                        },
                                    ].map((item, i) => {
                                        const c = colorMap[item.color] || colorMap.slate
                                        return (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100/50 bg-white/50 hover:shadow-md hover:shadow-slate-200/30 transition-all cursor-pointer group"
                                        >
                                            <div
                                                className={cn('w-9 h-9 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform', c.bg)}
                                            >
                                                <item.icon
                                                    size={16}
                                                    className={c.icon}
                                                />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700 flex-1 group-hover:text-indigo-600 transition-colors">
                                                {item.text}
                                            </p>
                                            <span className="text-xs text-slate-400 font-medium">
                                                {item.time}
                                            </span>
                                        </div>
                                    )})}
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        {
                                            label: 'Reqs',
                                            value:
                                                stats?.total_requisitions ??
                                                '-',
                                            color: 'indigo',
                                        },
                                        {
                                            label: 'Tenders',
                                            value: stats?.active_tenders ?? '-',
                                            color: 'amber',
                                        },
                                        {
                                            label: 'Vendors',
                                            value: stats?.total_vendors ?? '-',
                                            color: 'emerald',
                                        },
                                        {
                                            label: 'Orders',
                                            value: stats?.active_orders ?? '-',
                                            color: 'violet',
                                        },
                                    ].map((item, i) => {
                                        const c = colorMap[item.color] || colorMap.slate
                                        return (
                                        <div
                                            key={i}
                                            className="p-3 rounded-xl border border-slate-100/50 bg-gradient-to-br from-white to-slate-50/50 text-center hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                                        >
                                            <div
                                                className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm', c.bg)}
                                            >
                                                <span
                                                    className={cn('font-bold text-xs', c.icon)}
                                                >
                                                    {String(item.value).charAt(
                                                        0,
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {item.label}
                                            </p>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 px-4 bg-white/50 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Key Features
                        </h2>
                        <p className="text-slate-600">
                            Everything you need for efficient procurement
                            management
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {features.map((feature, i) => {
                            const colors = colorMap[feature.color]
                            return (
                                <div
                                    key={i}
                                    className={cn('group p-6 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer', colors.glow)}
                                >
                                    <div
                                        className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                                    >
                                        <feature.icon
                                            size={22}
                                            className={colors.icon}
                                        />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            <footer className="py-8 border-t border-slate-200/50 bg-white/80 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Hexagon size={14} className="text-white" />
                        </div>
                        <span className="font-semibold text-slate-700">
                            HAZNET
                        </span>
                        <span>© 2026</span>
                    </div>
                    <span className="bg-gradient-to-r from-slate-500 to-slate-600 bg-clip-text text-transparent font-medium">
                        Supply Chain Management System
                    </span>
                </div>
            </footer>
        </div>
    )
}
