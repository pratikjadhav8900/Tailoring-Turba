interface HubSpotContact {
  email?: string;
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
    hs_lead_status: contact.hs_lead_status ?? "NEW",
  };
  if (contact.email) properties.email = contact.email;
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
      console.error("HubSpot push failed:", await res.text());
      return null;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("HubSpot error:", err);
    return null;
  }
}
