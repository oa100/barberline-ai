import type { Appearance } from "@clerk/types";

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#C8A55C",
    colorBackground: "#111111",
    colorText: "#F5F0E8",
    colorTextSecondary: "#9A958C",
    colorInputBackground: "#1A1A1A",
    colorInputText: "#F5F0E8",
    borderRadius: "0px",
    fontFamily: "var(--font-dm-sans), sans-serif",
  },
  elements: {
    card: "bg-[#111111] border border-gold/10 shadow-2xl shadow-black/50",
    headerTitle: "text-cream font-serif",
    headerSubtitle: "text-warm-gray",
    formButtonPrimary:
      "bg-gold text-[#0A0A0A] font-semibold uppercase tracking-[0.15em] text-sm hover:bg-gold-light rounded-none",
    formFieldInput:
      "bg-[#1A1A1A] border-gold/10 text-cream placeholder:text-warm-gray/50 rounded-none focus:border-gold/30 focus:ring-gold/10",
    formFieldLabel: "text-warm-gray text-xs uppercase tracking-wider",
    footerActionLink: "text-gold hover:text-gold-light",
    socialButtonsBlockButton:
      "border-gold/10 bg-[#1A1A1A] text-cream hover:bg-gold/5 rounded-none",
    socialButtonsBlockButtonText: "text-cream",
    dividerLine: "bg-gold/10",
    dividerText: "text-warm-gray",
    identityPreview: "bg-[#1A1A1A] border-gold/10",
    identityPreviewText: "text-cream",
    identityPreviewEditButton: "text-gold hover:text-gold-light",
  },
};
