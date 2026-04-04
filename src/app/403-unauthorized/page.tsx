import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Your account doesn't have the necessary permissions to view this resource. 
            Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => window.location.href = '/'}>
              Go to Dashboard
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => window.location.href = '/login'}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
