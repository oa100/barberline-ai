import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "../../clerk-theme";

export default function SignUpPage() {
  return (
    <SignUp afterSignUpUrl="/dashboard/onboarding" appearance={clerkAppearance} />
  );
}
