import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import PageLayout from '@/components/PageLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/AnimatedList'
import { WelcomeHeader } from '@/components/shared'
import { useAuthStore } from '@/stores/authStore'
import { 
    FileText, Clock, CheckCircle, DollarSign, 
    Users, TrendingUp, AlertTriangle, Package
} from 'lucide-react'
import { cn } from '@/lib/utils'

const departmentIcons: Record<string, any> = {
    electrical: Users,
    mechanical: Users,
    it: Users,
    hr: Users,
    finance: DollarSign,
    procurement: Package,
    operations: Users,
    'r&d': Users,
    marketing: TrendingUp,
    admin: Users,
}

const departmentColors: Record<string, string> = {
    electrical: 'from-amber-500 to-orange-500',
    mechanical: 'from-blue-500 to-blue-600',
    it: 'from-indigo-500 to-indigo-600',
    hr: 'from-pink-500 to-pink-600',
    finance: 'from-emerald-500 to-emerald-600',
    procurement: 'from-violet-500 to-violet-600',
    operations: 'from-cyan-500 to-cyan-600',
    'r&d': 'from-rose-500 to-rose-600',
    marketing: 'from-amber-500 to-amber-600',
    admin: 'from-slate-500 to-slate-600',
}

export default function DepartmentPage() {
    const user = useAuthStore((s) => s.user)
    
    const { data: reqsResponse } = useQuery({
        queryKey: ['requisitions'],
        queryFn: () => api.requisitions.list({ page_size: 100 }),
    })

    const department = user?.department_id || 'admin'
    const DeptIcon = departmentIcons[department.toLowerCase()] || Users
    const deptColor = departmentColors[department.toLowerCase()] || 'from-indigo-500 to-violet-500'
    

    const reqs = reqsResponse?.data || []
    const myReqs = reqs.filter((r: any) => r.creator_id === user?.id)
    const pendingReqs = myReqs.filter((r: any) => ['submitted', 'under_review', 'processing'].includes(r.status))
    const completedReqs = myReqs.filter((r: any) => r.status === 'completed')
    const totalBudget = myReqs.reduce((sum: number, r: any) => sum + (r.total_estimate || 0), 0)

    return (
        <PageLayout title={department.charAt(0).toUpperCase() + department.slice(1)}>
            <div className="max-w-7xl mx-auto space-y-6">
                <WelcomeHeader />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Requisitions', value: myReqs.length, icon: FileText, color: 'from-indigo-500 to-indigo-600' },
                        { label: 'Pending', value: pendingReqs.length, icon: Clock, color: 'from-amber-500 to-amber-600' },
                        { label: 'Completed', value: completedReqs.length, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
                        { label: 'Total Budget', value: `$${totalBudget.toLocaleString()}`, icon: DollarSign, color: 'from-violet-500 to-violet-600' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-100/50 hover:shadow-lg transition-shadow duration-200">
                            <div className="flex items-center gap-4">
                                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md', stat.color)}>
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FadeIn delay={0.1}>
                        <Card className="bg-white/80 backdrop-blur-sm border border-slate-100/50 shadow-lg shadow-slate-200/10 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100/50 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center', deptColor)}>
                                        <Clock size={18} className="text-white" />
                                    </div>
                                    <CardTitle className="text-slate-700 text-base">Pending Requisitions</CardTitle>
                                    <Badge variant="warning" className="ml-auto text-xs">{pendingReqs.length}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                {pendingReqs.length === 0 ? (
                                    <div className="text-center py-6">
                                        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mx-auto mb-2', deptColor)}>
                                            <CheckCircle size={18} className="text-white" />
                                        </div>
                                        <p className="text-sm text-slate-500">All caught up!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {pendingReqs.slice(0, 5).map((req: any) => (
                                            <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl hover:bg-slate-100/50 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                                        <FileText size={14} className="text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-700">{req.requisition_no}</p>
                                                        <p className="text-xs text-slate-400 truncate max-w-[150px]">{req.title}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-amber-600 font-medium capitalize">{req.status?.replace('_', ' ')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </FadeIn>

                    <FadeIn delay={0.15}>
                        <Card className="bg-white/80 backdrop-blur-sm border border-slate-100/50 shadow-lg shadow-slate-200/10 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100/50 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center', deptColor)}>
                                        <CheckCircle size={18} className="text-white" />
                                    </div>
                                    <CardTitle className="text-slate-700 text-base">Completed Requisitions</CardTitle>
                                    <Badge variant="success" className="ml-auto text-xs">{completedReqs.length}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                {completedReqs.length === 0 ? (
                                    <div className="text-center py-6">
                                        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mx-auto mb-2', deptColor)}>
                                            <Clock size={18} className="text-white" />
                                        </div>
                                        <p className="text-sm text-slate-500">No completed items yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {completedReqs.slice(0, 5).map((req: any) => (
                                            <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl hover:bg-slate-100/50 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                        <CheckCircle size={14} className="text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-700">{req.requisition_no}</p>
                                                        <p className="text-xs text-slate-400 truncate max-w-[150px]">{req.title}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-emerald-600 font-medium">Completed</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </FadeIn>
                </div>

                <FadeIn delay={0.2}>
                    <Card className="bg-white/80 backdrop-blur-sm border border-slate-100/50 shadow-lg shadow-slate-200/10 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100/50 py-4">
                            <div className="flex items-center gap-3">
                                <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center', deptColor)}>
                                    <AlertTriangle size={18} className="text-white" />
                                </div>
                                <CardTitle className="text-slate-700 text-base">Department Overview</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Low Stock Items', value: '3 items', icon: Package, color: 'amber' },
                                    { label: 'Pending Approvals', value: `${pendingReqs.length} pending`, icon: Clock, color: 'violet' },
                                    { label: 'Budget Utilization', value: '68%', icon: TrendingUp, color: 'emerald' },
                                ].map((alert) => (
                                    <div key={alert.label} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={cn(
                                                'w-7 h-7 rounded-lg flex items-center justify-center',
                                                alert.color === 'amber' ? 'bg-amber-100' :
                                                alert.color === 'violet' ? 'bg-violet-100' : 'bg-emerald-100'
                                            )}>
                                                <alert.icon size={14} className={
                                                    alert.color === 'amber' ? 'text-amber-500' :
                                                    alert.color === 'violet' ? 'text-violet-500' : 'text-emerald-500'
                                                } />
                                            </div>
                                            <span className="text-xs font-medium text-slate-500">{alert.label}</span>
                                        </div>
                                        <p className="text-lg font-bold text-slate-700">{alert.value}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </FadeIn>
            </div>
        </PageLayout>
    )
}