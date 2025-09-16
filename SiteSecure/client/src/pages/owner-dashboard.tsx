import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, CreditCard, Smartphone, Download, Mail, Plus, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function OwnerDashboard() {
  const { isAuthenticated, isOwner, sessionId } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated || !isOwner) {
      setLocation("/");
    }
  }, [isAuthenticated, isOwner, setLocation]);

  const { data: stats } = useQuery({
    queryKey: ["/api/stats/owner"],
    enabled: isAuthenticated && isOwner && !!sessionId,
    queryFn: async () => {
      const response = await fetch("/api/stats/owner", {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    }
  });

  const { data: donations } = useQuery({
    queryKey: ["/api/donations"],
    enabled: isAuthenticated && isOwner && !!sessionId,
    queryFn: async () => {
      const response = await fetch("/api/donations?limit=5", {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      if (!response.ok) throw new Error("Failed to fetch donations");
      return response.json();
    }
  });

  const { data: pendingGCash } = useQuery({
    queryKey: ["/api/gcash/pending"],
    enabled: isAuthenticated && isOwner && !!sessionId,
    queryFn: async () => {
      const response = await fetch("/api/gcash/pending", {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      if (!response.ok) throw new Error("Failed to fetch pending GCash payments");
      return response.json();
    }
  });

  if (!isAuthenticated || !isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-owner-dashboard-title">Executive Dashboard</h1>
            <p className="text-muted-foreground">Complete system oversight and financial control</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-green-100 text-green-800" data-testid="status-revenue-growth">Revenue: +{stats?.growthRate?.toFixed(1) || "0.0"}%</Badge>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">System Status</div>
              <div className="font-medium text-secondary">Optimal</div>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-monthly-revenue">
                    ${stats?.monthlyRevenue?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-secondary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Donors</p>
                  <p className="text-2xl font-bold" data-testid="text-active-donors">
                    {stats?.activeDonors || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold" data-testid="text-total-revenue">
                    ${stats?.totalRevenue?.toFixed(0) || "0"}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Growth Rate</p>
                  <p className="text-2xl font-bold text-secondary" data-testid="text-growth-rate">
                    +{stats?.growthRate?.toFixed(1) || "0.0"}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Processing Status */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Processing Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">PayPal Integration</p>
                      <p className="text-sm text-muted-foreground">
                        ${stats?.paymentMethods?.paypal?.toFixed(2) || "0.00"} processed
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Stripe Gateway</p>
                      <p className="text-sm text-muted-foreground">
                        ${stats?.paymentMethods?.stripe?.toFixed(2) || "0.00"} processed
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">GCash Integration</p>
                      <p className="text-sm text-muted-foreground">
                        ${stats?.paymentMethods?.gcash?.toFixed(2) || "0.00"} processed
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Manual Verification</Badge>
                </div>
              </div>

              {pendingGCash && pendingGCash.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold mb-4">Pending GCash Verifications</h4>
                  <div className="space-y-3">
                    {pendingGCash.slice(0, 3).map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between" data-testid={`pending-payment-${payment.id}`}>
                        <div>
                          <p className="text-sm font-medium">{payment.referenceNumber}</p>
                          <p className="text-xs text-muted-foreground">₱{payment.amount}</p>
                        </div>
                        <Button size="sm" className="text-xs">Verify</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Donors */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {donations?.slice(0, 5).map((donation: any, index: number) => (
                  <div key={donation.id} className="flex items-center justify-between" data-testid={`recent-donation-${donation.id}`}>
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{donation.donorName || "Anonymous Donor"}</div>
                        <div className="text-sm text-muted-foreground">
                          {donation.paymentMethod} • {new Date(donation.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold">${donation.amount}</div>
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground py-4">No recent activity</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8 bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" data-testid="button-export-reports">
                <Download className="w-4 h-4 mr-2" />
                Export Reports
              </Button>
              <Button variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" data-testid="button-send-newsletter">
                <Mail className="w-4 h-4 mr-2" />
                Send Newsletter
              </Button>
              <Button variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" data-testid="button-add-campaign">
                <Plus className="w-4 h-4 mr-2" />
                Add Campaign
              </Button>
              <Button variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" data-testid="button-system-settings">
                <Settings className="w-4 h-4 mr-2" />
                System Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
