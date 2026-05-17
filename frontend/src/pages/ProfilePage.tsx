import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import PageLayout from '@/components/PageLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, FormField } from '@/components/ui/form'
import { FadeIn } from '@/components/ui/AnimatedList'
import { WelcomeHeader } from '@/components/shared'
import { motion } from 'framer-motion'
import { 
  User, Mail, Shield, Save, Camera, Key, Bell, Check, Trash2, 
  Settings, Globe, Lock, Smartphone, Calendar, MapPin, Building2,
  Clock, Activity, MessageSquare, FileText, Award
} from 'lucide-react'
import { cn } from '@/lib/utils'

const roleColorMap: Record<string, string> = {
  admin: 'from-violet-500 to-violet-600',
  cnp_hod: 'from-rose-500 to-rose-600',
  hod: 'from-amber-500 to-amber-600',
  procurement_officer: 'from-emerald-500 to-emerald-600',
  inventory_manager: 'from-cyan-500 to-cyan-600',
  oic: 'from-blue-500 to-blue-600',
  indentor: 'from-indigo-500 to-indigo-600',
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.contact || '',
    department: user?.department_name || '',
    location: '',
  })
  const [notification, setNotification] = useState(false)

  const roleColor = user?.role ? roleColorMap[user.role] || 'from-indigo-500 to-violet-500' : 'from-indigo-500 to-violet-500'

  const initials = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : user?.first_name?.[0]?.toUpperCase() || '?'


  const handleSave = () => {
    setIsEditing(false)
    setNotification(true)
    setTimeout(() => setNotification(false), 3000)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'activity', label: 'Activity', icon: Activity },
  ]

  return (
    <PageLayout
      title="Profile"
      actions={
        notification ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm font-semibold"
          >
            <Check size={16} /> Saved successfully
          </motion.div>
        ) : (
          <Button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={isEditing 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20' 
              : 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20'
            }
          >
            {isEditing ? (
              <><Save size={18} /> Save Changes</>
            ) : (
              'Edit Profile'
            )}
          </Button>
        )
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <WelcomeHeader />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border border-slate-100/50 shadow-lg shadow-slate-200/10 overflow-hidden sticky top-6">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                        activeTab === tab.id 
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20' 
                          : 'hover:bg-slate-50 text-slate-600'
                      )}
                    >
                      <tab.icon size={18} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'profile' && (
              <>
                <FadeIn>
                  <Card className="bg-white/80 backdrop-blur-sm border border-slate-100/50 shadow-lg shadow-slate-200/10 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                        <CardTitle className="text-slate-700">Personal Information</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="relative">
                          <div className={cn('w-32 h-32 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-4xl font-bold shadow-xl', roleColor)}>
                            {initials}
                          </div>
                          <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-white border-2 border-slate-100 shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all">
                            <Camera size={16} className="text-slate-500" />
                          </button>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                          <FormField label="First Name">
                            <div className="relative">
                              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <Input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                disabled={!isEditing}
                                className="pl-11 bg-white/80"
                              />
                            </div>
                          </FormField>
                          <FormField label="Last Name">
                            <div className="relative">
                              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <Input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                disabled={!isEditing}
                                className="pl-11 bg-white/80"
                              />
                            </div>
                          </FormField>
                          <FormField label="Email Address">
                            <div className="relative">
                              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!isEditing}
                                className="pl-11 bg-white/80"
                              />
                            </div>
                          </FormField>
                          <FormField label="Phone Number">
                            <div className="relative">
                              <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <Input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={!isEditing}
                                className="pl-11 bg-white/80"
                                placeholder="+1 (555) 000-0000"
                              />
                            </div>
                          </FormField>
                          <FormField label="Department">
                            <div className="relative">
                              <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <Input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                disabled={!isEditing}
                                className="pl-11 bg-white/80"
                                placeholder="IT Department"
                              />
                            </div>
                          </FormField>
                          <FormField label="Location">
                            <div className="relative">
                              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <Input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                disabled={!isEditing}
                                className="pl-11 bg-white/80"
                                placeholder="New York, USA"
                              />
                            </div>
                          </FormField>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>

                <FadeIn delay={0.1}>
                  <Card className="bg-white/80 backdrop-blur-sm border border-slate-100/50 shadow-lg shadow-slate-200/10 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                          <Award size={20} className="text-white" />
                        </div>
                        <CardTitle className="text-slate-700">Role Information</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-200 hover:shadow-md transition-all">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                              <Shield size={18} className="text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-amber-600">Current Role</p>
                              <p className="text-sm font-bold text-slate-700 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl border border-indigo-200 hover:shadow-md transition-all">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                              <Globe size={18} className="text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-indigo-600">Access Level</p>
                              <p className="text-sm font-bold text-slate-700">Full Access</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200 hover:shadow-md transition-all">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                              <Clock size={18} className="text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-emerald-600">Member Since</p>
                              <p className="text-sm font-bold text-slate-700">January 2024</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              </>
            )}

            {activeTab === 'security' && (
              <FadeIn>
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-100/50 shadow-lg shadow-slate-200/10 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
                        <Lock size={20} className="text-white" />
                      </div>
                      <CardTitle className="text-slate-700">Security Settings</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {[
                      { icon: Key, title: 'Change Password', desc: 'Update your password regularly', color: 'indigo' },
                      { icon: Shield, title: 'Two-Factor Authentication', desc: 'Add an extra layer of security', color: 'emerald' },
                      { icon: Smartphone, title: 'Active Sessions', desc: 'Manage your active sessions', color: 'amber' },
                    ].map((item) => (
                      <div 
                        key={item.title}
                        className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center',
                            item.color === 'indigo' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' :
                            item.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                            'bg-gradient-to-br from-amber-500 to-amber-600'
                          )}>
                            <item.icon size={22} className="text-white" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-700">{item.title}</p>
                            <p className="text-sm text-slate-400">{item.desc}</p>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" className="rounded-xl">Manage</Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {activeTab === 'notifications' && (
              <FadeIn>
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-100/50 shadow-lg shadow-slate-200/10 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                        <Bell size={20} className="text-white" />
                      </div>
                      <CardTitle className="text-slate-700">Notification Preferences</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {[
                      { icon: Mail, label: 'Email Notifications', desc: 'Receive email alerts for important updates', enabled: true },
                      { icon: MessageSquare, label: 'Push Notifications', desc: 'Get push notifications on mobile', enabled: true },
                      { icon: FileText, label: 'Weekly Reports', desc: 'Receive weekly summary reports', enabled: false },
                      { icon: Bell, label: 'Order Updates', desc: 'Notifications for order status changes', enabled: true },
                    ].map((item) => (
                      <div 
                        key={item.label}
                        className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                            <item.icon size={18} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                            <p className="text-xs text-slate-400">{item.desc}</p>
                          </div>
                        </div>
                        <button className={cn(
                          'w-12 h-6 rounded-full transition-colors relative',
                          item.enabled ? 'bg-indigo-500' : 'bg-slate-200'
                        )}>
                          <span className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                            item.enabled ? 'left-7' : 'left-1'
                          )} />
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {activeTab === 'activity' && (
              <FadeIn>
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-100/50 shadow-lg shadow-slate-200/10 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                        <Activity size={20} className="text-white" />
                      </div>
                      <CardTitle className="text-slate-700">Recent Activity</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {[
                        { icon: FileText, title: 'Created Requisition', desc: 'REQ-2024-001 - Office Supplies', time: '2 hours ago', color: 'indigo' },
                        { icon: MessageSquare, title: 'Sent Message', desc: 'to Procurement Team', time: '5 hours ago', color: 'violet' },
                        { icon: Check, title: 'Approved Request', desc: 'Purchase Order #1234', time: '1 day ago', color: 'emerald' },
                        { icon: Settings, title: 'Updated Profile', desc: 'Changed notification settings', time: '3 days ago', color: 'amber' },
                      ].map((activity) => (
                        <div 
                          key={activity.title}
                          className="flex items-center gap-4 p-4 hover:bg-slate-50/50 rounded-xl transition-colors"
                        >
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            activity.color === 'indigo' ? 'bg-indigo-100' :
                            activity.color === 'violet' ? 'bg-violet-100' :
                            activity.color === 'emerald' ? 'bg-emerald-100' :
                            'bg-amber-100'
                          )}>
                            <activity.icon size={18} className={cn(
                              activity.color === 'indigo' ? 'text-indigo-500' :
                              activity.color === 'violet' ? 'text-violet-500' :
                              activity.color === 'emerald' ? 'text-emerald-500' :
                              'text-amber-500'
                            )} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-700">{activity.title}</p>
                            <p className="text-xs text-slate-400">{activity.desc}</p>
                          </div>
                          <span className="text-xs text-slate-400">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            <FadeIn delay={0.2}>
              <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                        <Trash2 size={22} className="text-white" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-red-800">Delete Account</p>
                        <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                      </div>
                    </div>
                    <Button variant="danger" className="bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/20">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}