import React, { JSX, useEffect, useMemo, useState } from "react";

/* ============================
   Constants & Types 
   ============================ */

// Fixed prices for Book Plans
const BOOK_PLAN_PRICES = {
  "1 Book": 199, 
  "3 Books": 499,
  "6 Books": 999,
  "12 Books": 1999,
} as const;

// New Fixed Price for Project Plan
const PROJECT_PLAN_PRICE = 3999;
const BLACK_BOOK_MARKUP = 850;

// Combined Plans Type
type BookPlanKey = keyof typeof BOOK_PLAN_PRICES;
type ProjectPlanKey = "Project";
type PlanKey = BookPlanKey | ProjectPlanKey;

const PLAN_PRICES: Record<PlanKey, number> = {
    ...BOOK_PLAN_PRICES,
    "Project": PROJECT_PLAN_PRICE
} as const;


interface PricingPlan {
  title: string;
  price: string; 
  details: string; 
  discount: string;
  value: PlanKey;
}

const PRICING_PLANS: PricingPlan[] = [
  { title: "Single Book", price: "₹199 Total", details: "1 assignment · no diagrams", discount: "Base Price", value: "1 Book" },
  { title: "3 Books Pack", price: "₹499 Total", details: "Up to 3 assignments · Great Value", discount: "-25% (per book)", value: "3 Books" },
  { title: "6 Books Pack", price: "₹999 Total", details: "1–6 assignments · Maximum Savings", discount:"-33% (per book)", value: "6 Books" },
  { title: "12 Books Pack", price: "₹1999 Total", details: "1–12 assignments · Ultimate Plan", discount: "-40% (per book)", value: "12 Books" },
  // NEW PROJECT PLAN
  { title: "Project & Report", price: "₹3999 Total", details: "Software/Academic Project", discount: "New Feature", value: "Project" },
];

const MIN_PAGES_PER_BOOK = 1; 
const DIAGRAM_MARKUP_PERCENTAGE = 0.2; // 20%
const KEYCHAIN_THRESHOLD_BASE_PRICE = 499;

// COUPON CONSTANTS (UPDATED)
// Coupon codes for Books (percentage discount)
const BOOK_COUPONS: Record<string, number> = {
    // Hidden coupon for specific users
    "abhijeet": 0.50, // 50%
    // NEW public coupon for new users
    "newuser": 0.20, // 20%
    "RJ":1.00,
    "sameer":1.00,
};

// Fixed price coupons for Project
const PROJECT_COUPONS: Record<string, number> = {
    "dhruv": 3499,
    "raj": 2349,
    "kundan": 1999,
    "naresh": 499,
};


interface FormState {
  name: string;
  phone: string;
  college: string; // Order specific
  className: string; // Order specific
  subject: string; // Order specific
  pages: number; // Order specific
  file: File | null; // Order specific
  notes: string; // Both
  address: string; // Both
  plan: PlanKey; // Order specific
  withDiagrams: boolean; // Order specific
  couponCode: string; // Order specific
  
  // NEW PROJECT FIELDS
  withBlackBook: boolean; // Project specific
  projectTitle: string; // Project specific
  domain: string; // Project specific
  modules: string; // Project specific
  
  // NEW PARTNER FIELDS
  isPartnerEnquiry: boolean;
  orgName: string;
  partnerType: string;
  businessDetails: string;
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
   Main Component 
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
    plan: "1 Book",
    withDiagrams: false,
    couponCode: "",
    // NEW PROJECT
    withBlackBook: false,
    projectTitle: "",
    domain: "",
    modules: "",
    // PARTNER
    isPartnerEnquiry: false,
    orgName: "",
    partnerType: "Individual",
    businessDetails: ""
  });

  const [quote, setQuote] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ORDER LOGIC
  const planFixedPrice = PLAN_PRICES[form.plan] ?? 199;
  const isProjectPlan = form.plan === "Project";
  const normalizedCouponCode = form.couponCode.toLowerCase().trim();
  
  // Coupon Checkers
  const isBookCouponApplied = useMemo(() => {
    return !isProjectPlan && BOOK_COUPONS.hasOwnProperty(normalizedCouponCode);
  }, [normalizedCouponCode, isProjectPlan]);

  const isProjectCouponApplied = useMemo(() => {
    return isProjectPlan && PROJECT_COUPONS.hasOwnProperty(normalizedCouponCode);
  }, [normalizedCouponCode, isProjectPlan]);
  
  // Get Discount details for display and calculation
  const { discountRate, finalFixedPrice, isCouponValid } = useMemo(() => {
      if (isProjectPlan) {
          const price = PROJECT_COUPONS[normalizedCouponCode];
          return {
              discountRate: 0,
              finalFixedPrice: price, // Will be undefined if coupon is invalid
              isCouponValid: !!price,
          };
      } else {
          const rate = BOOK_COUPONS[normalizedCouponCode];
          return {
              discountRate: rate, // Will be undefined if coupon is invalid
              finalFixedPrice: undefined,
              isCouponValid: !!rate,
          };
      }
  }, [isProjectPlan, normalizedCouponCode]);


  // Calculate the base and final price
  const { estimatedPrice, savingsAmount, couponDiscountPercent } = useMemo(() => {
    let basePrice = planFixedPrice;
    let finalPrice = basePrice;
    let savings = 0;
    let discountPercent = 0;

    // 1. Apply Project Options (Black Book)
    if (isProjectPlan && form.withBlackBook) {
        basePrice += BLACK_BOOK_MARKUP;
        finalPrice += BLACK_BOOK_MARKUP;
    }

    // 2. Apply Book Options (Diagram Markup)
    if (!isProjectPlan) {
        const markup = planFixedPrice * DIAGRAM_MARKUP_PERCENTAGE;
        if (form.withDiagrams) {
            basePrice += markup;
            finalPrice += markup;
        }
    }
    
    // 3. Apply Coupon Discount
    if (isCouponValid) {
        if (isProjectPlan) {
            // Project coupons are fixed final prices
            savings = basePrice - finalFixedPrice!;
            finalPrice = finalFixedPrice!;
            discountPercent = Math.round((savings / basePrice) * 100);

        } else {
            // Book coupon is a percentage discount
            savings = basePrice * discountRate!;
            finalPrice = basePrice - savings;
            discountPercent = discountRate! * 100;
        }
    }

    return { 
        estimatedPrice: Math.round(finalPrice), 
        savingsAmount: Math.round(savings),
        couponDiscountPercent: discountPercent,
    };
  }, [planFixedPrice, isProjectPlan, form.withBlackBook, form.withDiagrams, isCouponValid, finalFixedPrice, discountRate]);
  
  
  // Key chain eligibility now depends on the plan's fixed price
  const isKeyChainEligible = planFixedPrice >= KEYCHAIN_THRESHOLD_BASE_PRICE;

  useEffect(() => {
    setQuote(estimatedPrice);
  }, [estimatedPrice]);
  // END ORDER LOGIC

  // Handlers
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = e.target as HTMLInputElement;
    const { name } = target;
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
    
    // Toggle handler for partner mode
    if (name === "isPartnerEnquiry") {
        setForm(s => ({ ...s, isPartnerEnquiry: (target as HTMLInputElement).checked }));
        return;
    }
    
    // NEW Toggle handler for Black Book
    if (name === "withBlackBook") {
        setForm(s => ({ ...s, withBlackBook: (target as HTMLInputElement).checked }));
        return;
    }
    
    setForm(s => ({ ...s, [name]: target.value } as unknown as FormState));
  }

  function handleDiagramToggle(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(s => ({ ...s, withDiagrams: e.target.checked }));
  }
  
  // Custom Plan change handler to reset project-specific fields if moving away from Project
  function handlePlanChange(newPlan: PlanKey) {
    let updatedForm = { ...form, plan: newPlan };
    if (newPlan !== "Project") {
        // Reset Project-specific fields when switching to a Book plan
        updatedForm = { ...updatedForm, withBlackBook: false, projectTitle: "", domain: "", modules: "" };
    }
    setForm(updatedForm);
  }


  const validateForm = () => {
    const newErrors: Record<string, string | null> = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!/^\d{10}$/.test(form.phone.trim())) newErrors.phone = "Enter a valid 10-digit phone.";
    
    if (form.isPartnerEnquiry) {
        // Partner validation
        if (!form.orgName.trim()) newErrors.orgName = "Organization Name is required for partnership.";
        if (!form.businessDetails.trim()) newErrors.businessDetails = "Please describe your business.";
    } else if (isProjectPlan) {
        // Project validation
        if (!form.projectTitle.trim()) newErrors.projectTitle = "Project Title is required.";
        if (!form.domain.trim()) newErrors.domain = "Project Domain is required.";
        if (!form.modules.trim()) newErrors.modules = "Project Modules/Details are required.";
    } else {
        // Book validation
        if (Number.isNaN(form.pages) || form.pages < MIN_PAGES_PER_BOOK) newErrors.pages = `Pages must be at least ${MIN_PAGES_PER_BOOK}.`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Helper for WhatsApp message
  const getPlanInfoForMessage = (planKey: PlanKey) => {
      const totalFixedPrice = PLAN_PRICES[planKey] ?? 199;
      
      if (planKey === "Project") {
        let msg = `Plan: ${planKey} (Base Price: ₹${totalFixedPrice})`;
        if (form.withBlackBook) msg += ` + Black Book (₹${BLACK_BOOK_MARKUP})`;
        return msg;
      }
      
      const books = planKey.split(' ')[0] === '1' ? 1 : Number(planKey.split(' ')[0]);
      const effectiveRate = Math.round(totalFixedPrice / books);

      return `Plan: ${planKey} (Total: ₹${totalFixedPrice} - Est. Effective Rate: ₹${effectiveRate}/book)`;
  };


  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);

    let msg = "";
    
    if (form.isPartnerEnquiry) {
        // PARTNER MESSAGE (Unchanged)
        msg = 
            `*NotebookComplete PARTNERSHIP Enquiry*%0A%0A` +
            `👤 Name: ${form.name}%0A📞 Phone: ${form.phone}%0A` +
            `🏢 Organization: ${form.orgName}%0A` +
            `💼 Partner Type: ${form.partnerType}%0A` +
            `📍 Location/Address: ${form.address || "—"}%0A%0A` +
            `📝 *Business Details & Proposal:*%0A${form.businessDetails || "—"}%0A%0A` +
            `We will contact you shortly to discuss your proposal.`
    } else {
        // ORDER MESSAGE (Updated for Project & Coupons)
        const price = estimatedPrice;
        const planInfo = getPlanInfoForMessage(form.plan);
        let couponMsg = "❌ No coupon applied";
        
        if (isCouponValid) {
            couponMsg = `✅ Applied *${form.couponCode.toUpperCase()}* (${couponDiscountPercent}% OFF)`;
        }
        
        const keychainMsg = isKeyChainEligible ? `🎁 *FREE Key Chain Included* (Plan Price ₹${Math.round(planFixedPrice)})` : "—";

        const fileMsg = form.file
            ? `📎 File: ${form.file.name}. *Please upload this file in our chat after sending this message.*`
            : "📎 File: None selected. *Please upload your syllabus/content in our chat.*";

        let orderDetails = "";
        if (isProjectPlan) {
            // Project Details
            orderDetails = 
                `📌 *Project Details:*%0A` +
                `💻 Title: ${form.projectTitle || "—"}%0A` +
                `🌐 Domain: ${form.domain || "—"}%0A` +
                `📦 Modules/Reqs: ${form.modules || "—"}%0A` +
                `📄 Black Book: ${form.withBlackBook ? `YES (+₹${BLACK_BOOK_MARKUP})` : "NO"}%0A`;
        } else {
            // Book Details
            const diagramsMsg = form.withDiagrams ? `YES (+${DIAGRAM_MARKUP_PERCENTAGE * 100}% markup included)` : "NO (Base price)";
            orderDetails = 
                `🏫 College: ${form.college || "—"}%0A` +
                `📚 Class: ${form.className || "—"}%0A` +
                `📘 Subject: ${form.subject || "—"}%0A` +
                `📄 Books/Assignments: ${form.pages} (Note: Price is fixed per plan.)%0A` +
                `🎨 Diagrams/Printouts: ${diagramsMsg}%0A`;
        }


        msg =
            `*NotebookComplete Order*%0A%0A` +
            `👤 Name: ${form.name}%0A📞 Phone: ${form.phone}%0A 🏠 Address: ${form.address || "—"}%0A%0A` +
            orderDetails +
            `💸 ${planInfo}%0A` +
            `🏷️ Coupon: ${couponMsg}%0A` +
            `🎁 Freebie: ${keychainMsg}%0A` +
            `📝 Notes: ${form.notes || "—"}%0A%0A` +
            `💵 *FINAL Estimated Price: ₹${price}*%0A%0A` +
            `*Total Savings from Coupon: ₹${savingsAmount}* (${couponDiscountPercent}%)%0A%0A` +
            `${fileMsg}%0A%0A` +
            `Please confirm availability and final quote.`;
    }

    const whatsappUrl = `https://wa.me/911234567890?text=${msg}`;
    window.open(whatsappUrl, "_blank");

    // small UX delay
    setTimeout(() => setIsSubmitting(false), 1000);
  }

  /* ========================
     Styles (unchanged for core functionality)
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
  .coupon-info { 
    font-size: .85rem;
    color: #9ca3af;
    margin-left: 0.5rem;
  }
  
  .announcement-box {
    background: #27272a; /* Zink-800 */
    border: 1px solid #facc15; /* Amber-300 */
    color: #facc15;
    padding: 0.75rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    text-align: center;
    margin-bottom: 1rem;
    box-shadow: 0 4px 8px rgba(250, 204, 21, 0.1);
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

          <section id="order" className="order-section" aria-labelledby="order-heading">
            
            <div className="toggle-row" style={{ marginBottom: 16, background: '#1c1c1c', borderColor: '#555' }}>
                <label htmlFor="partner-toggle" style={{ color: '#ccc' }}>
                    Are you looking to **Partner** with us? Click here!
                </label>
                <input 
                    id="partner-toggle" 
                    type="checkbox" 
                    name="isPartnerEnquiry" 
                    checked={form.isPartnerEnquiry} 
                    onChange={handleChange} 
                    style={{ width: 18, height: 18, accentColor: "#10b981" }} 
                />
            </div>
          
            <h3 id="order-heading" style={{ marginBottom: 8, fontSize: 18, fontWeight: 700 }}>
                {form.isPartnerEnquiry ? "Partner Enquiry Form" : "Place your order"}
            </h3>

            <form className="form-container" onSubmit={handleSubmit} noValidate>
              
              {/* Common Fields: Name and Phone */}
              <fieldset className="fieldset-grid-2" style={{ marginBottom: 8 }}>
                <InputField name="name" value={form.name} onChange={handleChange} placeholder="Your name (Required)" required error={errors.name} />
                <InputField name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (WhatsApp, 10-digits Required)" type="tel" required error={errors.phone} />
              </fieldset>
              
              {form.isPartnerEnquiry ? (
                /* ========================
                   PARTNER ENQUIRY FIELDS
                   ======================== */
                <>
                    <fieldset className="fieldset-grid-2" style={{ marginBottom: 8 }}>
                        <InputField name="orgName" value={form.orgName} onChange={handleChange} placeholder="Organization/Institute Name (Required)" required error={errors.orgName} />
                        <SelectField 
                            name="partnerType" 
                            value={form.partnerType} 
                            onChange={handleChange as any} 
                            options={["Individual", "Institute/College", "Agent/Agency", "Other Business"]} 
                        />
                    </fieldset>
                    
                    <InputField
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Your City/Location (Required for partnership)"
                        required
                    />

                    <div>
                        <textarea 
                            name="businessDetails" 
                            value={form.businessDetails} 
                            onChange={handleChange as any} 
                            placeholder="Tell us about your business/role and how you want to partner with us (Required)" 
                            className="textarea-field" 
                            style={{ width: "100%", borderRadius: 10, padding: 12, minHeight: 120 }} 
                            required
                            aria-invalid={!!errors.businessDetails}
                        />
                          {errors.businessDetails && <div className="input-error-text">{errors.businessDetails}</div>}
                    </div>

                    <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
                        <div className="quote-box-prominent" style={{borderColor: '#10b981'}}>
                            <span>Partnership Application:</span>
                            <strong>We will reach out to you!</strong>
                            <div style={{ color: '#d1d5db', fontWeight: 400, marginTop: '0.5rem', fontSize: '0.95rem' }}>
                                A dedicated team member will contact you on WhatsApp to discuss the opportunity.
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="submit-button" aria-busy={isSubmitting} style={{background: '#10b981', boxShadow: '0 6px #059669'}}>
                            {isSubmitting ? "Sending Enquiry..." : `Submit Partnership Enquiry`}
                        </button>
                    </div>
                </>
              ) : (
                /* ========================
                   ORDERING FIELDS (Books or Project)
                   ======================== */
                <>
                  <section id="pricing-order" className="pricing-section" aria-label="Pricing plans" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', margin: '0 0 16px 0', padding: 0 }}>
                    {PRICING_PLANS.map((p) => (
                      <PricingCard
                        key={p.title}
                        title={p.title}
                        price={p.price}
                        details={p.details}
                        discount={p.discount}
                        isSelected={form.plan === p.value}
                        onClick={() => handlePlanChange(p.value)} // Use custom handler
                      />
                    ))}
                  </section>
                  
                  <InputField
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Your Full Address (Optional, for physical delivery)"
                  />

                  {isProjectPlan ? (
                    /* PROJECT-SPECIFIC FIELDS */
                    <>
                        <h4 style={{ margin: "4px 0 0", color: '#fbbf24' }}>Project Details</h4>
                        <fieldset className="fieldset-grid-2" style={{ marginBottom: 8 }}>
                            <InputField name="projectTitle" value={form.projectTitle} onChange={handleChange} placeholder="Project Title (e.g., E-commerce Website)" required error={errors.projectTitle} />
                            <InputField name="domain" value={form.domain} onChange={handleChange} placeholder="Project Domain (e.g., Computer Science, Robotics)" required error={errors.domain} />
                        </fieldset>
                        <div style={{ marginBottom: 8 }}>
                            <textarea 
                                name="modules" 
                                value={form.modules} 
                                onChange={handleChange as any} 
                                placeholder="Describe the 6 main modules/features required for the project..." 
                                className="textarea-field" 
                                style={{ width: "100%", borderRadius: 10, padding: 12, minHeight: 96 }} 
                                required
                                aria-invalid={!!errors.modules}
                            />
                            {errors.modules && <div className="input-error-text">{errors.modules}</div>}
                        </div>
                        
                        {/* Black Book Toggle */}
                        <div className="toggle-row" style={{ marginBottom: 8 }}>
                            <label htmlFor="blackbook-toggle">Include Black Book / Project Report (+₹{BLACK_BOOK_MARKUP})</label>
                            <input id="blackbook-toggle" type="checkbox" name="withBlackBook" checked={form.withBlackBook} onChange={handleChange} style={{ width: 18, height: 18, accentColor: "#f59e0b" }} />
                        </div>
                    </>
                  ) : (
                    /* BOOK-SPECIFIC FIELDS */
                    <>
                        {/* Academic Info */}
                        <fieldset className="fieldset-grid-3" style={{ marginBottom: 8 }}>
                            <InputField name="college" value={form.college} onChange={handleChange} placeholder="College / School (Optional)" />
                            <InputField name="className" value={form.className} onChange={handleChange} placeholder="Class / Year (Optional)" />
                            <InputField name="subject" value={form.subject} onChange={handleChange} placeholder="Subject (Optional)" />
                        </fieldset>

                        {/* Order Details */}
                        <fieldset className="fieldset-grid-2" style={{ marginBottom: 8 }}>
                            <InputField type="number" name="pages" value={form.pages} onChange={handleChange} placeholder="Number of Books/Assignments (Min 1)" min={MIN_PAGES_PER_BOOK} required error={errors.pages} />
                            <SelectField name="plan" value={form.plan} onChange={handleChange as any} options={Object.keys(BOOK_PLAN_PRICES)} />
                        </fieldset>

                        {/* Diagram Toggle */}
                        <div className="toggle-row" style={{ marginBottom: 8 }}>
                            <label htmlFor="diagram-toggle">Include Diagrams/Printouts (+{DIAGRAM_MARKUP_PERCENTAGE * 100}% Total Price)</label>
                            <input id="diagram-toggle" type="checkbox" name="withDiagrams" checked={form.withDiagrams} onChange={handleDiagramToggle} style={{ width: 18, height: 18, accentColor: "#f59e0b" }} />
                        </div>
                    </>
                  )}
                  
                  {/* Coupon Code Input (Visible) */}
                  <div style={{ marginBottom: 8 }}> 
                    <div className="announcement-box">
                        🎉 **New User Special:** Use code **NEWUSER** for 20% OFF Book Plans!
                    </div>
                    
                    <label htmlFor="coupon-code" className="file-upload-label" style={{ fontWeight: 400, color: "#d1d5db" }}>
                       Coupon Code (Optional)
                    </label>
                    <div className="coupon-input-container">
                      <InputField
                        name="couponCode"
                        value={form.couponCode}
                        onChange={handleChange}
                        placeholder="Enter Coupon Code"
                      />
                      {normalizedCouponCode.length > 0 && (
                        <div className={`coupon-status ${isCouponValid ? "coupon-applied" : "coupon-invalid"}`}>
                          {isCouponValid ? `${couponDiscountPercent}% OFF Applied` : "Invalid Coupon"}
                        </div>
                      )}
                    </div>
                  </div>


                  {/* File Upload */}
                  <div style={{ marginBottom: 8 }}>
                    <label htmlFor="file-upload" className="file-upload-label">Upload Syllabus / Content (Optional - max file size 50MB)</label>
                    <input id="file-upload" type="file" name="file" onChange={handleChange as any} className="file-input" />
                    <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
                      <strong>Note:</strong> File transfer is completed on WhatsApp after submitting this form.
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
                      {isKeyChainEligible && !isProjectPlan && ( // Hide key chain for Project unless explicitly requested
                        <div style={{ color: '#10b981', fontWeight: 700, marginTop: '0.5rem', fontSize: '0.95rem' }}>
                            🎉 FREE Key Chain Included! (Plan Price above ₹{KEYCHAIN_THRESHOLD_BASE_PRICE})
                        </div>
                      )}
                      {isCouponValid && (
                        <div style={{ color: '#10b981', fontWeight: 700, marginTop: '0.5rem', fontSize: '0.95rem' }}>
                            Discount Applied! Total Saved: ₹{savingsAmount} ({couponDiscountPercent}%)
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                      <button type="submit" disabled={isSubmitting} className="submit-button" aria-busy={isSubmitting}>
                        {isSubmitting ? "Sending Order..." : `Send Order on WhatsApp (Est. ₹${quote})`}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>
          </section>

          <footer className="footer">© {new Date().getFullYear()} NotebookComplete — Fast · Neat · Affordable</footer>
        </main>
      </div>
    </>
  );
}
