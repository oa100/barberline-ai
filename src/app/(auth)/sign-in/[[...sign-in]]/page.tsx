import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "../../clerk-theme";

export default function SignInPage() {
  return <SignIn afterSignInUrl="/dashboard" appearance={clerkAppearance} />;
}
