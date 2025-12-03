import React, { JSX, useEffect, useMemo, useState } from "react";

/* ============================
   Constants & Types (UPDATED for simplified display)
   ============================ */
// Internal calculation still uses the precise price per book for accuracy
const PLAN_PRICES = {
  "1 Book": 199, // Removed (₹199)
  "3 Books": 499 / 3, 
  "6 Books": 999 / 6, 
  "12 Books": 1999 / 12, 
} as const;

type PlanKey = keyof typeof PLAN_PRICES;

interface PricingPlan {
  title: string;
  price: string; // Simplified price display
  details: string; // Simplified details
  discount: string;
  value: PlanKey;
}

// Updated pricing plan details for much simpler display
const PRICING_PLANS: PricingPlan[] = [
  { title: "Single Book", price: "₹199", details: "1 assignment · no diagrams", discount: "Base Price", value: "1 Book" },
  { title: "3 Books Pack", price: "₹499 Total", details: "Up to 3 assignments · Great Value", discount: "-25%", value: "3 Books" },
  { title: "6 Books Pack", price: "₹999 Total", details: "1–6 assignments · Maximum Savings", discount:"-33%", value: "6 Books" },
  { title: "12 Books Pack", price: "₹1999 Total", details: "1–12 assignments · Ultimate Plan", discount: "-40%", value: "12 Books" },
];

const MIN_PAGES_PER_BOOK = 1;
const DIAGRAM_MARKUP_PERCENTAGE = 0.2; // 20%
const KEYCHAIN_THRESHOLD_BASE_PRICE = 499;

// Coupon constants
const COUPON_CODE = "abhijeet";
const COUPON_DISCOUNT = 0.50; // 50%

interface FormState {
  name: string;
  phone: string;
  college: string;
  className: string;
  subject: string;
  pages: number;
  file: File | null;
  notes: string;
  address: string;
  plan: PlanKey;
  withDiagrams: boolean;
  couponCode: string; 
}

/* ====================
   Small Reusable UI (unchanged)
   ==================== */

const InputField = (props: {
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  min?: number;
  error?: string | null;
}) => {
  const { name, value, onChange, placeholder = "", required = false, type = "text", min, error } = props;
  return (
    <div className="input-container">
      <input
        name={name}
        value={value as any}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
        min={min}
        className={`input-field ${error ? "input-error-border" : ""}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-err` : undefined}
      />
      {error && <div id={`${name}-err`} className="input-error-text">{error}</div>}
    </div>
  );
};

const SelectField = (props: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  error?: string | null;
}) => {
  const { name, value, onChange, options, error } = props;
  return (
    <div className="input-container">
      <select name={name} value={value} onChange={onChange} className={`select-field ${error ? "input-error-border" : ""}`} aria-invalid={!!error}>
        {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
      </select>
      {error && <div className="input-error-text">{error}</div>}
    </div>
  );
};

const PricingCard = (props: {
  title: string;
  price: string;
  details: string;
  discount: string;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const { title, price, details, discount, isSelected, onClick } = props;
  return (
    <button type="button" className={`pricing-card ${isSelected ? "pricing-card-selected" : ""}`} onClick={onClick} aria-pressed={isSelected}>
      <div className="pricing-card-inner">
        <h4 className="pricing-card-title">{title}</h4>
        <div className="pricing-card-price">{price}</div>
        <div className="pricing-card-details">{details}</div>
        <div className="pricing-card-discount">{discount}</div>
      </div>
    </button>
  );
};

/* =========================
   Main Component (Refined & UPDATED)
   ========================= */

export default function NotebookCompleteApp(): JSX.Element {
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    college: "",
    className: "",
    subject: "",
    pages: 1,
    file: null,
    notes: "",
    address: "",
    plan: "1 Book", // Updated key
    withDiagrams: false,
    couponCode: "", 
  });

  const [quote, setQuote] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check and apply coupon
  const isCouponApplied = useMemo(() => {
    return form.couponCode.toLowerCase() === COUPON_CODE;
  }, [form.couponCode]);
  
  // Calculate base price before diagrams and coupon
  const basePricePerBook = PLAN_PRICES[form.plan] ?? 199;
  const initialBasePrice = basePricePerBook * form.pages;

  // Calculate final estimated price
  const estimatedPrice = useMemo(() => {
    // 1. Calculate price with diagrams markup
    const markupPrice = initialBasePrice * (form.withDiagrams ? (1 + DIAGRAM_MARKUP_PERCENTAGE) : 1);

    // 2. Apply coupon discount if valid
    let finalPrice = markupPrice;
    if (isCouponApplied) {
      finalPrice = Math.round(markupPrice * (1 - COUPON_DISCOUNT));
    }

    return finalPrice;
  }, [initialBasePrice, form.withDiagrams, isCouponApplied]);
  
  // Check for free key chain eligibility (based on price *before* coupon)
  const isKeyChainEligible = initialBasePrice >= KEYCHAIN_THRESHOLD_BASE_PRICE;


  useEffect(() => {
    setQuote(estimatedPrice);
  }, [estimatedPrice]);

  // unified change handler (handles file and regular inputs)
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = e.target as HTMLInputElement;
    const { name } = target;
    // clear the field-specific error
    setErrors(prev => ({ ...prev, [name]: null }));

    if (target.type === "file") {
      const files = (target as HTMLInputElement).files;
      if (files && files[0]) setForm(s => ({ ...s, [name]: files[0] } as unknown as FormState));
      else setForm(s => ({ ...s, [name]: null } as unknown as FormState));
      return;
    }

    if (name === "pages") {
      const num = Number(target.value || 0);
      setForm(s => ({ ...s, pages: num }));
      return;
    }
    
    // common update
    setForm(s => ({ ...s, [name]: target.value } as unknown as FormState));
  }

  function handleDiagramToggle(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(s => ({ ...s, withDiagrams: e.target.checked }));
  }

  const validateForm = () => {
    const newErrors: Record<string, string | null> = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!/^\d{10}$/.test(form.phone.trim())) newErrors.phone = "Enter a valid 10-digit phone.";
    if (Number.isNaN(form.pages) || form.pages < MIN_PAGES_PER_BOOK) newErrors.pages = `Pages must be at least ${MIN_PAGES_PER_BOOK}.`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Helper to extract clean plan info for WhatsApp message
  const getPlanInfoForMessage = (planKey: PlanKey) => {
      const basePrice = Math.round(PLAN_PRICES[planKey]);
      if (planKey === "1 Book") return `Plan: ${planKey} (₹${basePrice}/book)`;
      if (planKey === "3 Books") return `Plan: ${planKey} (Total ₹499)`;
      if (planKey === "6 Books") return `Plan: ${planKey} (Total ₹999)`;
      if (planKey === "12 Books") return `Plan: ${planKey} (Total ₹1999)`;
      return `Plan: ${planKey} (Rate: ₹${basePrice}/book)`;
  };


  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);

    const price = estimatedPrice;
    const diagramsMsg = form.withDiagrams ? "YES (+20% markup included)" : "NO (Base price)";
    const couponMsg = isCouponApplied ? `✅ Applied *${COUPON_CODE}* (50% OFF)` : "❌ No coupon applied";
    const keychainMsg = isKeyChainEligible ? `🎁 *FREE Key Chain Included* (Initial Base Price ₹${Math.round(initialBasePrice)})` : "—";
    const planInfo = getPlanInfoForMessage(form.plan);

    const fileMsg = form.file
      ? `📎 File: ${form.file.name}. *Please upload this file in our chat after sending this message.*`
      : "📎 File: None selected. *Please upload your syllabus/content in our chat.*";

    const msg =
      `*NotebookComplete Order*%0A%0A` +
      `👤 Name: ${form.name}%0A📞 Phone: ${form.phone}%0A 🏠 Address: ${form.address || "—"}%0A 🏫 College: ${form.college || "—"}%0A📚 Class: ${form.className || "—"}%0A📘 Subject: ${form.subject || "—"}%0A📄 Books/Assignments: ${form.pages}%0A💸 ${planInfo}%0A🎨 Diagrams/Printouts: ${diagramsMsg}%0A🏷️ Coupon: ${couponMsg}%0A🎁 Freebie: ${keychainMsg}%0A📝 Notes: ${form.notes || "—"}%0A%0A💵 *FINAL Estimated Price: ₹${price}*%0A%0A` +
      `${fileMsg}%0A%0A` +
      `Please confirm availability and final quote.`;

    const whatsappUrl = `https://wa.me/911234567890?text=${msg}`;
    window.open(whatsappUrl, "_blank");

    // small UX delay
    setTimeout(() => setIsSubmitting(false), 1000);
  }

  /* ========================
      Styles (Removed coupon info text)
      ======================== */
  const style = `
  :root{
    --bg: #0f0f0f;
    --card: #1a1a1a;
    --accent: #f59e0b;
    --muted: #d1d5db;
    --focus-ring: rgba(245,158,11,0.25);
  }
  *{box-sizing: border-box}
  body{background: var(--bg); color: white; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; margin:0}
  .max-w-5xl{max-width:80rem;margin:0 auto;padding:1rem}
  .header{display:flex;align-items:center;gap:1rem;padding:1rem 0}
  .logo{width:48px;height:48px;border-radius:12px;background:linear-gradient(180deg,#facc15,#eab308);display:flex;align-items:center;justify-content:center;color:#111;font-weight:800}
  .hero-section{display:grid;grid-template-columns:1fr;gap:1.5rem;background:var(--card);padding:1.75rem;border-radius:12px;box-shadow:0 10px 22px rgba(0,0,0,0.4)}
  @media(min-width:768px){.hero-section{grid-template-columns:1fr 1fr}}
  .hero-text h2{margin:0;font-size:1.7rem;color:#fbbf24}
  .hero-text p{color:var(--muted);margin-top:0.5rem}
  .pricing-section{display:grid;grid-template-columns:repeat(1,1fr);gap:1rem;margin-top:1.25rem}
  @media(min-width:640px){.pricing-section{grid-template-columns:repeat(2,1fr)}}
  @media(min-width:1024px){.pricing-section{grid-template-columns:repeat(4,1fr)}}

  .pricing-card{background:#111;border:1px solid #333;padding:1.1rem;border-radius:12px;cursor:pointer;text-align:left;transition:transform .18s,box-shadow .18s,color .18s}
  .pricing-card:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(245,158,11,0.2)}
  .pricing-card-selected{background:#f59e0b;color:#111;border-color:#fbbf24;transform:scale(1.03)}
  .pricing-card-title{font-weight:700;margin:0 0 .35rem 0}
  .pricing-card-price{font-size:1.25rem;color:#fbbf24;font-weight:800}
  .pricing-card-details{color:#d1d5db;font-size:.9rem;margin-top:.4rem}
  .pricing-card-discount{display:inline-block;margin-top:.6rem;font-size:.78rem;background:#fef3c7;padding:.25rem .5rem;border-radius:8px;color:#92400e}

  .order-section{margin-top:1.75rem;background:#111;padding:2rem;border-radius:14px;box-shadow:0 12px 28px rgba(245,158,11,0.15)}
  .form-container{display:flex;flex-direction:column;gap:1rem}
  
  fieldset{border:0;padding:0;margin:0;display:grid;gap:0.75rem}
  .fieldset-grid-2{grid-template-columns:1fr}
  .fieldset-grid-3{grid-template-columns:1fr}
  @media(min-width:640px){ .fieldset-grid-2{grid-template-columns:repeat(2,1fr)} .fieldset-grid-3{grid-template-columns:repeat(3,1fr)} }

  .input-container{display:flex;flex-direction:column;gap:0.375rem}
  .input-field,.select-field,.textarea-field{
    padding:0.8rem;
    border-radius:10px;
    border:1px solid #333;
    background:#0d0d0d;
    color:white;
    box-shadow:0 2px 6px rgba(245,158,11,0.15);
    transition:box-shadow .15s,border-color .15s,background .15s;
  }
  .input-field:focus,.select-field:focus,.textarea-field:focus{
    outline:none;
    border-color:var(--accent);
    box-shadow:0 0 8px var(--accent);
    background:#1c1c1c;
  }
  .input-error-border{border-color:#ef4444}
  .input-error-text{color:#ef4444;font-size:.82rem}

  .select-field option{
    background:#111;
    color:white;
  }

  .file-upload-label{font-weight:600;color:#fbbf24;margin-bottom:0.35rem}
  .file-input::file-selector-button{
    padding:.55rem 1rem;
    border-radius:999px;
    border:0;
    font-weight:600;
    background:#f59e0b;
    color:#111;
    cursor:pointer;
  }

  .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:0.9rem;border-radius:10px;border:1px solid #333;background:#0d0d0d}
  .toggle-row label{font-weight:600;color:#fbbf24;margin:0}

  .quote-box-prominent{background:#1f1f1f;border:2px solid var(--accent);padding:1.25rem;border-radius:12px;text-align:center}
  .quote-box-prominent span{display:block;font-weight:700;color:#fbbf24}
  .quote-box-prominent strong{display:block;font-size:1.8rem;color:#fde68a;margin-top:.35rem}
  
  .coupon-input-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid #333;
    border-radius: 10px;
    background: #0d0d0d;
    padding: 0.25rem;
  }
  .coupon-input-container input {
    flex-grow: 1;
    border: none;
    background: transparent;
    padding: 0.55rem;
    color: white;
  }
  .coupon-input-container input:focus {
    outline: none;
  }
  .coupon-status {
    padding: 0.35rem 0.75rem;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
  }
  .coupon-applied {
    background: #10b981; /* Green */
    color: #064e3b;
  }
  .coupon-invalid {
    background: #f87171; /* Red */
    color: #7f1d1d;
  }
  .coupon-info { /* This class is now unused but kept in style for safety */
    font-size: .85rem;
    color: #9ca3af;
    margin-left: 0.5rem;
  }

  .submit-button{width:100%;padding:1rem;border-radius:10px;background:var(--accent);color:black;font-weight:800;border:none;cursor:pointer;box-shadow:0 6px #d97706;transition:transform .08s}
  .submit-button:active{transform:translateY(2px)}
  .submit-button:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}

  .footer{margin-top:1.5rem;text-align:center;color:#9ca3af;font-size:.9rem}
  `;

  return (
    <>
      <style>{style}</style>
      <div className="max-w-5xl">
        <header className="header" aria-hidden>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="logo" aria-hidden>NC</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#f59e0b" }}>NotebookComplete</div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>Fast · Neat · Affordable</div>
            </div>
          </div>
        </header>

        <main>
          <section className="hero-section" role="region" aria-labelledby="hero-heading">
            <div className="hero-text">
              <h2 id="hero-heading">Need your books/assignments completed? We do it fast & neatly.</h2>
              <p>Choose your plan, upload details, and get it done — without stress.</p>
              <ul style={{ marginTop: 12, color: "#374151", paddingLeft: 18 }}>
                <li>✔️ Neat handwriting and proper formatting</li>
                <li>✔️ **Optional: Add diagrams/printouts (+20% fee)**</li>
                <li>✔️ Local delivery or WhatsApp photo copy</li>
              </ul>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 520 }}>
                <img
                  alt="neat notebook"
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3"
                  style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 10, border: "1px solid #e6e9ee" }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "https://placehold.co/800x400/f3f4f6/6b7280?text=Neat+Notebook+Placeholder";
                    (e.currentTarget as HTMLImageElement).onerror = null;
                  }}
                />
              </div>
            </div>
          </section>

          <section id="pricing" className="pricing-section" aria-label="Pricing plans">
            {PRICING_PLANS.map((p) => (
              <PricingCard
                key={p.title}
                title={p.title}
                price={p.price}
                details={p.details}
                discount={p.discount}
                isSelected={form.plan === p.value}
                onClick={() => setForm(s => ({ ...s, plan: p.value }))}
              />
            ))}
          </section>

          <section id="order" className="order-section" aria-labelledby="order-heading">
            <h3 id="order-heading" style={{ marginBottom: 8, fontSize: 18, fontWeight: 700 }}>Place your order</h3>

            <form className="form-container" onSubmit={handleSubmit} noValidate>
              {/* Personal Info */}
              <fieldset className="fieldset-grid-2" style={{ marginBottom: 8 }}>
                <InputField name="name" value={form.name} onChange={handleChange} placeholder="Your name (Required)" required error={errors.name} />
                <InputField name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (WhatsApp, 10-digits Required)" type="tel" required error={errors.phone} />
              </fieldset>

              {/* Academic Info */}
              <fieldset className="fieldset-grid-3" style={{ marginBottom: 8 }}>
                <InputField name="college" value={form.college} onChange={handleChange} placeholder="College / School (Optional)" />
                <InputField name="className" value={form.className} onChange={handleChange} placeholder="Class / Year (Optional)" />
                <InputField name="subject" value={form.subject} onChange={handleChange} placeholder="Subject (Optional)" />
              </fieldset>

              {/* Order Details */}
              <fieldset className="fieldset-grid-2" style={{ marginBottom: 8 }}>
                <InputField type="number" name="pages" value={form.pages} onChange={handleChange} placeholder="Number of Books/Assignments (Min 1)" min={MIN_PAGES_PER_BOOK} required error={errors.pages} />
                {/* Select Field is updated to use the simplified keys */}
                <SelectField name="plan" value={form.plan} onChange={handleChange as any} options={Object.keys(PLAN_PRICES)} />
              </fieldset>
              
              <InputField
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Your Address (Optional, for physical delivery)"
              />

              {/* Diagram Toggle */}
              <div className="toggle-row" style={{ marginBottom: 8 }}>
                <label htmlFor="diagram-toggle">Include Diagrams/Printouts (+20% Total Price)</label>
                <input id="diagram-toggle" type="checkbox" name="withDiagrams" checked={form.withDiagrams} onChange={handleDiagramToggle} style={{ width: 18, height: 18, accentColor: "#f59e0b" }} />
              </div>

              {/* Coupon Code Input */}
              <div style={{ marginBottom: 8 }}>
                <label htmlFor="coupon-code" className="file-upload-label" style={{ fontWeight: 400, color: "#d1d5db" }}>
                  Coupon Code
                </label>
                <div className="coupon-input-container">
                  <InputField
                    name="couponCode"
                    value={form.couponCode}
                    onChange={handleChange}
                    placeholder="Enter Coupon Code"
                  />
                  {form.couponCode.length > 0 && (
                    <div className={`coupon-status ${isCouponApplied ? "coupon-applied" : "coupon-invalid"}`}>
                      {isCouponApplied ? "50% OFF Applied" : "Invalid Coupon"}
                    </div>
                  )}
                </div>
              </div>


              {/* File Upload */}
              <div style={{ marginBottom: 8 }}>
                <label htmlFor="file-upload" className="file-upload-label">Upload Syllabus / Content (Optional - max file size 50MB)</label>
                <input id="file-upload" type="file" name="file" onChange={handleChange as any} className="file-input" />
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
                  <strong>Note:</strong> The file will be referenced in your order message. You must manually send the file on WhatsApp after placing the order.
                </div>
              </div>

              {/* Extra Notes */}
              <div>
                <textarea name="notes" value={form.notes} onChange={handleChange as any} placeholder="Any extra notes or requirements (pen color, formatting, delivery)..." className="textarea-field" style={{ width: "100%", borderRadius: 10, padding: 12, minHeight: 96 }} />
              </div>

              {/* Quote and Submit */}
              <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
                <div className="quote-box-prominent" aria-live="polite">
                  <span>Your Estimated Quote:</span>
                  <strong>₹{quote}</strong>
                  {isKeyChainEligible && (
                    <div style={{ color: '#10b981', fontWeight: 700, marginTop: '0.5rem', fontSize: '0.95rem' }}>
                        🎉 FREE Key Chain Included! (Order above ₹{KEYCHAIN_THRESHOLD_BASE_PRICE})
                    </div>
                  )}
                  {isCouponApplied && (
                    <div style={{ color: '#10b981', fontWeight: 700, marginTop: '0.5rem', fontSize: '0.95rem' }}>
                        Discount Applied! Total Saved: ₹{Math.round(initialBasePrice * (form.withDiagrams ? (1 + DIAGRAM_MARKUP_PERCENTAGE) : 1) * COUPON_DISCOUNT)}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button type="submit" disabled={isSubmitting} className="submit-button" aria-busy={isSubmitting}>
                    {isSubmitting ? "Sending..." : `Send Order on WhatsApp (Est. ₹${quote})`}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <footer className="footer">© {new Date().getFullYear()} NotebookComplete — Fast · Neat · Affordable</footer>
        </main>
      </div>
    </>
  );
}
