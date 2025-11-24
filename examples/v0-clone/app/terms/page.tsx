"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Toolbar } from "@/components/shared/toolbar";
import { Footer } from "@/components/shared/footer";
import { Shield, Mail, ArrowRight } from "lucide-react";

const sections = [
  { id: "use-of-services", title: "Use of Services" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "privacy", title: "Privacy" },
  { id: "user-content", title: "User Content" },
  { id: "refund-policy", title: "Refund Policy" },
  { id: "limitation-of-liability", title: "Limitation of Liability" },
  { id: "disclaimer", title: "Disclaimer" },
  { id: "indemnification", title: "Indemnification" },
  { id: "termination", title: "Termination" },
  { id: "governing-law", title: "Governing Law" },
  { id: "changes-to-terms", title: "Changes to Terms" },
  { id: "entire-agreement", title: "Entire Agreement" }
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 100, behavior: "smooth" });
    }
  };

  return (
    <>
      <Toolbar />
      <main className="min-h-screen w-full bg-black/95">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:col-span-3 lg:self-start">
              <motion.div
                className="glass rounded-2xl p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="mb-4 text-lg font-semibold text-white">
                  Table of Contents
                </h2>
                <nav className="space-y-1">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                        activeSection === section.id
                          ? "bg-white/10 font-semibold text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {index + 1}. {section.title}
                    </button>
                  ))}
                </nav>

                <div className="mt-6 border-t border-white/10 pt-6">
                  <h3 className="mb-3 text-sm font-semibold text-white">
                    Related
                  </h3>
                  <Link
                    href="/privacy"
                    className="group flex items-center gap-2 text-sm text-orange-400 transition-colors hover:text-orange-300"
                  >
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    Privacy Policy
                  </Link>
                </div>
              </motion.div>
            </aside>

            {/* Main Content */}
            <article className="lg:col-span-9">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {/* Header */}
                <div className="mb-12">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2">
                    <Shield className="size-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-400">
                      Legal Document
                    </span>
                  </div>
                  <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
                    Terms of Service
                  </h1>
                  <p className="text-lg text-white/60">
                    Last Updated: {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Introduction */}
                <section className="mb-12">
                  <div className="glass rounded-2xl p-8">
                    <p className="text-base leading-relaxed text-white/80">
                      Welcome to AIWA. By accessing or using our AI-powered web
                      application platform, vibe-coding tools, or website, you
                      agree to be bound by these Terms of Service. Please read
                      them carefully.
                    </p>
                  </div>
                </section>

                {/* Section 1 */}
                <section id="use-of-services" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        1
                      </span>
                      Use of Services
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>By using AIWA, you agree to:</p>
                      <ul className="ml-6 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Use our services only for lawful purposes and in
                            accordance with these Terms
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Not use our services to generate harmful, illegal,
                            or malicious content
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Not attempt to reverse engineer, decompile, or
                            discover the source code of our platform
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Maintain the confidentiality of your account
                            credentials
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 2 */}
                <section
                  id="intellectual-property"
                  className="mb-12 scroll-mt-24"
                >
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        2
                      </span>
                      Intellectual Property
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        All content, features, and functionality of AIWA,
                        including but not limited to software, text, graphics,
                        logos, and code, are owned by AIWA and protected by
                        international copyright, trademark, and other
                        intellectual property laws.
                      </p>
                      <p>
                        You retain ownership of any applications, websites, or
                        content you create using AIWA. However, you grant AIWA a
                        limited license to process and display your content as
                        necessary to provide our services.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 3 */}
                <section id="privacy" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        3
                      </span>
                      Privacy
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        Your privacy is important to us. Our Privacy Policy
                        explains how we collect, use, and protect your personal
                        information. By using AIWA, you consent to our data
                        practices as described in our{" "}
                        <Link
                          href="/privacy"
                          className="text-orange-400 underline hover:text-orange-300"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 4 */}
                <section id="user-content" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        4
                      </span>
                      User Content
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        You are solely responsible for any content,
                        applications, or websites you create using AIWA. You
                        represent and warrant that:
                      </p>
                      <ul className="ml-6 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            You own or have the necessary rights to all content
                            you input
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Your content does not infringe on any third-party
                            rights
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Your content complies with all applicable laws and
                            regulations
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 5 */}
                <section id="refund-policy" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        5
                      </span>
                      Refund Policy
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        Subscription fees are non-refundable except as required
                        by law or as explicitly stated in our refund policy.
                        Credit purchases are final and non-refundable once
                        consumed.
                      </p>
                      <p>
                        If you believe you have been charged in error, please
                        contact our support team within 7 days of the charge.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 6 */}
                <section
                  id="limitation-of-liability"
                  className="mb-12 scroll-mt-24"
                >
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        6
                      </span>
                      Limitation of Liability
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        To the maximum extent permitted by law, AIWA shall not
                        be liable for any indirect, incidental, special,
                        consequential, or punitive damages, including loss of
                        profits, data, or goodwill, arising from your use of our
                        services.
                      </p>
                      <p>
                        Our total liability shall not exceed the amount you paid
                        to AIWA in the 12 months preceding the claim.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 7 */}
                <section id="disclaimer" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        7
                      </span>
                      Disclaimer
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        AIWA is provided "as is" and "as available" without
                        warranties of any kind, either express or implied. We do
                        not guarantee that our services will be uninterrupted,
                        secure, or error-free.
                      </p>
                      <p>
                        AI-generated code may contain errors or security
                        vulnerabilities. You are responsible for reviewing,
                        testing, and validating all generated code before
                        deployment.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 8 */}
                <section id="indemnification" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        8
                      </span>
                      Indemnification
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        You agree to indemnify and hold harmless AIWA and its
                        affiliates from any claims, damages, losses,
                        liabilities, and expenses arising from:
                      </p>
                      <ul className="ml-6 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>Your use of our services</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>Your violation of these Terms</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>Your violation of any third-party rights</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 9 */}
                <section id="termination" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        9
                      </span>
                      Termination
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        We reserve the right to terminate or suspend your access
                        to AIWA at any time, without notice, for conduct that we
                        believe violates these Terms or is harmful to other
                        users, us, or third parties.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 10 */}
                <section id="governing-law" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        10
                      </span>
                      Governing Law
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        These Terms shall be governed by and construed in
                        accordance with the laws of the State of Delaware,
                        United States, without regard to its conflict of law
                        principles.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 11 */}
                <section id="changes-to-terms" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        11
                      </span>
                      Changes to Terms
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        We reserve the right to modify these Terms at any time.
                        Changes will be effective immediately upon posting. Your
                        continued use of AIWA constitutes acceptance of the
                        updated Terms.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 12 */}
                <section id="entire-agreement" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        12
                      </span>
                      Entire Agreement
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        These Terms constitute the entire agreement between you
                        and AIWA regarding your use of our services and
                        supersede all prior agreements.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Contact */}
                <section className="mb-12">
                  <div className="glass-strong rounded-2xl p-8">
                    <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
                      <div className="flex-shrink-0">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-500">
                          <Mail className="size-7 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-bold text-white">
                          Questions About These Terms?
                        </h3>
                        <p className="mb-3 text-base text-white/70">
                          If you have any questions, please contact us.
                        </p>
                        <a
                          href="mailto:support@aiwa.app"
                          className="group inline-flex items-center gap-2 font-semibold text-orange-400 transition-colors hover:text-orange-300"
                        >
                          <span>support@aiwa.app</span>
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Acceptance */}
                <section>
                  <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-purple-500/20 p-8 backdrop-blur-xl">
                    <p className="text-center text-base leading-relaxed text-white/90">
                      By using AIWA, you acknowledge that you have read,
                      understood, and agree to be bound by these Terms of
                      Service.
                    </p>
                  </div>
                </section>
              </motion.div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
