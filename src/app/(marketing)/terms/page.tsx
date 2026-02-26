import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | BarberLine AI",
  description:
    "Read the terms and conditions governing your use of BarberLine AI services.",
};

export default function TermsOfServicePage() {
  return (
    <section className="relative py-28">
      <div className="container relative mx-auto px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.1em] text-gold">
            Legal
          </span>
          <h1 className="mt-4 font-sans font-bold text-4xl tracking-tight sm:text-5xl text-cream">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-warm-gray">
            Effective Date: February 26, 2026
          </p>
          <div className="gold-line mx-auto mt-8 w-24" />
        </div>

        {/* Body */}
        <div className="mx-auto mt-16 max-w-3xl">
          <p className="text-sm leading-relaxed text-warm-gray">
            These Terms of Service (&quot;Terms&quot;) govern your access to and
            use of the BarberLine AI platform and services (&quot;Service&quot;)
            operated by BarberLine AI (&quot;we,&quot; &quot;us,&quot; or
            &quot;our&quot;). By creating an account or using our Service, you
            agree to be bound by these Terms. If you do not agree to these
            Terms, do not use our Service.
          </p>

          {/* 1. Acceptance of Terms */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            1. Acceptance of Terms
          </h2>
          <p className="text-sm leading-relaxed text-warm-gray">
            By accessing or using BarberLine AI, you confirm that you are at
            least 18 years old, have the legal authority to enter into these
            Terms, and agree to comply with all applicable laws and regulations.
            If you are using the Service on behalf of a business, you represent
            that you have the authority to bind that business to these Terms.
          </p>

          {/* 2. Service Description */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            2. Service Description
          </h2>
          <p className="text-sm leading-relaxed text-warm-gray">
            BarberLine AI is a software-as-a-service (SaaS) platform that
            provides AI-powered phone receptionist services for barbershops. Our
            Service includes:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-warm-gray">
            <li>
              An AI voice assistant that answers incoming phone calls on behalf
              of your barbershop
            </li>
            <li>
              Automated appointment booking through integration with your Square
              account
            </li>
            <li>SMS booking confirmations sent to your customers</li>
            <li>Call transcripts, logs, and analytics dashboard</li>
            <li>
              A dedicated phone number for your barbershop&apos;s AI
              receptionist
            </li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-warm-gray">
            We reserve the right to modify, suspend, or discontinue any part of
            the Service at any time, with or without notice. We will make
            reasonable efforts to notify you of material changes.
          </p>

          {/* 3. Account Registration */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            3. Account Registration
          </h2>
          <p className="text-sm leading-relaxed text-warm-gray">
            To use BarberLine AI, you must create an account and provide
            accurate, complete information. You are responsible for maintaining
            the confidentiality of your account credentials and for all
            activities that occur under your account. You agree to notify us
            immediately of any unauthorized use of your account. We reserve the
            right to suspend or terminate accounts that contain inaccurate
            information or that we reasonably believe are being used in violation
            of these Terms.
          </p>

          {/* 4. Free Trial and Billing */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            4. Free Trial and Billing
          </h2>
          <p className="text-sm leading-relaxed text-warm-gray">
            We offer a 14-day free trial for new accounts. During the trial
            period, you will have access to the Service without charge. At the
            end of the trial, you must select a paid subscription plan to
            continue using the Service.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-warm-gray">
            Our subscription plans range from $49 to $99 per month, depending on
            the features and usage limits you select. By subscribing to a paid
            plan, you authorize us to charge the applicable subscription fee to
            your designated payment method on a recurring monthly basis.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-warm-gray">
            <li>
              All fees are billed in advance on a monthly basis and are
              non-refundable except as required by law.
            </li>
            <li>
              You may cancel your subscription at any time. Cancellation takes
              effect at the end of the current billing period.
            </li>
            <li>
              We reserve the right to change our pricing with at least 30
              days&apos; written notice. Continued use of the Service after a
              price change constitutes acceptance of the new pricing.
            </li>
            <li>
              Failure to pay may result in suspension or termination of your
              account.
            </li>
          </ul>

          {/* 5. AI Service Disclaimer */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            5. AI Service Disclaimer
          </h2>
          <p className="text-sm leading-relaxed text-warm-gray">
            BarberLine AI uses artificial intelligence to handle phone calls and
            book appointments. You acknowledge and agree that:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-warm-gray">
            <li>
              <strong className="text-cream/80">
                AI is not a substitute for human judgment.
              </strong>{" "}
              Our AI assistant may occasionally misinterpret caller requests,
              provide inaccurate information, or make booking errors. You should
              regularly review your bookings and call logs.
            </li>
            <li>
              <strong className="text-cream/80">
                Call recording is required.
              </strong>{" "}
              Our Service records phone calls for the purpose of generating
              transcripts, providing quality assurance, and improving the AI. You
              are responsible for ensuring compliance with all applicable call
              recording laws in your jurisdiction.
            </li>
            <li>
              <strong className="text-cream/80">
                Booking accuracy is your responsibility.
              </strong>{" "}
              You are responsible for maintaining accurate availability, service
              offerings, and pricing in your connected Square account. BarberLine
              AI books appointments based on the information available in your
              Square configuration.
            </li>
            <li>
              <strong className="text-cream/80">
                No guarantee of availability.
              </strong>{" "}
              While we strive for high uptime, the AI service may experience
              interruptions due to maintenance, third-party service outages, or
              unforeseen technical issues.
            </li>
          </ul>

          {/* 6. Your Responsibilities */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            6. Your Responsibilities
          </h2>
          <p className="text-sm leading-relaxed text-warm-gray">
            As a user of BarberLine AI, you agree to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-warm-gray">
            <li>
              Maintain an active and properly configured Square account for
              appointment bookings
            </li>
            <li>
              Keep your barbershop&apos;s service information, availability, and
              barber details up to date
            </li>
            <li>
              Comply with all applicable laws regarding call recording, data
              privacy, and consumer communications in your jurisdiction
            </li>
            <li>
              Not use the Service for any unlawful, fraudulent, or abusive
              purpose
            </li>
            <li>
              Not attempt to reverse-engineer, decompile, or otherwise extract
              the source code of the Service
            </li>
            <li>
              Not interfere with or disrupt the integrity or performance of the
              Service
            </li>
          </ul>

          {/* 7. Intellectual Property */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            7. Intellectual Property
          </h2>
          <p className="text-sm leading-relaxed text-warm-gray">
            All content, features, functionality, software, designs, and
            branding associated with BarberLine AI are and remain the exclusive
            property of BarberLine AI and its licensors. These Terms do not grant
            you any right, title, or interest in the Service except for the
            limited right to use it in accordance with these Terms. You retain
            ownership of any data you provide to us, including your business
            information and customer booking data.
          </p>

          {/* 8. Limitation of Liability */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            8. Limitation of Liability
          </h2>
          <p className="text-sm leading-relaxed text-warm-gray">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS
            PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
            WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY,
            INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
            FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-warm-gray">
            IN NO EVENT SHALL BARBERLINE AI, ITS OFFICERS, DIRECTORS, EMPLOYEES,
            OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO
            LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES, ARISING
            OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE, WHETHER BASED
            ON WARRANTY, CONTRACT, TORT, OR ANY OTHER LEGAL THEORY.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-warm-gray">
            OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF
            OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE
            AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE EVENT
            GIVING RISE TO THE LIABILITY.
          </p>

          {/* 9. Indemnification */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            9. Indemnification
          </h2>
          <p className="text-sm leading-relaxed text-warm-gray">
            You agree to indemnify, defend, and hold harmless BarberLine AI and
            its officers, directors, employees, and agents from and against any
            claims, liabilities, damages, losses, and expenses (including
            reasonable attorneys&apos; fees) arising out of or in connection
            with: (a) your use of the Service; (b) your violation of these
            Terms; (c) your violation of any applicable law or regulation,
            including call recording and data privacy laws; or (d) any dispute
            between you and your customers related to appointments booked
            through the Service.
          </p>

          {/* 10. Termination */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            10. Termination
          </h2>
          <p className="text-sm leading-relaxed text-warm-gray">
            You may cancel your account at any time through your account
            settings or by contacting us. We may suspend or terminate your
            access to the Service at any time, with or without cause, including
            but not limited to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-warm-gray">
            <li>Violation of these Terms</li>
            <li>Non-payment of subscription fees</li>
            <li>Abusive, fraudulent, or illegal use of the Service</li>
            <li>
              Conduct that harms or threatens the security of the Service or
              other users
            </li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-warm-gray">
            Upon termination, your right to use the Service will cease
            immediately. We may retain certain data as required by law or for
            legitimate business purposes. Sections of these Terms that by their
            nature should survive termination will remain in effect, including
            Limitation of Liability, Indemnification, and Governing Law.
          </p>

          {/* 11. Governing Law */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            11. Governing Law and Dispute Resolution
          </h2>
          <p className="text-sm leading-relaxed text-warm-gray">
            These Terms are governed by and construed in accordance with the laws
            of the State of Texas, United States, without regard to its conflict
            of law provisions. Any disputes arising out of or relating to these
            Terms or the Service shall be resolved exclusively in the state or
            federal courts located in Texas, and you consent to the personal
            jurisdiction of such courts.
          </p>

          {/* 12. Changes to These Terms */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            12. Changes to These Terms
          </h2>
          <p className="text-sm leading-relaxed text-warm-gray">
            We reserve the right to update or modify these Terms at any time.
            When we make material changes, we will update the &quot;Effective
            Date&quot; at the top of this page and notify you via email or
            through the Service. Your continued use of the Service after changes
            are posted constitutes your acceptance of the revised Terms. If you
            do not agree to the updated Terms, you must stop using the Service
            and cancel your account.
          </p>

          {/* 13. Miscellaneous */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            13. Miscellaneous
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-warm-gray">
            <li>
              <strong className="text-cream/80">Entire Agreement.</strong> These
              Terms, together with our Privacy Policy, constitute the entire
              agreement between you and BarberLine AI regarding the Service.
            </li>
            <li>
              <strong className="text-cream/80">Severability.</strong> If any
              provision of these Terms is held to be invalid or unenforceable,
              the remaining provisions will remain in full force and effect.
            </li>
            <li>
              <strong className="text-cream/80">Waiver.</strong> Our failure to
              enforce any right or provision of these Terms will not be deemed a
              waiver of such right or provision.
            </li>
            <li>
              <strong className="text-cream/80">Assignment.</strong> You may not
              assign or transfer these Terms without our prior written consent.
              We may assign our rights and obligations without restriction.
            </li>
          </ul>

          {/* 14. Contact Us */}
          <h2 className="mt-12 mb-4 font-sans font-bold text-2xl text-cream">
            14. Contact Us
          </h2>
          <p className="text-sm leading-relaxed text-warm-gray">
            If you have any questions about these Terms of Service, please
            contact us at:
          </p>
          <div className="mt-4 border border-gold/10 bg-card p-6 text-sm leading-relaxed text-warm-gray">
            <p className="text-cream font-sans font-bold">BarberLine AI</p>
            <p className="mt-2">
              Email:{" "}
              <a
                href="mailto:legal@barberlineai.com"
                className="text-gold underline underline-offset-4 hover:text-gold-light"
              >
                legal@barberlineai.com
              </a>
            </p>
            <p className="mt-1">Location: Texas, United States</p>
          </div>
        </div>
      </div>
    </section>
  );
}
