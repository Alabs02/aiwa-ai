"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Toolbar } from "@/components/shared/toolbar";
import { AppFooter } from "@/components/shared/app-footer";
import { Shield, Mail, ArrowRight } from "lucide-react";

const sections = [
  { id: "information-collection", title: "Information We Collect" },
  { id: "how-we-use", title: "How We Use Your Information" },
  { id: "data-sharing", title: "Data Sharing and Disclosure" },
  { id: "data-security", title: "Data Security" },
  { id: "data-retention", title: "Data Retention" },
  { id: "your-rights", title: "Your Rights" },
  { id: "cookies", title: "Cookies and Tracking" },
  { id: "children-privacy", title: "Children's Privacy" },
  { id: "international-transfers", title: "International Data Transfers" },
  { id: "changes-to-policy", title: "Changes to This Policy" }
];

export default function PrivacyPage() {
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
                    href="/terms"
                    className="group flex items-center gap-2 text-sm text-orange-400 transition-colors hover:text-orange-300"
                  >
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    Terms of Service
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
                      Privacy & Security
                    </span>
                  </div>
                  <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
                    Privacy Policy
                  </h1>
                  <p className="text-lg text-white/60">
                    Last Updated: {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Introduction */}
                <section className="mb-12">
                  <div className="glass rounded-2xl p-8">
                    <p className="text-base leading-relaxed text-white/80">
                      At AIWA, we take your privacy seriously. This Privacy
                      Policy explains how we collect, use, disclose, and
                      safeguard your information when you use our AI-powered web
                      application platform.
                    </p>
                  </div>
                </section>

                {/* Section 1 */}
                <section
                  id="information-collection"
                  className="mb-12 scroll-mt-24"
                >
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        1
                      </span>
                      Information We Collect
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <h3 className="text-lg font-semibold text-white">
                        Personal Information
                      </h3>
                      <ul className="ml-6 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Email address and name when you create an account
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Payment information when you subscribe to paid plans
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            GitHub account information if you connect
                            integrations
                          </span>
                        </li>
                      </ul>
                      <h3 className="mt-6 text-lg font-semibold text-white">
                        Usage Data
                      </h3>
                      <ul className="ml-6 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Projects, prompts, and generated code you create
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Usage metrics, analytics, and feature interactions
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Device information, IP address, and browser type
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 2 */}
                <section id="how-we-use" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        2
                      </span>
                      How We Use Your Information
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>We use your information to:</p>
                      <ul className="ml-6 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Provide, maintain, and improve our services
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Process your transactions and manage subscriptions
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>Train and improve our AI models</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Send service updates and marketing communications
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>Detect fraud and ensure platform security</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 3 */}
                <section id="data-sharing" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        3
                      </span>
                      Data Sharing and Disclosure
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>We may share your information with:</p>
                      <ul className="ml-6 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>
                            Service providers (payment processors, hosting,
                            analytics)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>AI model providers for code generation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>Law enforcement when required by law</span>
                        </li>
                      </ul>
                      <p className="mt-4">
                        We do not sell your personal information to third
                        parties.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 4 */}
                <section id="data-security" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        4
                      </span>
                      Data Security
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        We implement industry-standard security measures
                        including encryption, secure servers, and regular
                        security audits. However, no method of transmission over
                        the internet is 100% secure.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 5 */}
                <section id="data-retention" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        5
                      </span>
                      Data Retention
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        We retain your information for as long as your account
                        is active or as needed to provide services. You can
                        request deletion of your data at any time by contacting
                        support.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 6 */}
                <section id="your-rights" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        6
                      </span>
                      Your Rights
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>You have the right to:</p>
                      <ul className="ml-6 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>Access and review your personal data</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>Request correction of inaccurate data</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>Request deletion of your data</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>Opt-out of marketing communications</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-orange-400">•</span>
                          <span>Export your data in a portable format</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 7 */}
                <section id="cookies" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        7
                      </span>
                      Cookies and Tracking
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        We use cookies and similar technologies to enhance your
                        experience, analyze usage, and deliver personalized
                        content. You can manage cookie preferences through your
                        browser settings.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 8 */}
                <section id="children-privacy" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        8
                      </span>
                      Children's Privacy
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        AIWA is not intended for children under 13. We do not
                        knowingly collect personal information from children. If
                        you believe we have collected information from a child,
                        please contact us immediately.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 9 */}
                <section
                  id="international-transfers"
                  className="mb-12 scroll-mt-24"
                >
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        9
                      </span>
                      International Data Transfers
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        Your information may be transferred to and processed in
                        countries other than your own. We ensure appropriate
                        safeguards are in place to protect your data in
                        accordance with this Privacy Policy.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 10 */}
                <section id="changes-to-policy" className="mb-12 scroll-mt-24">
                  <div className="glass rounded-2xl p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg font-bold text-orange-400">
                        10
                      </span>
                      Changes to This Policy
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-white/80">
                      <p>
                        We may update this Privacy Policy from time to time. We
                        will notify you of significant changes via email or
                        through our platform. Your continued use after changes
                        constitutes acceptance.
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
                          Privacy Questions?
                        </h3>
                        <p className="mb-3 text-base text-white/70">
                          Contact our privacy team for any concerns.
                        </p>
                        <a
                          href="mailto:privacy@aiwa.app"
                          className="group inline-flex items-center gap-2 font-semibold text-orange-400 transition-colors hover:text-orange-300"
                        >
                          <span>privacy@aiwa.app</span>
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Notice */}
                <section>
                  <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-purple-500/20 p-8 backdrop-blur-xl">
                    <p className="text-center text-base leading-relaxed text-white/90">
                      By using AIWA, you acknowledge that you have read and
                      understand this Privacy Policy.
                    </p>
                  </div>
                </section>
              </motion.div>
            </article>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
