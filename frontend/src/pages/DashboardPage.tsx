import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { DashboardStats, ActivityItem } from '@/types/models'
import PageLayout from '@/components/PageLayout'
import { StatCard } from '@/components/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState, TableSkeleton } from '@/components/ui/skeleton'
import { AnimatedList, AnimatedItem } from '@/components/ui/AnimatedList'
import { WelcomeHeader } from '@/components/shared'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Package, Clock, CheckCircle, TrendingUp, ChevronRight,
  Activity, ArrowRight, Zap, AlertTriangle, ClipboardCheck, Bell, Plus, MessageSquare
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.stats(),
  })

  const { data: activityResponse, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => api.dashboard.activity({ page_size: 5 }),
  })


  const pendingApprovals = stats?.pending_approval || 0
  const activeOrders = stats?.pending_orders || 0
  const activeTenders = stats?.active_tenders || 0
  const pendingReceipts = stats?.pending_receipts || 0
  const myPending = stats?.my_pending || 0

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <WelcomeHeader />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard title="Total Requisitions" value={stats?.total_requisitions || 0} icon={<FileText size={18} />} color="from-indigo-500 to-violet-500" onClick={() => navigate('/requisitions')} loading={statsLoading} />
          <StatCard title="Pending Approval" value={pendingApprovals} icon={<Clock size={18} />} color="from-amber-500 to-orange-500" onClick={() => navigate('/requisitions')} loading={statsLoading} />
          <StatCard title="In Progress" value={stats?.in_progress || 0} icon={<Zap size={18} />} color="from-cyan-500 to-cyan-600" onClick={() => navigate('/requisitions')} loading={statsLoading} />
          <StatCard title="Completed" value={stats?.completed || 0} icon={<CheckCircle size={18} />} color="from-emerald-500 to-emerald-600" onClick={() => navigate('/requisitions')} loading={statsLoading} />
          <StatCard title="Active Orders" value={activeOrders} icon={<Package size={18} />} color="from-violet-500 to-violet-600" onClick={() => navigate('/orders')} loading={statsLoading} />
          <StatCard title="Active Tenders" value={activeTenders} icon={<TrendingUp size={18} />} color="from-rose-500 to-rose-600" onClick={() => navigate('/tenders')} loading={statsLoading} />
          <StatCard title="Pending Receipts" value={pendingReceipts} icon={<ClipboardCheck size={18} />} color="from-amber-500 to-amber-600" onClick={() => navigate('/receiving')} loading={statsLoading} />
          <StatCard title="My Pending" value={myPending} icon={<AlertTriangle size={18} />} color="from-red-500 to-red-600" onClick={() => navigate('/requisitions')} loading={statsLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex items-center justify-between py-4 px-5 border-b border-slate-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Activity size={18} className="text-white" />
                  </div>
                  <CardTitle>Recent Activity</CardTitle>
                </div>
                <Button variant="ghost" size="sm">View All <ArrowRight size={14} /></Button>
              </CardHeader>
              <CardContent className="p-0">
                {activityLoading ? (
                  <TableSkeleton rows={5} />
                ) : activityResponse?.data?.length ? (
                  <AnimatedList>
                    {activityResponse.data.slice(0, 5).map((item: ActivityItem) => (
                      <AnimatedItem key={item.id}>
                        <div
                          className="px-5 py-4 hover:bg-slate-50/80 cursor-pointer border-b border-slate-50/50 last:border-b-0 transition-colors"
                          onClick={() => navigate(`/${item.type || 'requisitions'}/${item.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center shrink-0">
                              <FileText size={18} className="text-indigo-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{item.title}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge
                                  variant={
                                    item.status === 'completed' ? 'success' :
                                    item.status === 'under_review' ? 'warning' :
                                    item.status === 'processing' ? 'primary' : 'default'
                                  }
                                  dot
                                >
                                  {item.status?.replace(/_/g, ' ')}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                  {new Date(item.updated_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300" />
                          </div>
                        </div>
                      </AnimatedItem>
                    ))}
                  </AnimatedList>
                ) : (
                  <EmptyState icon={<Activity size={28} className="text-slate-300" />} title="No recent activity" description="Your activity will appear here." />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="py-3.5 px-5 border-b border-slate-100/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Bell size={16} className="text-amber-500" />
                    Notifications
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {pendingApprovals > 0 && (
                  <motion.div
                    className="p-3 rounded-xl border cursor-pointer transition-all bg-amber-50/80 border-amber-100 hover:-translate-y-1 hover:shadow-md"
                    whileHover={{ y: -2 }}
                    onClick={() => navigate('/requisitions')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-700">Pending Approvals</p>
                        <p className="text-xs text-slate-500 mt-0.5">{pendingApprovals} awaiting review</p>
                      </div>
                      <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">{pendingApprovals}</span>
                    </div>
                  </motion.div>
                )}
                {activeOrders > 0 && (
                  <motion.div
                    className="p-3 rounded-xl border cursor-pointer transition-all bg-violet-50/80 border-violet-100 hover:-translate-y-1 hover:shadow-md"
                    whileHover={{ y: -2 }}
                    onClick={() => navigate('/orders')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-700">Active Orders</p>
                        <p className="text-xs text-slate-500 mt-0.5">{activeOrders} in progress</p>
                      </div>
                      <span className="px-2 py-1 bg-violet-500 text-white text-xs font-bold rounded-full">{activeOrders}</span>
                    </div>
                  </motion.div>
                )}
                {pendingReceipts > 0 && (
                  <motion.div
                    className="p-3 rounded-xl border cursor-pointer transition-all bg-cyan-50/80 border-cyan-100 hover:-translate-y-1 hover:shadow-md"
                    whileHover={{ y: -2 }}
                    onClick={() => navigate('/receiving')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-700">Pending Receipts</p>
                        <p className="text-xs text-slate-500 mt-0.5">{pendingReceipts} awaiting inspection</p>
                      </div>
                      <span className="px-2 py-1 bg-cyan-500 text-white text-xs font-bold rounded-full">{pendingReceipts}</span>
                    </div>
                  </motion.div>
                )}
                {myPending > 0 && (
                  <motion.div
                    className="p-3 rounded-xl border cursor-pointer transition-all bg-red-50/80 border-red-100 hover:-translate-y-1 hover:shadow-md"
                    whileHover={{ y: -2 }}
                    onClick={() => navigate('/requisitions')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-700">My Pending</p>
                        <p className="text-xs text-slate-500 mt-0.5">{myPending} assigned to you</p>
                      </div>
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">{myPending}</span>
                    </div>
                  </motion.div>
                )}
                {pendingApprovals === 0 && activeOrders === 0 && pendingReceipts === 0 && myPending === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">No pending items</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4 px-5 border-b border-slate-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Zap size={18} className="text-white" />
                  </div>
                  <CardTitle>Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { title: 'New Requisition', icon: Plus, path: '/requisitions', color: 'indigo' },
                    { title: 'View Tenders', icon: TrendingUp, path: '/tenders', color: 'amber' },
                    { title: 'Track Orders', icon: Package, path: '/orders', color: 'emerald' },
                    { title: 'Messages', icon: MessageSquare, path: '/messages', color: 'violet' },
                  ].map((action) => (
                    <motion.button
                      key={action.title}
                      onClick={() => navigate(action.path)}
                      className="p-3 rounded-xl border border-slate-100/50 bg-slate-50/50 text-center hover:shadow-md hover:-translate-y-1 transition-all"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-lg bg-gradient-to-br mx-auto mb-2 flex items-center justify-center',
                        action.color === 'indigo' ? 'from-indigo-500 to-violet-500' :
                        action.color === 'amber' ? 'from-amber-500 to-orange-500' :
                        action.color === 'emerald' ? 'from-emerald-500 to-emerald-600' :
                        'from-violet-500 to-violet-600',
                      )}>
                        <action.icon size={16} className="text-white" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">{action.title}</p>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}