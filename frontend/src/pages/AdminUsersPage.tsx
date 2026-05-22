import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, HttpError } from '@/services/api'
import PageLayout from '@/components/PageLayout'
import Modal from '@/components/ui/modal'
import { Button, Badge, Card } from '@/components/ui'
import { Input, FormField } from '@/components/ui/form'
import { FadeIn } from '@/components/ui/AnimatedList'
import { WelcomeHeader } from '@/components/shared'
import { motion } from 'framer-motion'
import { 
    Plus, Search, Users, Shield, Mail, Edit2, Trash2, 
    X, Check, Building2, AlertCircle
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const roleBadgeVariants: Record<string, string> = {
    admin: 'danger',
    oic: 'warning',
    hod: 'info',
    cnp_hod: 'info',
    procurement_officer: 'default',
    inventory_manager: 'success',
    indentor: 'neutral',
}

const roleColors: Record<string, string> = {
    admin: 'from-rose-500 to-rose-600',
    oic: 'from-amber-500 to-amber-600',
    hod: 'from-blue-500 to-blue-600',
    cnp_hod: 'from-blue-500 to-blue-600',
    procurement_officer: 'from-indigo-500 to-indigo-600',
    inventory_manager: 'from-emerald-500 to-emerald-600',
    indentor: 'from-violet-500 to-violet-600',
}

const roleOptions = [
    { value: 'indentor', label: 'Indentor' },
    { value: 'hod', label: 'Head of Department' },
    { value: 'cnp_hod', label: 'CNP HoD' },
    { value: 'procurement_officer', label: 'Procurement Officer' },
    { value: 'inventory_manager', label: 'Inventory Manager' },
    { value: 'oic', label: 'OIC' },
    { value: 'admin', label: 'Admin' },
]

const departmentOptions = [
    { value: 'IT', label: 'Information Technology' },
    { value: 'Finance', label: 'Finance' },
    { value: 'HR', label: 'Human Resources' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Procurement', label: 'Procurement' },
    { value: 'Marketing', label: 'Marketing' },
]

export default function AdminUsersPage() {
    const user = useAuthStore((s) => s.user)
    const queryClient = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [formData, setFormData] = useState({
        username: '', email: '', first_name: '', last_name: '', role: '', department_id: '', password: '', employee_id: '', contact: ''
    })
    const [editFormData, setEditFormData] = useState({
        email: '', first_name: '', last_name: '', role: '', department_id: '', is_active: true, employee_id: '', contact: '', designation: '', bio: ''
    })

    const { data: usersResponse, isLoading } = useQuery({ 
        queryKey: ['admin-users'], 
        queryFn: () => api.admin.users() 
    })

    const users = usersResponse?.data || []
    const filteredUsers = users.filter((u: any) =>
        u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    const activeCount = users.filter((u: any) => u.is_active).length
    const adminCount = users.filter((u: any) => u.role === 'admin').length

    const stats = useMemo(() => [
        { label: 'Total Users', value: users.length, icon: Users, color: 'from-indigo-500 to-indigo-600' },
        { label: 'Active Users', value: activeCount, icon: Check, color: 'from-emerald-500 to-emerald-600' },
        { label: 'Admins', value: adminCount, icon: Shield, color: 'from-rose-500 to-rose-600' },
    ], [users])

    return (
        <PageLayout 
            title="User Management"
            actions={
                <Button 
                    variant="primary" 
                    size="md" 
                    onClick={() => setShowForm(true)} 
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20"
                >
                    <Plus size={18} /> Add User
                </Button>
            }
        >
            <div className="max-w-7xl mx-auto space-y-6">
                <WelcomeHeader />

                <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.map((stat) => (
                        <div 
                            key={stat.label}
                            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-100/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', stat.color)}>
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
                        <input 
                            type="text" 
                            placeholder="Search users by name, email or role..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="bg-transparent border-none text-base flex-1 outline-none text-slate-700 placeholder:text-slate-400" 
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
                </FadeIn>

                {filteredUsers.length === 0 ? (
                    <Card className="p-16 text-center bg-white/80 backdrop-blur-sm border border-slate-100/50">
                        <div className="flex flex-col items-center justify-center mb-4">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
                                <Users size={40} className="text-slate-300" />
                            </div>
                            <p className="text-lg font-bold text-slate-600">No users found</p>
                            <p className="text-sm text-slate-400 mt-1">Add a new user to get started</p>
                        </div>
                        <Button 
                            variant="primary" 
                            onClick={() => setShowForm(true)} 
                            className="bg-gradient-to-r from-indigo-500 to-violet-500"
                        >
                            <Plus size={18} /> Add User
                        </Button>
                    </Card>
                ) : (
                    <Card className="overflow-hidden border border-slate-100/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/10">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Department</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u: any, index: number) => (
                                        <motion.tr 
                                            key={u.id} 
                                            className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors group"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <td className="px-5 py-3 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shadow-md',
                                                        roleColors[u.role] || 'from-indigo-500 to-indigo-600'
                                                    )}>
                                                        {u.first_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{u.first_name} {u.last_name}</p>
                                                        <p className="text-xs text-slate-400">@{u.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                    <Mail size={14} className="text-indigo-400" />
                                                    {u.email}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <Badge variant={roleBadgeVariants[u.role] || 'neutral'} className="font-medium">
                                                    {u.role?.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-sm text-slate-500">
                                                {u.department_name ? (
                                                    <span className="flex items-center gap-2">
                                                        <Building2 size={14} className="text-slate-400" />
                                                        {u.department_name}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <Badge variant={u.is_active ? 'success' : 'neutral'} className="font-medium" dot>
                                                    {u.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <div className="flex items-center justify-center gap-2">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => {
                                                            setSelectedUser(u)
                                                            setEditFormData({
                                                                email: u.email || '',
                                                                first_name: u.first_name || '',
                                                                last_name: u.last_name || '',
                                                                role: u.role || '',
                                                                department_id: u.department_id || '',
                                                                is_active: u.is_active ?? true,
                                                                employee_id: u.employee_id || '',
                                                                contact: u.contact || '',
                                                                designation: u.designation || '',
                                                                bio: u.bio || ''
                                                            })
                                                            setShowEditModal(true)
                                                        }}
                                                        className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 flex items-center justify-center text-indigo-500 transition-all"
                                                    >
                                                        <Edit2 size={16} />
                                                    </motion.button>
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-100 flex items-center justify-center text-red-500 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create New User" size="lg">
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Username *">
                                <Input 
                                    type="text" 
                                    value={formData.username} 
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
                                    placeholder="Enter username" 
                                />
                            </FormField>
                            <FormField label="Email *">
                                <Input 
                                    type="email" 
                                    value={formData.email} 
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                                    placeholder="user@example.com" 
                                />
                            </FormField>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="First Name *">
                                <Input 
                                    type="text" 
                                    value={formData.first_name} 
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} 
                                    placeholder="Enter first name" 
                                />
                            </FormField>
                            <FormField label="Last Name *">
                                <Input 
                                    type="text" 
                                    value={formData.last_name} 
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} 
                                    placeholder="Enter last name" 
                                />
                            </FormField>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Role *">
                                <select 
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                >
                                    <option value="">Select role</option>
                                    {roleOptions.map((role) => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Department">
                                <select 
                                    value={formData.department_id}
                                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                >
                                    <option value="">Select department</option>
                                    {departmentOptions.map((dept) => (
                                        <option key={dept.value} value={dept.value}>{dept.label}</option>
                                    ))}
                                </select>
                            </FormField>
                        </div>
                        <FormField label="Password *">
                            <Input 
                                type="password" 
                                value={formData.password} 
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                                placeholder="Enter password" 
                            />
                        </FormField>
                        
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                            <AlertCircle size={18} className="text-amber-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-700">Important</p>
                                <p className="text-xs text-amber-600 mt-1">Default password will be sent to user's email after account creation.</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button variant="primary" className="bg-gradient-to-r from-indigo-500 to-violet-500">
                                <Plus size={16} /> Create User
                            </Button>
                        </div>
                    </div>
                </Modal>

                <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User Details" size="lg">
                    <div className="space-y-5">
                        {selectedUser && (
                            <>
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl">
                                    <div className={cn(
                                        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold',
                                        roleColors[selectedUser.role] || 'from-indigo-500 to-indigo-600'
                                    )}>
                                        {selectedUser.first_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{selectedUser.first_name} {selectedUser.last_name}</p>
                                        <p className="text-sm text-slate-500">@{selectedUser.username}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="First Name">
                                        <Input 
                                            value={editFormData.first_name} 
                                            onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })} 
                                        />
                                    </FormField>
                                    <FormField label="Last Name">
                                        <Input 
                                            value={editFormData.last_name} 
                                            onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })} 
                                        />
                                    </FormField>
                                </div>

                                <FormField label="Email">
                                    <Input 
                                        type="email"
                                        value={editFormData.email} 
                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} 
                                    />
                                </FormField>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Employee ID">
                                        <Input 
                                            value={editFormData.employee_id || ''} 
                                            onChange={(e) => setEditFormData({ ...editFormData, employee_id: e.target.value })} 
                                            placeholder="EMP001"
                                        />
                                    </FormField>
                                    <FormField label="Contact">
                                        <Input 
                                            value={editFormData.contact || ''} 
                                            onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value })} 
                                            placeholder="+91-9876543210"
                                        />
                                    </FormField>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Designation">
                                        <Input 
                                            value={editFormData.designation || ''} 
                                            onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })} 
                                            placeholder="Officer"
                                        />
                                    </FormField>
                                    <FormField label="Role">
                                        <select 
                                            value={editFormData.role}
                                            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                        >
                                            <option value="">Select role</option>
                                            {roleOptions.map((role) => (
                                                <option key={role.value} value={role.value}>{role.label}</option>
                                            ))}
                                        </select>
                                    </FormField>
                                </div>

                                <FormField label="Bio">
                                    <textarea 
                                        value={editFormData.bio || ''} 
                                        onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })} 
                                        className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                        rows={3}
                                        placeholder="Short bio about the user..."
                                    />
                                </FormField>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                    <input 
                                        type="checkbox" 
                                        checked={editFormData.is_active}
                                        onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">User is active</span>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                                    <Button variant="primary" className="bg-gradient-to-r from-indigo-500 to-violet-500">
                                        <Check size={16} /> Save Changes
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>
            </div>
        </PageLayout>
    )
}