import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error" | "loading">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage("Thank you! You're on the waitlist.");
        setEmail("");
      } else {
        const d = await res.json().catch(() => null);
        setStatus("error");
        setMessage(
          d?.error ? d.error : "Something went wrong. Please try again."
        );
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 max-w-md mx-auto"
      aria-label="Join waitlist"
    >
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="sm:flex-1"
        disabled={status === "loading"}
        aria-label="Email address"
      />
      <Button
        type="submit"
        size="lg"
        variant="default"
        disabled={status === "loading"}
        className="w-full sm:w-auto"
      >
        {status === "loading" ? "Joining..." : "Join Waitlist"}
      </Button>
      {status !== "idle" && message && (
        <div
          className={`w-full text-sm mt-2 text-center ${
            status === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message}
        </div>
      )}
    </form>
  );
}
