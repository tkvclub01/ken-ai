'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserStore } from '@/stores/useUserStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { User, Bell, Palette, Shield, Globe, Mail, Phone, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore()
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
  })

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully')
  }

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved')
  }

  const handleSaveAppearance = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    toast.success('Appearance settings updated')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
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
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <Button variant="outline">Change Avatar</Button>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="Enter your phone number"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="Enter your location"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  placeholder="Tell us about yourself"
                />
              </div>

              <Button onClick={handleSaveProfile}>Save Changes</Button>
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
                  checked={notifications.email}
                  onCheckedChange={(checked: boolean) =>
                    setNotifications((prev) => ({ ...prev, email: checked }))
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
                  checked={notifications.push}
                  onCheckedChange={(checked: boolean) =>
                    setNotifications((prev) => ({ ...prev, push: checked }))
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
                  checked={notifications.marketing}
                  onCheckedChange={(checked: boolean) =>
                    setNotifications((prev) => ({ ...prev, marketing: checked }))
                  }
                />
              </div>

              <Button onClick={handleSaveNotifications} className="mt-4">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => handleSaveAppearance('light')}
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
                    onClick={() => handleSaveAppearance('dark')}
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
                    onClick={() => handleSaveAppearance('system')}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Manage your privacy settings and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to other users
                  </p>
                </div>
                <Switch defaultChecked={false} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activity Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Show when you're online or active
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Data Export</Label>
                <p className="text-sm text-muted-foreground">
                  Download all your data from KEN AI
                </p>
                <Button variant="outline">Export Data</Button>
              </div>

              <Separator />

              <div className="space-y-2 pt-4">
                <Label className="text-destructive">Danger Zone</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
