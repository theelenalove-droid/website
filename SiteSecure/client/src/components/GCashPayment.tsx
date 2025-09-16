import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, Info, CheckCircle } from "lucide-react";

interface GCashPaymentProps {
  amount: number;
  donorInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  donationType: string;
  isAnonymous: boolean;
}

export default function GCashPayment({ amount, donorInfo, donationType, isAnonymous }: GCashPaymentProps) {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  // Convert USD to PHP (approximate rate)
  const phpAmount = Math.round(amount * 55); // Approximate USD to PHP conversion
  const gcashRecipient = "09123456789"; // This would be your actual GCash number

  const validateForm = () => {
    if (!referenceNumber || referenceNumber.length < 10) {
      toast({
        title: "Invalid Reference",
        description: "Please enter a valid GCash reference number.",
        variant: "destructive",
      });
      return false;
    }

    if (!senderNumber || senderNumber.length < 11) {
      toast({
        title: "Invalid Number",
        description: "Please enter a valid sender phone number.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const submitPayment = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Create donation record first
      const donationResponse = await apiRequest("POST", "/api/donations", {
        donorName: isAnonymous ? null : `${donorInfo.firstName} ${donorInfo.lastName}`,
        donorEmail: isAnonymous ? null : donorInfo.email,
        amount: amount.toString(),
        currency: "USD",
        paymentMethod: "gcash",
        paymentReference: referenceNumber,
        status: "pending",
        isAnonymous,
        donationType
      });

      const donation = await donationResponse.json();

      // Submit GCash payment for verification
      await apiRequest("POST", "/api/gcash/submit", {
        donationId: donation.id,
        referenceNumber,
        amount: phpAmount,
        senderNumber
      });

      setIsSubmitted(true);
      
      toast({
        title: "Payment Submitted!",
        description: "Your GCash payment has been submitted for verification. You will receive confirmation within 24 hours.",
      });

    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your payment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Submitted Successfully!</h3>
          <p className="text-green-700 mb-4">
            Your GCash payment has been submitted for manual verification. 
            You will receive a confirmation email within 24 hours.
          </p>
          <p className="text-sm text-green-600">
            Reference: {referenceNumber}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800">GCash Payment Instructions</span>
          </div>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Open your GCash app</li>
            <li>Go to "Send Money" and select "Send to Mobile Number"</li>
            <li>Enter recipient: <strong className="text-blue-900">{gcashRecipient}</strong></li>
            <li>Enter amount: <strong className="text-blue-900">₱{phpAmount.toLocaleString()} (~${amount} USD)</strong></li>
            <li>Add message: "SiteSecure Donation - {donorInfo.firstName || 'Anonymous'}"</li>
            <li>Complete the transaction and enter the reference number below</li>
          </ol>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="senderNumber">Your GCash Number *</Label>
          <Input
            id="senderNumber"
            value={senderNumber}
            onChange={(e) => setSenderNumber(e.target.value)}
            placeholder="09XX XXX XXXX"
            data-testid="input-sender-number"
          />
        </div>

        <div>
          <Label htmlFor="referenceNumber">GCash Reference Number *</Label>
          <Input
            id="referenceNumber"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="Enter the reference number from your GCash transaction"
            data-testid="input-gcash-reference"
          />
        </div>

        <Button 
          onClick={submitPayment}
          disabled={isSubmitting}
          className="w-full"
          data-testid="button-submit-gcash-payment"
        >
          <Smartphone className="w-4 h-4 mr-2" />
          {isSubmitting ? "Submitting..." : "Submit GCash Payment"}
        </Button>
      </div>

      {/* Manual Verification Notice */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-yellow-600 mt-1" />
            <div className="text-sm">
              <p className="text-yellow-800">
                <strong>Manual Verification:</strong> GCash payments are verified manually by our team. 
                You will receive a confirmation email within 24 hours once your payment is verified.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
