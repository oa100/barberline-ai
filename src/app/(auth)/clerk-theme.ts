import type { Appearance } from "@clerk/types";

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#D97706",
    colorBackground: "var(--card)",
    colorText: "var(--cream)",
    colorTextSecondary: "var(--warm-gray)",
    colorInputBackground: "var(--muted)",
    colorInputText: "var(--cream)",
    borderRadius: "0px",
    fontFamily: "var(--font-dm-sans), sans-serif",
  },
  elements: {
    card: "bg-card border border-gold/10 shadow-2xl shadow-black/50",
    headerTitle: "text-cream font-serif",
    headerSubtitle: "text-warm-gray",
    formButtonPrimary:
      "bg-gold text-primary-foreground font-semibold uppercase tracking-[0.15em] text-sm hover:bg-gold-light rounded-full",
    formFieldInput:
      "bg-muted border-gold/10 text-cream placeholder:text-warm-gray/50 rounded-full focus:border-gold/30 focus:ring-gold/10",
    formFieldLabel: "text-warm-gray text-xs uppercase tracking-wider",
    footerActionLink: "text-gold hover:text-gold-light",
    socialButtonsBlockButton:
      "border-gold/10 bg-muted text-cream hover:bg-gold/5 rounded-full",
    socialButtonsBlockButtonText: "text-cream",
    dividerLine: "bg-gold/10",
    dividerText: "text-warm-gray",
    identityPreview: "bg-muted border-gold/10",
    identityPreviewText: "text-cream",
    identityPreviewEditButton: "text-gold hover:text-gold-light",
  },
};
