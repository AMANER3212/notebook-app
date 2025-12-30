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
  { title: "Single Book", price: "₹199 Total", details: "1 journal/book · no diagrams", discount: "Base Price", value: "1 Book" },
  { title: "3 Books Pack", price: "₹499 Total", details: "Up to 3 journals/books · Great Value", discount: "-25% (per book)", value: "3 Books" },
  { title: "6 Books Pack", price: "₹999 Total", details: "1–6 journals/books · Maximum Savings", discount:"-33% (per book)", value: "6 Books" },
  { title: "12 Books Pack", price: "₹1999 Total", details: "1–12 journals/books · Ultimate Plan", discount: "-40% (per book)", value: "12 Books" },
  // NEW PROJECT PLAN
  { title: "Project & Report", price: "₹3999 Total", details: "Software/Academic Project", discount: "New Feature", value: "Project" },
];

const MIN_PAGES_PER_BOOK = 1; 
const DIAGRAM_MARKUP_PERCENTAGE = 0.2; // 20%
const KEYCHAIN_THRESHOLD_BASE_PRICE = 499;

// New structure for coupon details
interface CouponDetails {
    rate?: number; // Discount rate (0.0 to 1.0) for book plans
    fixedPrice?: number; // Final fixed price for project plans
    message: string; // Custom message to display upon successful application
}

// COUPON CONSTANTS
const BOOK_COUPONS: Record<string, CouponDetails> = {
    "abhijeet": { rate: 0.50, message: "A special 50% discount has been applied to your order." },
    "newuser": { rate: 0.20, message: "Welcome! Your 20% New User discount is active." },
    "rj": { rate: 1.00, message: "🎉 Congratulations! Your Book Plan is now FREE!" },
    "sameer": { rate: 1.00, message: "🎉 Congratulations! Your Book Plan is now FREE!" },
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
  pages: number; 
  file: File | null; 
  notes: string; 
  address: string; 
  plan: PlanKey; 
  withDiagrams: boolean; 
  
  // PROJECT FIELDS
  withBlackBook: boolean; 
  projectTitle: string; 
  domain: string; 
  modules: string; 
  
  // PARTNER FIELDS
  isPartnerEnquiry: boolean;
  orgName: string;
  partnerType: string;
  businessDetails: string;
}

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

  // ORDER LOGIC
  const planFixedPrice = PLAN_PRICES[form.plan] ?? 199;
  const isProjectPlan = form.plan === "Project";
  const normalizedCouponCode = form.couponCode.toLowerCase().trim();
  
  const { discountRate, finalFixedPrice, isCouponValid, couponMessage } = useMemo(() => {
      let details: CouponDetails | undefined;
      if (isProjectPlan) details = PROJECT_COUPONS[normalizedCouponCode];
      else details = BOOK_COUPONS[normalizedCouponCode];
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

    if (!isProjectPlan && form.withDiagrams) {
        const markup = planFixedPrice * DIAGRAM_MARKUP_PERCENTAGE;
        basePrice += markup;
        finalPrice += markup;
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
      setForm(s => ({ ...s, [name]: files && files[0] ? files[0] : null } as unknown as FormState));
      return;
    }

    if (name === "pages") {
      const num = Number(target.value || 0);
      setForm(s => ({ ...s, pages: num }));
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
    if (newPlan !== "Project") updatedForm = { ...updatedForm, withBlackBook: false, projectTitle: "", domain: "", modules: "" };
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
    } else {
        if (Number.isNaN(form.pages) || form.pages < MIN_PAGES_PER_BOOK) newErrors.pages = `Number of journals/books must be at least ${MIN_PAGES_PER_BOOK}.`;
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
      return `Plan: ${planKey} (Total: ₹${totalFixedPrice} - Est. Effective Rate: ₹${effectiveRate}/journal/book)`;
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
            `We will contact you shortly to discuss your proposal.`
    } else {
        const price = estimatedPrice;
        const planInfo = getPlanInfoForMessage(form.plan);
        let couponMsg = "❌ No coupon applied";
        if (isCouponValid) couponMsg = `✅ Coupon Applied: *${form.couponCode.toUpperCase()}* - ${couponMessage}`;
        
        const keychainMsg = isKeyChainEligible ? `🎁 *FREE Key Chain Included* (Plan Price ₹${Math.round(planFixedPrice)})` : "—";

        const fileMsg = form.file
            ? `📎 File: ${form.file.name}. *Please upload this file in our chat after sending this message.*`
            : "📎 File: None selected. *Please upload your journals/books content in our chat.*";

        let orderDetails = "";
        if (isProjectPlan) {
            orderDetails = 
                `📌 *Project Details:*%0A` +
                `💻 Title: ${form.projectTitle || "—"}%0A` +
                `🌐 Domain: ${form.domain || "—"}%0A` +
                `📦 Modules/Reqs: ${form.modules || "—"}%0A` +
                `📄 Black Book: ${form.withBlackBook ? `YES (+₹${BLACK_BOOK_MARKUP})` : "NO"}%0A`;
        } else {
            const diagramsMsg = form.withDiagrams ? `YES (+${DIAGRAM_MARKUP_PERCENTAGE * 100}% markup included)` : "NO (Base price)";
            orderDetails = 
                `🏫 College: ${form.college || "—"}%0A` +
                `📚 Class: ${form.className || "—"}%0A` +
                `📘 Subject: ${form.subject || "—"}%0A` +
                `📄 Journals/Books: ${form.pages} (Note: Price is fixed per plan.)%0A` +
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

    const whatsappUrl = `https://wa.me/917559366120?text=${msg}`;
    window.open(whatsappUrl, "_blank");

    setTimeout(() => setIsSubmitting(false), 1000);
  }

  /* ========================
     STYLES (same as original)
     ======================== */
  const style = `/* ...include all your styles as before... */`;

  
