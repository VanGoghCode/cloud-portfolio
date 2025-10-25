"use client";

import React, { useState } from "react";
import { Section, Button } from "@/components";
import {
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaArrowRight,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

interface ContactProps {
  email?: string;
  location?: string;
}

export default function Contact({
  email = "kirtanthummar.uni@gmail.com",
  location = "Tempe, AZ • [ Open to relocate ]",
}: ContactProps) {
  const socialLinks = [
    {
      platform: "GitHub",
      url: "https://github.com/VanGoghCode",
      icon: <FaGithub className="text-xl" />,
      color: "#333",
      gradient: "from-gray-500 to-gray-700",
    },
    {
      platform: "LinkedIn",
      url: "https://www.linkedin.com/in/kirtankumar-thummar/",
      icon: <FaLinkedin className="text-xl" />,
      color: "#0077B5",
      gradient: "from-blue-500 to-blue-700",
    },
    {
      platform: "X",
      url: "https://x.com",
      icon: <FaXTwitter className="text-xl" />,
      color: "#111111",
      gradient: "from-neutral-500 to-neutral-700",
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/k_.k_thummar/#",
      icon: <FaInstagram className="text-xl" />,
      color: "#E4405F",
      gradient: "from-pink-500 to-orange-500",
    },
  ];
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus("idle"), 5000);
    }, 1500);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Section id="contact" spacing="lg" containerSize="lg">
      <div className="space-y-16">
        {/* Header - Matching About/Projects format */}
        <div className="text-center space-y-6">
          <div className="inline-block">
            <h2
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground"
              style={{ color: "var(--foreground)" }}
            >
              Let&apos;s Connect
            </h2>
            <div className="h-1.5 bg-gradient-to-r from-transparent via-foreground to-transparent rounded-full mt-4"></div>
          </div>
          <p className="text-xl sm:text-2xl text-foreground/60 max-w-3xl mx-auto leading-relaxed">
            Have a project in mind? Let&apos;s collaborate and create something
            amazing together
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Email Card */}
          <a
            href={`mailto:${email}`}
            className="group relative overflow-hidden rounded-3xl p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
            style={{
              background: "rgba(255, 255, 255, 0.4)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <FaEnvelope className="text-3xl text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground/50 mb-1">
                  Email
                </p>
                <p className="font-bold text-foreground group-hover:text-blue-600 transition-colors">
                  {email}
                </p>
              </div>
              <FaArrowRight className="text-foreground/30 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </a>

          {/* Location Card */}
          <div
            className="group relative overflow-hidden rounded-3xl p-8 transition-all duration-300"
            style={{
              background: "rgba(255, 255, 255, 0.4)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-purple-500/10">
                <FaMapMarkerAlt className="text-3xl text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground/50 mb-1">
                  Location
                </p>
                <p className="font-bold text-foreground">{location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-3xl p-8 sm:p-12"
            style={{
              background: "rgba(255, 255, 255, 0.4)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold mb-8 flex items-center gap-3">
              <FaPaperPlane className="text-2xl" />
              Send a Message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name & Email Row */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-foreground/70 mb-2"
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 bg-white/40 border border-white/20 rounded-xl placeholder:text-foreground/30 text-foreground font-medium transition-all duration-300 ease-out focus:outline-none focus:-translate-y-1 focus:shadow-xl focus:shadow-white-500/20 focus:bg-white/60 focus:border-white-500/20"
                    placeholder="Your name "
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-foreground/70 mb-2"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 bg-white/40 border border-white/20 rounded-xl placeholder:text-foreground/30 text-foreground font-medium transition-all duration-300 ease-out focus:outline-none focus:-translate-y-1 focus:shadow-xl focus:shadow-white-500/20 focus:bg-white/60 focus:border-white-500/20"
                    placeholder="Your email address"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-semibold text-foreground/70 mb-2"
                >
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white/40 border border-white/20 rounded-xl placeholder:text-foreground/30 text-foreground font-medium transition-all duration-300 ease-out focus:outline-none focus:-translate-y-1 focus:shadow-xl focus:shadow-white-500/20 focus:bg-white/60 focus:border-white-500/20"
                  placeholder="Project Inquiry"
                />
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold text-foreground/70 mb-2"
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-5 py-4 bg-white/40 border border-white/20 rounded-xl placeholder:text-foreground/30 text-foreground font-medium transition-all duration-300 ease-out focus:outline-none focus:-translate-y-1 focus:shadow-xl focus:shadow-white-500/20 focus:bg-white/60 focus:border-white-500/20"
                  placeholder="Tell me about your project..."
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 rounded-xl font-bold text-lg hover:scale-[1.02] hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group border border-white/20 focus:-translate-y-1 focus:shadow-2xl"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <FaPaperPlane className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </Button>

              {/* Status Messages */}
              {submitStatus === "success" && (
                <div
                  className="p-5 rounded-xl text-center animate-slideIn"
                  style={{
                    background: "rgba(34, 197, 94, 0.15)",
                  }}
                >
                  <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-lg">
                    <span className="text-2xl">✓</span>
                    Message sent successfully!
                  </div>
                  <p className="text-sm mt-2 text-green-600">
                    I&apos;ll get back to you soon
                  </p>
                </div>
              )}

              {submitStatus === "error" && (
                <div
                  className="p-5 rounded-xl text-center animate-slideIn"
                  style={{
                    background: "rgba(239, 68, 68, 0.15)",
                  }}
                >
                  <div className="flex items-center justify-center gap-2 text-red-700 font-bold text-lg">
                    <span className="text-2xl">✗</span>
                    Failed to send message
                  </div>
                  <p className="text-sm mt-2 text-red-600">
                    Please try again later
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Social Links & Availability */}
        <div className="space-y-8">
          {/* Social Links */}
          <div className="text-center space-y-6">
            <h3 className="text-xl font-bold">Connect With Me</h3>
            <div className="flex items-center justify-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-5 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg"
                  style={{
                    background: "rgba(255, 255, 255, 0.4)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                  title={social.platform}
                >
                  <div
                    className="transition-transform group-hover:scale-110 group-hover:rotate-6"
                    style={{ color: social.color }}
                  >
                    {social.icon}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Availability Badge */}
          <div className="flex items-center justify-center">
            <div
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
              style={{
                background: "linear-gradient(to right, #4ade80, #10b981)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "2px solid rgb(255, 255, 255)",
              }}
            >
              <div className="relative flex items-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              <span className="font-semibold text-white">
                OpenToWork – Cloud & Platform roles • Tempe, AZ • open to relocate
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </Section>
  );
}
