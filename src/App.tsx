import React, { JSX, useEffect, useMemo, useState } from "react";

/* ============================
   Constants & Types 
   ============================ */

const BOOK_PLAN_PRICES = {
  "1 Book": 199, 
  "3 Books": 499,
  "6 Books": 999,
  "12 Books": 1999,
} as const;

const PROJECT_PLAN_PRICE = 3999;
const BLACK_BOOK_MARKUP = 850;

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
  { title: "Single Book", price: "₹199 Total", details: "30 pages · no diagrams", discount: "Base Price", value: "1 Book" },
  { title: "3 Books Pack", price: "₹499 Total", details: "100 pages · Great Value", discount: "-25% (per book)", value: "3 Books" },
  { title: "6 Books Pack", price: "₹999 Total", details: "200 pages · Maximum Savings", discount:"-33% (per book)", value: "6 Books" },
  { title: "12 Books Pack", price: "₹1999 Total", details: "800 pages · Ultimate Plan", discount: "-40% (per book)", value: "12 Books" },
  { title: "Project & Report", price: "₹3999 Total", details: "Software/Academic Project", discount: "New Feature", value: "Project" },
];

const MIN_PAGES_PER_BOOK = 100; 
const DIAGRAM_MARKUP_PERCENTAGE = 0.2;
const KEYCHAIN_THRESHOLD_BASE_PRICE = 499;

interface CouponDetails {
    rate?: number;
    fixedPrice?: number;
    message: string;
}

const BOOK_COUPONS: Record<string, CouponDetails> = {
    "abhijeet": { rate: 0.50, message: "A special 50% discount has been applied to your order." },
    "rj": { rate: 1.00, message: "🎉 Congratulations! Your Book Plan is now FREE!" },
    "sameer": { rate: 1.00, message: "🎉 Congratulations! Your Book Plan is now FREE!" },
   "freinds": { rate:0.20, message: "🎉 Congratulations! please Dont share the coupon code" },
};

const PROJECT_COUPONS: Record<string, CouponDetails> = {
    "dhruv": { fixedPrice: 3499, message: "Project fixed price discount applied." },
    "raj": { fixedPrice: 2349, message: "Project fixed price discount applied." },
    "kundan": { fixedPrice: 1999, message: "Project fixed price discount applied." },
    "naresh": { fixedPrice: 499, message: "Project fixed price discount applied." },
    "rj": { fixedPrice: 11, message: "Bhai Bas Ek Kam Kardiyo" },
    "kunal": { fixedPrice: 11, message: " 🤤🍽️Bas Misal Pav Khilade Bhai 🤤🍽️" },
    "sameer": { fixedPrice: 11, message: "Bhai Hai Tu Apna 11 Rupaye Shagun Ke" },
};

interface FormState {
  name: string;
  phone: string;
  college: string;
  className: string;
  subject: string;
  file: File | null;
  notes: string;
  address: string;
  plan: PlanKey;
  withDiagrams: boolean;
  couponCode: string;
  withBlackBook: boolean;
  projectTitle: string;
  domain: string;
  modules: string;
  isPartnerEnquiry: boolean;
  orgName: string;
  partnerType: string;
  businessDetails: string;
}

/* =========================
   TESTIMONIALS SECTION
   ========================= */
interface Testimonial {
  user_name: string;
  user_image: string;
  product_image: string;
  rating: number;
  message: string;
  approved: boolean;
}

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        // ⚠️ REPLACE WITH YOUR ACTUAL GOOGLE SHEET ID
        const sheetId = "1zd5kuro3UGJfc_zhHyWSRe8tbewdzWe0LC7wO5XRCiM";
        const sheetName = "Sheet1";
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
        
        const response = await fetch(url);
        const text = await response.text();
        
        const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.*?)\);/s);
        if (!jsonMatch) throw new Error("Invalid Google Sheets response");
        
        const jsonData = JSON.parse(jsonMatch[1]);
        const rows = jsonData.table.rows;
        
        const parsedTestimonials: Testimonial[] = rows
          .map((row: any) => {
            const cells = row.c;
            return {
              user_name: cells[0]?.v || "",
              user_image: cells[1]?.v || "",
              product_image: cells[2]?.v || "",
              rating: parseInt(cells[3]?.v) || 0,
              message: cells[4]?.v || "",
              approved: cells[5]?.v === "TRUE" || cells[5]?.v === true
            };
          })
          .filter((t: Testimonial) => t.approved && t.rating > 0 && t.message.trim())
          .slice(0, 6);
        
        setTestimonials(parsedTestimonials);
      } catch (err) {
        console.error("Failed to fetch testimonials:", err);
        setError("Could not load testimonials.");
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const Stars = ({ rating }: { rating: number }) => (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{ 
          fontSize: '14px', 
          color: i < rating ? '#fbbf24' : '#374151' 
        }}>
          ★
        </span>
      ))}
    </div>
  );

  if (loading) return null;
  if (error || testimonials.length === 0) return null;

  return (
    <section style={{ marginTop: '3rem', marginBottom: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.8rem', 
          fontWeight: 800, 
          color: '#fbbf24',
          margin: '0 0 0.5rem 0'
        }}>
          What Our Customers Say
        </h3>
        <div style={{ color: '#d1d5db', fontSize: '1.1rem' }}>
          Trusted by students across India
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {testimonials.map((testimonial, index) => (
          <div key={index} style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #333',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }} 
          onMouseEnter={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'translateY(-4px)';
            target.style.boxShadow = '0 16px 40px rgba(245,158,11,0.25)';
            target.style.borderColor = '#f59e0b';
          }} 
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'translateY(0)';
            target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
            target.style.borderColor = '#333';
          }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Stars rating={testimonial.rating} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '0.25rem' }}>
                  {testimonial.user_name}
                </div>
              </div>
            </div>

            <div style={{ 
              color: '#d1d5db', 
              lineHeight: '1.6', 
              marginBottom: '1rem',
              fontSize: '0.95rem'
            }}>
              "{testimonial.message}"
            </div>

            {testimonial.product_image && (
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={testimonial.product_image} 
                  alt="Work sample"
                  style={{
                    maxWidth: '100%',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #333'
                  }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

/* ====================
   Small Reusable UI
   ==================== */

const InputField = (props: {
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  error?: string | null;
}) => {
  const { name, value, onChange, placeholder = "", required = false, type = "text", error } = props;
  return (
    <div className="input-container">
      <input
        name={name}
        value={value as any}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
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
    file: null,
    notes: "",
    address: "",
    plan: "1 Book",
    withDiagrams: false,
    couponCode: "",
    withBlackBook: false,
    projectTitle: "",
    domain: "",
    modules: "",
    isPartnerEnquiry: false,
    orgName: "",
    partnerType: "Individual",
    businessDetails: ""
  });

  const [quote, setQuote] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const planFixedPrice = PLAN_PRICES[form.plan] ?? 199;
  const isProjectPlan = form.plan === "Project";
  const normalizedCouponCode = form.couponCode.toLowerCase().trim();
  
  const { discountRate, finalFixedPrice, isCouponValid, couponMessage } = useMemo(() => {
      let details: CouponDetails | undefined;
      if (isProjectPlan) {
          details = PROJECT_COUPONS[normalizedCouponCode];
      } else {
          details = BOOK_COUPONS[normalizedCouponCode];
      }
      const isValid = !!details;
      return {
          discountRate: isValid ? details.rate : 0,
          finalFixedPrice: isValid ? details.fixedPrice : undefined,
          isCouponValid: isValid,
          couponMessage: isValid ? details.message : "",
      };
  }, [isProjectPlan, normalizedCouponCode]);

  const { estimatedPrice, savingsAmount, couponDiscountPercent } = useMemo(() => {
    let basePrice = planFixedPrice;
    let finalPrice = basePrice;
    let savings = 0;
    let discountPercent = 0;

    if (isProjectPlan && form.withBlackBook) {
        basePrice += BLACK_BOOK_MARKUP;
        finalPrice += BLACK_BOOK_MARKUP;
    }

    if (!isProjectPlan) {
        const markup = planFixedPrice * DIAGRAM_MARKUP_PERCENTAGE;
        if (form.withDiagrams) {
            basePrice += markup;
            finalPrice += markup;
        }
    }
    
    if (isCouponValid) {
        if (isProjectPlan) {
            savings = basePrice - finalFixedPrice!;
            finalPrice = finalFixedPrice!;
            discountPercent = Math.round((savings / basePrice) * 100);
        } else {
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
  
  const isKeyChainEligible = planFixedPrice >= KEYCHAIN_THRESHOLD_BASE_PRICE;

  useEffect(() => {
    setQuote(estimatedPrice);
  }, [estimatedPrice]);

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
    
    if (name === "isPartnerEnquiry") {
        setForm(s => ({ ...s, isPartnerEnquiry: (target as HTMLInputElement).checked }));
        return;
    }
    
    if (name === "withBlackBook") {
        setForm(s => ({ ...s, withBlackBook: (target as HTMLInputElement).checked }));
        return;
    }
    
    setForm(s => ({ ...s, [name]: target.value } as unknown as FormState));
  }

  function handleDiagramToggle(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(s => ({ ...s, withDiagrams: e.target.checked }));
  }
  
  function handlePlanChange(newPlan: PlanKey) {
    let updatedForm = { ...form, plan: newPlan };
    if (newPlan !== "Project") {
        updatedForm = { ...updatedForm, withBlackBook: false, projectTitle: "", domain: "", modules: "" };
    }
    setForm(updatedForm);
  }

  const validateForm = () => {
    const newErrors: Record<string, string | null> = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!/^\d{10}$/.test(form.phone.trim())) newErrors.phone = "Enter a valid 10-digit phone.";
    
    if (form.isPartnerEnquiry) {
        if (!form.orgName.trim()) newErrors.orgName = "Organization Name is required for partnership.";
        if (!form.businessDetails.trim()) newErrors.businessDetails = "Please describe your business.";
    } else if (isProjectPlan) {
        if (!form.projectTitle.trim()) newErrors.projectTitle = "Project Title is required.";
        if (!form.domain.trim()) newErrors.domain = "Project Domain is required.";
        if (!form.modules.trim()) newErrors.modules = "Project Modules/Details are required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const getPlanInfoForMessage = (planKey: PlanKey) => {
      const totalFixedPrice = PLAN_PRICES[planKey] ?? 199;
      
      if (planKey === "Project") {
        let msg = `Plan: ${planKey} (Base Price: ₹${totalFixedPrice})`;
        if (form.withBlackBook) msg += ` + Black Book (₹${BLACK_BOOK_MARKUP})`;
        return msg;
      }
      
      const books = planKey.split(' ')[0] === '1' ? 1 : Number(planKey.split(' ')[0]);
      const effectiveRate = Math.round(totalFixedPrice / books);

      return `Plan: ${planKey} (${books * MIN_PAGES_PER_BOOK}+ pages | Total: ₹${totalFixedPrice} - ₹${effectiveRate}/book)`;
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    let msg = "";
    
    if (form.isPartnerEnquiry) {
        msg = 
            `*NotebookComplete PARTNERSHIP Enquiry*%0A%0A` +
            `👤 Name: ${form.name}%0A📞 Phone: ${form.phone}%0A` +
            `🏢 Organization: ${form.orgName}%0A` +
            `💼 Partner Type: ${form.partnerType}%0A` +
            `📍 Location/Address: ${form.address || "—"}%0A%0A` +
            `📝 *Business Details & Proposal:*%0A${form.businessDetails || "—"}%0A%0A` +
            `We will contact you shortly to discuss your proposal.`;
    } else {
        const price = estimatedPrice;
        const planInfo = getPlanInfoForMessage(form.plan);
        
        let couponMsg = "❌ No coupon applied";
        if (isCouponValid) {
            couponMsg = `✅ Coupon Applied: *${form.couponCode.toUpperCase()}* - ${couponMessage}`;
        }
        
        const keychainMsg = isKeyChainEligible ? `🎁 *FREE Key Chain Included*` : "—";
        const fileMsg = form.file
            ? `📎 File: ${form.file.name}. *Please upload this file in our chat.*`
            : "📎 File: None selected. *Please upload your syllabus/content in our chat.*";

        let orderDetails = "";
        if (isProjectPlan) {
            orderDetails = 
                `📌 *Project Details:*%0A` +
                `💻 Title: ${form.projectTitle || "—"}%0A` +
                `🌐 Domain: ${form.domain || "—"}%0A` +
                `📦 Modules/Reqs: ${form.modules || "—"}%0A` +
                `📄 Black Book: ${form.withBlackBook ? `YES (+₹${BLACK_BOOK_MARKUP})` : "NO"}%0A`;
        } else {
            const diagramsMsg = form.withDiagrams ? `YES (+${DIAGRAM_MARKUP_PERCENTAGE * 100}% markup)` : "NO (Base price)";
            orderDetails = 
                `🏫 College: ${form.college || "—"}%0A` +
                `📚 Class: ${form.className || "—"}%0A` +
                `📘 Subject: ${form.subject || "—"}%0A` +
                `📄 *${MIN_PAGES_PER_BOOK}+ pages per book (Fixed Plan Price)*%0A` +
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
            `*Total Savings: ₹${savingsAmount}* (${couponDiscountPercent}%)%0A%0A` +
            `${fileMsg}%0A%0A` +
            `Please confirm availability and final quote.`;
    }

    const whatsappUrl = `https://wa.me/917559366120?text=${msg}`;
    window.open(whatsappUrl, "_blank");
    setTimeout(() => setIsSubmitting(false), 1000);
  }

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
      width:100%;
    }
    .input-field:focus,.select-field:focus,.textarea-field:focus{
      outline:none;
      border-color:var(--accent);
      box-shadow:0 0 8px var(--accent);
      background:#1c1c1c;
    }
    .input-error-border{border-color:#ef4444}
    .input-error-text{color:#ef4444;font-size:.82rem}

    .select-field option{background:#111;color:white;}
    .file-input{width:100%;padding:0.8rem;border-radius:10px;border:1px solid #333;background:#0d0d0d;color:white;}
    .file-upload-label{font-weight:600;color:#fbbf24;margin-bottom:0.35rem;display:block}
    .file-input::file-selector-button{
      padding:.55rem 1rem;
      border-radius:999px;
      border:0;
      font-weight:600;
      background:#f59e0b;
      color:#111;
      cursor:pointer;
      margin-right:0.5rem;
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
    .coupon-status {
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
    }
    .coupon-applied {background: #10b981;color: #064e3b;}
    .coupon-invalid {background: #f87171;color: #7f1d1d;}
    .coupon-message-box {
        margin-top: 0.5rem;
        padding: 0.75rem;
        border-radius: 8px;
        background: #10b98133;
        border: 1px solid #10b981;
        color: #34d399;
        font-size: 0.9rem;
        font-weight: 600;
    }

    .submit-button{width:100%;padding:1rem;border-radius:10px;background:var(--accent);color:black;font-weight:800;border:none;cursor:pointer;box-shadow:0 6px #d97706;transition:transform .08s;font-size:1rem}
    .submit-button:active{transform:translateY(2px)}
    .submit-button:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}

    .footer{margin-top:1.5rem;text-align:center;color:#9ca3af;font-size:.9rem}
  `;

  return (
    <>
      <style>{style}</style>
      <div className="max-w-5xl">
        <header className="header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="logo">NC</div>
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
              <p>Choose your plan, upload details, and get it done — without stress. <strong>100+ pages per book minimum.</strong></p>
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
                  }}
                />
              </div>
            </div>
          </section>

          <section id="order" className="order-section">
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
          
            <h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 700 }}>
                {form.isPartnerEnquiry ? "Partner Enquiry Form" : "Place your order"}
            </h3>

            <form className="form-container" onSubmit={handleSubmit} noValidate>
              <fieldset className="fieldset-grid-2" style={{ marginBottom: 8 }}>
                <InputField name="name" value={form.name} onChange={handleChange} placeholder="Your name (Required)" required error={errors.name} />
                <InputField name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (WhatsApp, 10-digits Required)" type="tel" required error={errors.phone} />
              </fieldset>
              
              {form.isPartnerEnquiry ? (
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
                            style={{ width: "100%", borderRadius: 10, padding: 12, minHeight: 120, resize: 'vertical' }} 
                            required
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

                        <button type="submit" disabled={isSubmitting} className="submit-button" style={{background: '#10b981', boxShadow: '0 6px #059669'}}>
                            {isSubmitting ? "Sending Enquiry..." : `Submit Partnership Enquiry`}
                        </button>
                    </div>
                </>
              ) : (
                <>
                  <section id="pricing-order" className="pricing-section" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', margin: '0 0 16px 0', padding: 0 }}>
                    {PRICING_PLANS.map((p) => (
                      <PricingCard
                        key={p.title}
                        title={p.title}
                        price={p.price}
                        details={p.details}
                        discount={p.discount}
                        isSelected={form.plan === p.value}
                        onClick={() => handlePlanChange(p.value)}
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
                    <>
                        <h4 style={{ margin: "4px 0 12px", color: '#fbbf24' }}>Project Details</h4>
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
                                style={{ width: "100%", borderRadius: 10, padding: 12, minHeight: 96, resize: 'vertical' }} 
                                required
                            />
                            {errors.modules && <div className="input-error-text">{errors.modules}</div>}
                        </div>
                        
                        <div className="toggle-row" style={{ marginBottom: 16 }}>
                            <label htmlFor="blackbook-toggle">Include Black Book / Project Report (+₹{BLACK_BOOK_MARKUP})</label>
                            <input id="blackbook-toggle" type="checkbox" name="withBlackBook" checked={form.withBlackBook} onChange={handleChange} style={{ width: 18, height: 18, accentColor: "#f59e0b" }} />
                        </div>
                    </>
                  ) : (
                    <>
                        <fieldset className="fieldset-grid-3" style={{ marginBottom: 8 }}>
                            <InputField name="college" value={form.college} onChange={handleChange} placeholder="College / School (Optional)" />
                            <InputField name="className" value={form.className} onChange={handleChange} placeholder="Class / Year (Optional)" />
                            <InputField name="subject" value={form.subject} onChange={handleChange} placeholder="Subject (Optional)" />
                        </fieldset>

                        <div className="toggle-row" style={{ marginBottom: 16 }}>
                            <label htmlFor="diagram-toggle">Include Diagrams/Printouts (+{DIAGRAM_MARKUP_PERCENTAGE * 100}% Total Price) <strong>· 100+ pages/book</strong></label>
                            <input id="diagram-toggle" type="checkbox" name="withDiagrams" checked={form.withDiagrams} onChange={handleDiagramToggle} style={{ width: 18, height: 18, accentColor: "#f59e0b" }} />
                        </div>
                    </>
                  )}
                  
                  <div style={{ marginBottom: 16 }}> 
                    <label htmlFor="coupon-code" className="file-upload-label" style={{ fontWeight: 400, color: "#d1d5db" }}>
                       Coupon Code (Optional)
                    </label>
                    <div className="coupon-input-container">
                      <input
                        id="coupon-code"
                        name="couponCode"
                        value={form.couponCode}
                        onChange={handleChange}
                        placeholder="Enter Coupon Code"
                        className="input-field"
                      />
                      {normalizedCouponCode.length > 0 && (
                        <div className={`coupon-status ${isCouponValid ? "coupon-applied" : "coupon-invalid"}`}>
                          {isCouponValid ? `Discount Applied!` : "Invalid Code"}
                        </div>
                      )}
                    </div>
                    
                    {isCouponValid && couponMessage && (
                        <div className="coupon-message-box" role="status">
                            {couponMessage}
                        </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label htmlFor="file-upload" className="file-upload-label">Upload Syllabus / Content (Optional - max file size 50MB)</label>
                    <input id="file-upload" type="file" name="file" onChange={handleChange as any} className="file-input" />
                    <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
                      <strong>Note:</strong> File transfer is completed on WhatsApp after submitting this form.
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <textarea 
                      name="notes" 
                      value={form.notes} 
                      onChange={handleChange as any} 
                      placeholder="Any extra notes or requirements (pen color, formatting, delivery)..." 
                      className="textarea-field" 
                      style={{ width: "100%", borderRadius: 10, padding: 12, minHeight: 96, resize: 'vertical' }} 
                    />
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    <div className="quote-box-prominent" aria-live="polite">
                      <span>Your Estimated Quote:</span>
                      <strong>₹{quote}</strong>
                      {isKeyChainEligible && !isProjectPlan && (
                        <div style={{ color: '#10b981', fontWeight: 700, marginTop: '0.5rem', fontSize: '0.95rem' }}>
                            🎉 FREE Key Chain Included!
                        </div>
                      )}
                      {isCouponValid && (
                        <div style={{ color: '#10b981', fontWeight: 700, marginTop: '0.5rem', fontSize: '0.95rem' }}>
                            Total Saved: ₹{savingsAmount} ({couponDiscountPercent}%)
                        </div>
                      )}
                    </div>

                    <button type="submit" disabled={isSubmitting} className="submit-button" aria-busy={isSubmitting}>
                        {isSubmitting ? "Sending Order..." : `Send Order on WhatsApp (Est. ₹${quote})`}
                    </button>
                  </div>
                </>
              )}
            </form>
          </section>

          <TestimonialsSection />

          <footer className="footer">© {new Date().getFullYear()} NotebookComplete — Fast · Neat · Affordable</footer>
        </main>
      </div>
    </>
  );
}
