"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    question: "How do I check in produce to a cooling unit?",
    answer:
      "Navigate to the Cooling Units section and select the unit you want to check produce into. Click the 'Check In' button, select the farmer and crop type, then add one or more crates with their weights. Once submitted, the produce will appear in the unit's inventory.",
  },
  {
    question: "How do I check out produce from a cooling unit?",
    answer:
      "Open the cooling unit containing the produce and locate the movement you want to check out. Click 'Check Out', select which crates to release, and confirm the checkout. A movement record will be created and you can optionally send an SMS report to the farmer.",
  },
  {
    question: "What is a Digital Twin and how does it work?",
    answer:
      "A Digital Twin is a virtual model of your cooling unit that uses real-time sensor data and AI to simulate storage conditions. It predicts shelf life, quality degradation, and optimal checkout timing for stored produce. It requires at least one connected IoT sensor.",
  },
  {
    question: "How does the marketplace work?",
    answer:
      "As a service provider, you can list produce stored in your cooling units on the marketplace. Buyers can browse available listings, add items to their cart, and place orders. You receive payment directly to your connected bank account upon order completion.",
  },
  {
    question: "How do I invite operators or employees to my organization?",
    answer:
      "Go to Management → Users and select the Operators or Employees tab. Click the 'Invite Operator' or 'Invite Employee' button, enter their email address, and send the invitation. They will receive an email with a link to create their account and join your organization.",
  },
  {
    question: "How do I set up my bank account to receive payments?",
    answer:
      "Navigate to Account → Bank Details. Click 'Add Account', select your bank from the list, enter your 10-digit account number, and submit. The system will verify your account details via Paystack before linking it. You can add multiple accounts.",
  },
  {
    question: "What types of sensors are supported?",
    answer:
      "Coldtivate supports a range of IoT temperature and humidity sensors. Currently integrated sensor sources include Ecozen and other compatible MQTT/HTTP-based sensors. You can test sensor connectivity from the cooling unit settings page and assign sensors to specific units.",
  },
  {
    question: "How do I read and respond to temperature alerts?",
    answer:
      "Temperature alerts appear in your Notifications panel when sensor readings fall outside the configured range for a stored crop. Click the alert to view the affected cooling unit, review the temperature chart, and take action such as adjusting settings or contacting maintenance. You can configure temperature specifications per crop in the cooling unit settings.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-sm font-medium leading-snug">{question}</span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HelpCircle size={20} className="text-green-600" />
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Common questions about using the Coldtivate platform
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {FAQ_ITEMS.map((item) => (
            <FAQItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        Still have questions?{" "}
        <a
          href="mailto:support@coldtivate.com"
          className="text-green-600 hover:underline font-medium"
        >
          Contact support
        </a>
      </p>
    </div>
  );
}
