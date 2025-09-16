import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, AlertTriangle, Activity, CheckCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin, sessionId } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setLocation("/");
    }
  }, [isAuthenticated, isAdmin, setLocation]);

  const { data: stats } = useQuery({
    queryKey: ["/api/stats/admin"],
    enabled: isAuthenticated && isAdmin && !!sessionId,
    queryFn: async () => {
      const response = await fetch("/api/stats/admin", {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    }
  });

  const { data: donations } = useQuery({
    queryKey: ["/api/donations"],
    enabled: isAuthenticated && isAdmin && !!sessionId,
    queryFn: async () => {
      const response = await fetch("/api/donations?limit=10", {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      if (!response.ok) throw new Error("Failed to fetch donations");
      return response.json();
    }
  });

  const { data: pendingGCash } = useQuery({
    queryKey: ["/api/gcash/pending"],
    enabled: isAuthenticated && isAdmin && !!sessionId,
    queryFn: async () => {
      const response = await fetch("/api/gcash/pending", {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      if (!response.ok) throw new Error("Failed to fetch pending GCash payments");
      return response.json();
    }
  });

  const { data: messages } = useQuery({
    queryKey: ["/api/contact"],
    enabled: isAuthenticated && isAdmin && !!sessionId,
    queryFn: async () => {
      const response = await fetch("/api/contact?limit=10", {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    }
  });

  const verifyGCashPayment = async (paymentId: string, status: "verified" | "rejected") => {
    try {
      await fetch(`/api/gcash/${paymentId}/verify`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}` 
        },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      
      toast({
        title: "Payment Updated",
        description: `Payment ${status === "verified" ? "approved" : "rejected"} successfully.`,
      });
      
      // Refetch data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-admin-dashboard-title">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage system users and monitor activity</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" data-testid="status-system-online">System Online</Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Donations</p>
                  <p className="text-2xl font-bold" data-testid="text-total-donations">
                    ${stats?.totalDonations?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Donation Count</p>
                  <p className="text-2xl font-bold" data-testid="text-donation-count">
                    {stats?.donationCount || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Messages</p>
                  <p className="text-2xl font-bold" data-testid="text-pending-messages">
                    {stats?.pendingMessages || 0}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending GCash</p>
                  <p className="text-2xl font-bold" data-testid="text-pending-gcash">
                    {stats?.pendingGCashPayments || 0}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Donations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {donations?.slice(0, 5).map((donation: any) => (
                  <div key={donation.id} className="flex justify-between items-center p-3 bg-muted rounded" data-testid={`donation-${donation.id}`}>
                    <div>
                      <div className="font-medium">{donation.donorName || "Anonymous"}</div>
                      <div className="text-sm text-muted-foreground">
                        {donation.paymentMethod} • {new Date(donation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-secondary">${donation.amount}</div>
                      <Badge variant={donation.status === "completed" ? "default" : "secondary"}>
                        {donation.status}
                      </Badge>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground py-4">No donations found</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* GCash Payment Verification */}
          <Card>
            <CardHeader>
              <CardTitle>GCash Verification Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingGCash?.map((payment: any) => (
                  <div key={payment.id} className="border border-border rounded-lg p-4" data-testid={`gcash-payment-${payment.id}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium">Reference: {payment.referenceNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          Amount: ₱{payment.amount} • {payment.senderNumber}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">₱{payment.amount}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => verifyGCashPayment(payment.id, "verified")}
                        className="bg-secondary hover:bg-secondary/90"
                        data-testid={`button-approve-${payment.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => verifyGCashPayment(payment.id, "rejected")}
                        data-testid={`button-reject-${payment.id}`}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground py-4">No pending payments</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
