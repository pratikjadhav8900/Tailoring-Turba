/**
 * HubSpot CRM integration
 * Pushes new B2B user leads to HubSpot Free CRM
 */

interface HubSpotContact {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
  hs_lead_status?: string;
}

export async function pushContactToHubSpot(contact: HubSpotContact) {
  const apiKey = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!apiKey) {
    console.warn("HubSpot Access Token not set — skipping CRM sync");
    return null;
  }

  const properties: Record<string, string> = {
    email: contact.email,
    hs_lead_status: contact.hs_lead_status ?? "NEW",
  };

  if (contact.firstname) properties.firstname = contact.firstname;
  if (contact.lastname) properties.lastname = contact.lastname;
  if (contact.phone) properties.phone = contact.phone;
  if (contact.company) properties.company = contact.company;

  try {
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ properties }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("HubSpot push failed:", err);
      return null;
    }

    const data = await res.json();
    console.log("HubSpot contact created:", data.id);
    return data;
  } catch (err) {
    console.error("HubSpot error:", err);
    return null;
  }
}
