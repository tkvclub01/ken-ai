'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useThemeStore } from '@/stores/useThemeStore'
import { createClient } from '@/lib/supabase/client'
import { 
  User, Bell, Palette, Shield, Globe, Mail, Phone, MapPin, 
  Lock, Key, LogOut, Trash2, Download, Eye, EyeOff, Loader2,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { signOut as supabaseSignOut } from '@/lib/supabase/auth'

export default function SettingsPage() {
  const router = useRouter()
  const { user: authUser, profile, loading: authLoading, signOut } = useAuth()
  const { theme, setTheme } = useThemeStore()
  
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    location: '',
    bio: ''
  })
  
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: false,
    marketing_emails: false,
    student_updates: true,
    document_reminders: true,
  })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const hasInitializedRef = useRef(false)

  // Update form data when profile loads (from React Query cache)
  // Only run ONCE when profile first becomes available
  useEffect(() => {
    if (profile && authUser && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      setProfileData({
        full_name: profile.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        phone: (profile as any).phone || '',
        department: (profile as any).department || '',
        location: (profile as any).location || '',
        bio: (profile as any).bio || ''
      })
      loadNotificationPreferences()
    }
  }, [profile, authUser])

  const loadNotificationPreferences = async () => {
    // Load from localStorage or backend
    const saved = localStorage.getItem('notification_preferences')
    if (saved) {
      setNotifications(JSON.parse(saved))
    }
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          department: profileData.department,
          location: profileData.location,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser?.id)

      if (error) throw error

      toast.success('Profile updated successfully')
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      localStorage.setItem('notification_preferences', JSON.stringify(notifications))
      toast.success('Notification preferences saved')
    } catch (error: any) {
      toast.error('Failed to save preferences')
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.new_password) {
      toast.error('Please enter a new password')
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()
      
      // First verify current password by trying to sign in
      if (passwordData.current_password) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: authUser?.email || '',
          password: passwordData.current_password
        })

        if (signInError) {
          toast.error('Current password is incorrect')
          return
        }
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })

      if (error) throw error

      toast.success('Password changed successfully')
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error: any) {
      console.error('Password change error:', error)
      toast.error(error.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error: any) {
      toast.error('Failed to logout')
    }
  }

  const handleExportData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Fetch user data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser?.id)
        .single()

      // Create export object
      const exportData = {
        profile,
        exported_at: new Date().toISOString(),
        user_id: authUser?.id
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ken-ai-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Data exported successfully')
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplay = (role: string) => {
    const displays = {
      admin: { label: 'Administrator', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
      manager: { label: 'Manager', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
      counselor: { label: 'Counselor', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
      processor: { label: 'Processor', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
      student: { label: 'Student', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' }
    }
    return displays[role as keyof typeof displays] || { label: role, color: 'text-gray-600 bg-gray-100' }
  }

  const roleDisplay = getRoleDisplay(profile?.role || 'student')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-[700px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar & Role Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-lg">
                      {profileData.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">
                        {profileData.full_name || authUser?.email?.split('@')[0] || 'User'}
                      </h3>
                      <Badge variant="outline" className={roleDisplay.color}>
                        {roleDisplay.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{profileData.email || authUser?.email}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Change Avatar</Button>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    placeholder={authLoading ? "Loading..." : "Enter your full name"}
                    disabled={authLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      className="pl-10 bg-muted/50 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder={authLoading ? "Loading..." : "+1 (234) 567-8900"}
                      className="pl-10"
                      disabled={authLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    placeholder={authLoading ? "Loading..." : "e.g., Admissions, IT"}
                    disabled={authLoading}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      placeholder={authLoading ? "Loading..." : "City, Country"}
                      className="pl-10"
                      disabled={authLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder={authLoading ? "Loading..." : "Tell us about yourself"}
                    disabled={authLoading}
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Change Password</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-1">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                        placeholder="Enter current password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      placeholder="Enter new password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters long
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <Button onClick={handleChangePassword} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </div>

              <Separator />

              {/* Account Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Account Management</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-0.5">
                      <Label>Data Export</Label>
                      <p className="text-sm text-muted-foreground">
                        Download all your account data
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleExportData} disabled={loading}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                    <div className="space-y-0.5">
                      <Label className="text-destructive">Delete Account</Label>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant="destructive" disabled>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-0.5">
                      <Label>Logout</Label>
                      <p className="text-sm text-muted-foreground">
                        Sign out from all devices
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleLogout} disabled={authLoading}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates and notifications via email
                  </p>
                </div>
                <Switch
                  checked={notifications.email_notifications}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, email_notifications: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get real-time alerts in your browser
                  </p>
                </div>
                <Switch
                  checked={notifications.push_notifications}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, push_notifications: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive product updates and promotional content
                  </p>
                </div>
                <Switch
                  checked={notifications.marketing_emails}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, marketing_emails: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Student Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about student activities and progress
                  </p>
                </div>
                <Switch
                  checked={notifications.student_updates}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, student_updates: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Document Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Reminders for pending document uploads and verifications
                  </p>
                </div>
                <Switch
                  checked={notifications.document_reminders}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, document_reminders: checked }))
                  }
                />
              </div>

              <Button onClick={handleSaveNotifications} className="mt-4">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance & Preferences
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className="h-24 flex-col gap-2"
                  >
                    <div className="rounded-md border bg-background p-2">
                      <div className="h-2 w-full rounded bg-muted" />
                      <div className="mt-2 flex gap-1">
                        <div className="h-2 w-2 rounded bg-primary" />
                        <div className="h-2 w-2 rounded bg-muted" />
                      </div>
                    </div>
                    <span className="text-xs">Light</span>
                  </Button>

                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="h-24 flex-col gap-2"
                  >
                    <div className="rounded-md border bg-muted p-2">
                      <div className="h-2 w-full rounded bg-background" />
                      <div className="mt-2 flex gap-1">
                        <div className="h-2 w-2 rounded bg-primary" />
                        <div className="h-2 w-2 rounded bg-muted-foreground" />
                      </div>
                    </div>
                    <span className="text-xs">Dark</span>
                  </Button>

                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => setTheme('system')}
                    className="h-24 flex-col gap-2"
                  >
                    <div className="rounded-md border bg-gradient-to-br from-background to-muted p-2">
                      <div className="h-2 w-full rounded bg-primary/50" />
                      <div className="mt-2 flex gap-1">
                        <div className="h-2 w-2 rounded bg-primary" />
                        <div className="h-2 w-2 rounded bg-muted" />
                      </div>
                    </div>
                    <span className="text-xs">System</span>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Language */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="default" className="h-16">
                    English
                  </Button>
                  <Button variant="outline" className="h-16 opacity-50" disabled>
                    Tiếng Việt (Coming Soon)
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Accessibility */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Accessibility</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>High Contrast Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Increase contrast for better visibility
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reduce Motion</Label>
                      <p className="text-sm text-muted-foreground">
                        Minimize animations and transitions
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
