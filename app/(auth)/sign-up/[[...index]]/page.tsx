import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0c0d' }}>
      <SignUp
        redirectUrl="/dashboard"
        appearance={{
          baseTheme: undefined,
          elements: {
            rootBox: "w-full max-w-md",
            card: "bg-transparent",
            headerTitle: "text-white text-2xl font-bold",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton: "bg-[#161618] border border-[rgba(255,255,255,0.1)] text-white hover:bg-[#1a1a1d]",
            formButtonPrimary: "bg-[#e879f9] hover:bg-[#d565e8] text-black",
            otherMethodsOuterIdentifier: "text-gray-400",
            dividerLine: "bg-[rgba(255,255,255,0.08)]",
            dividerText: "text-gray-500",
            formFieldInput: "bg-[#161618] border-[rgba(255,255,255,0.08)] text-white",
            footerActionLink: "text-[#e879f9] hover:text-[#d565e8]",
          },
        }}
      />
    </div>
  );
}
