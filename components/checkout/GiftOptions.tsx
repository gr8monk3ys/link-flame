"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gift, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GiftOptionsData {
  isGift: boolean;
  giftMessage: string;
  giftRecipientName: string;
  giftRecipientEmail: string;
  hidePrice: boolean;
}

interface GiftOptionsProps {
  value: GiftOptionsData;
  onChange: (data: GiftOptionsData) => void;
  disabled?: boolean;
  className?: string;
}

const MAX_MESSAGE_LENGTH = 500;

export function GiftOptions({
  value,
  onChange,
  disabled = false,
  className,
}: GiftOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(value.isGift);

  const handleIsGiftChange = (checked: boolean) => {
    setIsExpanded(checked);
    onChange({
      ...value,
      isGift: checked,
      // Reset gift options if unchecking
      ...(checked
        ? {}
        : {
            giftMessage: "",
            giftRecipientName: "",
            giftRecipientEmail: "",
            hidePrice: false,
          }),
    });
  };

  const handleFieldChange = (
    field: keyof Omit<GiftOptionsData, "isGift">,
    fieldValue: string | boolean
  ) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  const messageLength = value.giftMessage.length;
  const isNearLimit = messageLength >= MAX_MESSAGE_LENGTH - 50;
  const isAtLimit = messageLength >= MAX_MESSAGE_LENGTH;

  return (
    <div className={cn("rounded-lg border p-4", className)}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="isGift"
            checked={value.isGift}
            onCheckedChange={handleIsGiftChange}
            disabled={disabled}
            aria-describedby="gift-description"
          />
          <div className="flex items-center space-x-2">
            <Gift className="size-5 text-muted-foreground" aria-hidden="true" />
            <Label
              htmlFor="isGift"
              className="cursor-pointer text-sm font-medium"
            >
              This order is a gift
            </Label>
          </div>
        </div>
        {value.isGift && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={isExpanded}
            aria-controls="gift-options-panel"
            disabled={disabled}
          >
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
            <span className="sr-only">
              {isExpanded ? "Collapse gift options" : "Expand gift options"}
            </span>
          </button>
        )}
      </div>
      <p id="gift-description" className="ml-7 mt-1 text-xs text-muted-foreground">
        Add a gift message and recipient details
      </p>

      {/* Expandable gift options panel */}
      {value.isGift && isExpanded && (
        <div
          id="gift-options-panel"
          className="mt-4 space-y-4 border-t pt-4 duration-200 animate-in fade-in-50 slide-in-from-top-2"
        >
          {/* Recipient Name */}
          <div className="space-y-2">
            <Label htmlFor="giftRecipientName" className="text-sm">
              Recipient Name
            </Label>
            <Input
              id="giftRecipientName"
              type="text"
              placeholder="Who is this gift for?"
              value={value.giftRecipientName}
              onChange={(e) =>
                handleFieldChange("giftRecipientName", e.target.value)
              }
              disabled={disabled}
              maxLength={100}
              className="text-sm"
            />
          </div>

          {/* Gift Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="giftMessage" className="text-sm">
                Gift Message
              </Label>
              <span
                className={cn(
                  "text-xs",
                  isAtLimit
                    ? "text-red-500"
                    : isNearLimit
                    ? "text-yellow-600"
                    : "text-muted-foreground"
                )}
                aria-live="polite"
              >
                {messageLength}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <Textarea
              id="giftMessage"
              placeholder="Write a personal message to include with this gift..."
              value={value.giftMessage}
              onChange={(e) => {
                // Enforce max length on input
                const newValue = e.target.value.slice(0, MAX_MESSAGE_LENGTH);
                handleFieldChange("giftMessage", newValue);
              }}
              disabled={disabled}
              maxLength={MAX_MESSAGE_LENGTH}
              className="min-h-[100px] resize-none text-sm"
              aria-describedby="gift-message-hint"
            />
            <p
              id="gift-message-hint"
              className="text-xs text-muted-foreground"
            >
              This message will be printed on a gift card included with the
              order.
            </p>
          </div>

          {/* Recipient Email (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="giftRecipientEmail" className="text-sm">
              Recipient Email{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="giftRecipientEmail"
              type="email"
              placeholder="recipient@example.com"
              value={value.giftRecipientEmail}
              onChange={(e) =>
                handleFieldChange("giftRecipientEmail", e.target.value)
              }
              disabled={disabled}
              className="text-sm"
              aria-describedby="recipient-email-hint"
            />
            <p
              id="recipient-email-hint"
              className="text-xs text-muted-foreground"
            >
              We will send them a notification when the gift ships.
            </p>
          </div>

          {/* Hide Price Option */}
          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="hidePrice"
              checked={value.hidePrice}
              onCheckedChange={(checked) =>
                handleFieldChange("hidePrice", checked === true)
              }
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label
                htmlFor="hidePrice"
                className="cursor-pointer text-sm font-medium"
              >
                Hide prices on packing slip
              </Label>
              <p className="text-xs text-muted-foreground">
                Prices will not be shown on the packing slip included with the
                shipment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GiftOptions;
