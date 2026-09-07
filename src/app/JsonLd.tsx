import React from "react";

export default function JsonLd() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Tailoring Turba",
    "url": "https://tailoringturba.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://tailoringturba.com/products?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Tailoring Turba",
    "url": "https://tailoringturba.com",
    "logo": "https://tailoringturba.com/brand-logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-90225-53346",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "321/1, Jawaharlal Nehru Road, Mahatma Phule Peth, near HDFC Bank",
      "addressLocality": "Pune",
      "addressRegion": "Maharashtra",
      "postalCode": "411042",
      "addressCountry": "IN"
    },
    "sameAs": [
      "https://www.facebook.com/tailoringturba",
      "https://www.instagram.com/tailoringturba",
      "https://www.linkedin.com/company/tailoringturba"
    ]
  };

  const siteNavigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "SiteNavigationElement",
        "position": 1,
        "name": "Design Studio - Customize Garments",
        "url": "https://tailoringturba.com/customizer",
        "description": "Design custom polo shirts, t-shirts, hoodies, and jackets using our real-time 3D customizer tool with fabric selection."
      },
      {
        "@type": "SiteNavigationElement",
        "position": 2,
        "name": "All Products Catalog",
        "url": "https://tailoringturba.com/products",
        "description": "Browse our premium range of custom t-shirts, corporate uniforms, hoodies, and catalog products."
      },
      {
        "@type": "SiteNavigationElement",
        "position": 3,
        "name": "Book Showroom Appointment",
        "url": "https://tailoringturba.com/booking",
        "description": "Schedule a personal appointment or showroom visit with our custom tailoring consultants."
      },
      {
        "@type": "SiteNavigationElement",
        "position": 4,
        "name": "Full B2B Product Catalogue",
        "url": "https://tailoringturba.com/products/catalogue",
        "description": "Download and view our wholesale catalogue including gift sets, promotional notebooks, and pens."
      },
      {
        "@type": "SiteNavigationElement",
        "position": 5,
        "name": "Bulk Orders & Contact Us",
        "url": "https://tailoringturba.com/contact",
        "description": "Get custom quotes, enquire about wholesale prices, and submit your bespoke garment specifications."
      },
      {
        "@type": "SiteNavigationElement",
        "position": 6,
        "name": "About Our Brand",
        "url": "https://tailoringturba.com/about",
        "description": "Learn about our premium custom garment production, quality standards, and corporate uniform supply chains."
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationSchema) }}
      />
    </>
  );
}
