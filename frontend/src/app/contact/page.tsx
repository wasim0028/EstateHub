// src/app/contact/page.tsx

import { ContactForm } from "@/components/ContactForm";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with the EstateHub team — sales, support, or general enquiries.",
};

export default function ContactPage() {
  return (
    <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-2">
          Get in touch
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">Contact us</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Questions about a listing, your account, or partnering with us as an agent? Send us a message and we'll get back to you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact details */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Email</p>
            <a href="mailto:support@estatehub.com" className="text-brand-600 font-medium hover:underline">
              support@estatehub.com
            </a>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Phone</p>
            <a href="tel:+911800123456" className="text-brand-600 font-medium hover:underline">
              1800-123-456
            </a>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Mon–Sat, 9am–7pm IST</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Office</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              EstateHub Realty<br />
              Salt Lake Sector V,<br />
              Kolkata, West Bengal 700091
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
