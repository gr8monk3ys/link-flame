"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/providers/CartProvider";
import { LoadingShimmer } from "@/components/ui/loading-shimmer";

export default function CheckoutForm() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    paymentMethod: "credit-card",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Create order in the database
      const orderData = {
        ...formData,
        items: cart.items,
        total: cartTotal.raw,
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      // Clear the cart after successful checkout
      clearCart();
      
      // Redirect to order confirmation page
      router.push("/order-confirmation");
    } catch (error) {
      console.error("Error submitting form:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          type="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          type="text"
          id="address"
          value={formData.address}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            type="text"
            id="city"
            value={formData.city}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            type="text"
            id="state"
            value={formData.state}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP code</Label>
          <Input
            type="text"
            id="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <div className="grid grid-cols-4 gap-2">
          <Button 
            type="button" 
            variant={formData.paymentMethod === "credit-card" ? "default" : "outline"}
            onClick={() => setFormData(prev => ({ ...prev, paymentMethod: "credit-card" }))}
            disabled={isLoading}
            className="flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 size-4">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
            Card
          </Button>
          <Button 
            type="button" 
            variant={formData.paymentMethod === "paypal" ? "default" : "outline"}
            onClick={() => setFormData(prev => ({ ...prev, paymentMethod: "paypal" }))}
            disabled={isLoading}
          >
            PayPal
          </Button>
          <Button 
            type="button" 
            variant={formData.paymentMethod === "apple-pay" ? "default" : "outline"}
            onClick={() => setFormData(prev => ({ ...prev, paymentMethod: "apple-pay" }))}
            disabled={isLoading}
          >
            Apple Pay
          </Button>
          <Button 
            type="button" 
            variant={formData.paymentMethod === "google-pay" ? "default" : "outline"}
            onClick={() => setFormData(prev => ({ ...prev, paymentMethod: "google-pay" }))}
            disabled={isLoading}
          >
            Google Pay
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push("/cart")}
          disabled={isLoading}
        >
          Back to cart
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Complete Order"}
        </Button>
      </div>
    </form>
  );
}
