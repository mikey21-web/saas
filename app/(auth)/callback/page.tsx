import { RedirectToSignUp } from "@clerk/nextjs";

export default function CallbackPage() {
  // This page handles post-sign-up redirects
  return <RedirectToSignUp />;
}
