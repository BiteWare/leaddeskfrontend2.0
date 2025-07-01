"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useUsers } from "@/hooks/useUsers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  const { user, currentUserProfile, signOut } = useUsers()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <Button 
              onClick={signOut}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Sign Out
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back!</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>User ID:</strong> {user?.id}</p>
                  {currentUserProfile?.name && (
                    <p><strong>Name:</strong> {currentUserProfile.name}</p>
                  )}
                  <p><strong>Account Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full" onClick={() => window.location.href = '/enrich'}>
                    Go to LeadDesk
                  </Button>
                  <Button variant="outline" className="w-full">
                    Settings
                  </Button>
                  <Button variant="outline" className="w-full">
                    Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Welcome to your dashboard! Here you can manage your account and access all the features.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">🔍 Find Leads</h3>
                  <p className="text-sm text-gray-600">Search for business leads using our powerful tools.</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">📊 Analytics</h3>
                  <p className="text-sm text-gray-600">Track your lead generation performance.</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">⚙️ Settings</h3>
                  <p className="text-sm text-gray-600">Customize your account preferences.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
} 