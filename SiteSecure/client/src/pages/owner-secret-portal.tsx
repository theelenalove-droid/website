import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Key, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function OwnerSecretPortal() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isOwner } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect if already authenticated as owner
    if (isAuthenticated && isOwner) {
      setLocation("/owner-dashboard");
    }
  }, [isAuthenticated, isOwner, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real implementation, you would validate 2FA here
      const success = await login(username, password, "owner");
      if (success) {
        setLocation("/owner-dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-teal-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-secondary text-secondary-foreground w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8" />
          </div>
          <CardTitle className="text-3xl mb-2">Owner Portal</CardTitle>
          <p className="text-muted-foreground">Executive access and control</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="ownerUsername">Owner Credentials</Label>
              <Input
                id="ownerUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1"
                data-testid="input-owner-username"
              />
            </div>
            
            <div>
              <Label htmlFor="ownerPassword">Master Password</Label>
              <Input
                id="ownerPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                data-testid="input-owner-password"
              />
            </div>
            
            <div>
              <Label htmlFor="twoFactorCode">2FA Code</Label>
              <Input
                id="twoFactorCode"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="mt-1"
                data-testid="input-owner-2fa"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              disabled={isLoading}
              data-testid="button-owner-login"
            >
              <Key className="w-4 h-4 mr-2" />
              {isLoading ? "Authenticating..." : "Access Owner Portal"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Multi-factor authentication required</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
