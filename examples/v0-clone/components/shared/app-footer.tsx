"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Linkedin, MessageSquare } from "lucide-react";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Workspace", href: "/workspace" },
      { label: "Projects", href: "/projects" },
      { label: "Templates", href: "/templates" },
      { label: "Pricing", href: "/billing" }
    ]
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Vibe Hub", href: "/hub" },
      { label: "Documentation", href: "/docs" },
      { label: "Support", href: "/support" }
    ]
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
      { label: "Cookie Settings", href: "#" }
    ]
  },
  community: {
    title: "Community",
    links: [
      { label: "Discord", href: "https://discord.gg/aiwa", external: true },
      { label: "Twitter/X", href: "https://x.com/aiwa", external: true },
      { label: "GitHub", href: "https://github.com/aiwa", external: true },
      {
        label: "LinkedIn",
        href: "https://linkedin.com/company/aiwa",
        external: true
      }
    ]
  }
};

const socialLinks = [
  { icon: Twitter, href: "https://x.com/aiwa", label: "Twitter" },
  { icon: Github, href: "https://github.com/aiwa", label: "GitHub" },
  {
    icon: Linkedin,
    href: "https://linkedin.com/company/aiwa",
    label: "LinkedIn"
  },
  { icon: MessageSquare, href: "https://discord.gg/aiwa", label: "Discord" }
];

export function AppFooter() {
  return (
    <footer className="relative w-full border-t border-white/[0.08] bg-black/95">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Logo & Tagline */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <div className="relative h-10 w-24">
                <Image
                  src="/aiwa.webp"
                  alt="AIWA"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-white/60">
              Vibe-code your imagination. Bring it to life with AIWA.
            </p>

            {/* Social Links */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4 text-white/60" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">
              {footerLinks.product.title}
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">
              {footerLinks.resources.title}
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">
              {footerLinks.legal.title}
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">
              {footerLinks.community.title}
            </h3>
            <ul className="space-y-3">
              {footerLinks.community.links.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-white/[0.08] pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} AIWA. All rights reserved.
            </p>

            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-xs text-white/40 transition-colors hover:text-white/60"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-white/40 transition-colors hover:text-white/60"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
