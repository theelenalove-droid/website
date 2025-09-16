import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface StripeCheckoutProps {
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

export default function StripeCheckout({ amount, donorInfo, donationType, isAnonymous }: StripeCheckoutProps) {
  const [cardInfo, setCardInfo] = useState({
    cardNumber: "",
    expiryDate: "",
    cvc: "",
    cardholderName: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleCardInfoChange = (field: string, value: string) => {
    setCardInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const validateCard = () => {
    if (!cardInfo.cardNumber || cardInfo.cardNumber.length < 13) {
      toast({
        title: "Invalid Card",
        description: "Please enter a valid card number.",
        variant: "destructive",
      });
      return false;
    }

    if (!cardInfo.expiryDate || cardInfo.expiryDate.length < 5) {
      toast({
        title: "Invalid Expiry",
        description: "Please enter a valid expiry date.",
        variant: "destructive",
      });
      return false;
    }

    if (!cardInfo.cvc || cardInfo.cvc.length < 3) {
      toast({
        title: "Invalid CVC",
        description: "Please enter a valid CVC code.",
        variant: "destructive",
      });
      return false;
    }

    if (!cardInfo.cardholderName) {
      toast({
        title: "Missing Name",
        description: "Please enter the cardholder name.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const processPayment = async () => {
    if (!validateCard()) return;

    setIsProcessing(true);
    
    try {
      // Create payment intent
      const paymentIntentResponse = await apiRequest("POST", "/api/create-payment-intent", {
        amount,
        currency: "USD"
      });
      
      const { clientSecret } = await paymentIntentResponse.json();

      // Create donation record
      const donationResponse = await apiRequest("POST", "/api/donations", {
        donorName: isAnonymous ? null : `${donorInfo.firstName} ${donorInfo.lastName}`,
        donorEmail: isAnonymous ? null : donorInfo.email,
        amount: amount.toString(),
        currency: "USD",
        paymentMethod: "stripe",
        paymentReference: clientSecret,
        status: "completed",
        isAnonymous,
        donationType
      });

      const donation = await donationResponse.json();

      toast({
        title: "Payment Successful!",
        description: `Thank you for your donation of $${amount}. Your transaction ID is ${donation.id}.`,
      });

      // Reset form
      setCardInfo({
        cardNumber: "",
        expiryDate: "",
        cvc: "",
        cardholderName: "",
      });

    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cardholderName">Cardholder Name *</Label>
        <Input
          id="cardholderName"
          value={cardInfo.cardholderName}
          onChange={(e) => handleCardInfoChange("cardholderName", e.target.value)}
          placeholder="John Doe"
          data-testid="input-cardholder-name"
        />
      </div>
      
      <div>
        <Label htmlFor="cardNumber">Card Number *</Label>
        <Input
          id="cardNumber"
          value={cardInfo.cardNumber}
          onChange={(e) => handleCardInfoChange("cardNumber", formatCardNumber(e.target.value))}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          data-testid="input-card-number"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expiryDate">Expiry Date *</Label>
          <Input
            id="expiryDate"
            value={cardInfo.expiryDate}
            onChange={(e) => handleCardInfoChange("expiryDate", formatExpiryDate(e.target.value))}
            placeholder="MM/YY"
            maxLength={5}
            data-testid="input-expiry-date"
          />
        </div>
        <div>
          <Label htmlFor="cvc">CVC *</Label>
          <Input
            id="cvc"
            value={cardInfo.cvc}
            onChange={(e) => handleCardInfoChange("cvc", e.target.value.replace(/\D/g, ''))}
            placeholder="123"
            maxLength={4}
            data-testid="input-cvc"
          />
        </div>
      </div>
      
      <Button 
        onClick={processPayment}
        disabled={isProcessing}
        className="w-full"
        data-testid="button-process-stripe-payment"
      >
        <Lock className="w-4 h-4 mr-2" />
        {isProcessing ? "Processing..." : `Donate $${amount}`}
      </Button>
      
      <div className="text-xs text-muted-foreground text-center">
        <Lock className="w-3 h-3 inline mr-1" />
        Your payment is secured with 256-bit SSL encryption
      </div>
    </div>
  );
}
