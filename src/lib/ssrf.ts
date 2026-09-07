import dns from "dns";
import fs from "fs/promises";
import path from "path";

export function isPrivateIp(ip: string): boolean {
  if (!ip) return false;
  // IPv4 checks
  if (ip === "0.0.0.0") return true;
  if (ip.startsWith("127.")) return true; // Loopback
  if (ip.startsWith("10.")) return true; // RFC1918 10.0.0.0/8
  if (ip.startsWith("192.168.")) return true; // RFC1918 192.168.0.0/16
  if (ip.startsWith("169.254.")) return true; // Link-local / Cloud metadata (AWS, GCP 169.254.169.254)

  const parts = ip.split(".").map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true; // RFC1918 172.16.0.0/12
  }

  // IPv6 checks
  if (ip === "::1" || ip === "::") return true;
  const lower = ip.toLowerCase();
  if (lower.startsWith("fe80:") || lower.startsWith("fc00:") || lower.startsWith("fd00:")) return true;

  return false;
}

const ALLOWED_HOSTS = new Set([
  "res.cloudinary.com",
  "images.unsplash.com",
  "github.com",
  "raw.githubusercontent.com",
  "fonts.gstatic.com",
  "fonts.googleapis.com",
]);

/**
 * SSRF Defense: Validates URLs, schemes, host allowlist, and resolved IPs.
 */
export async function validateAndFetchAsset(urlStr: string): Promise<Buffer> {
  if (!urlStr || typeof urlStr !== "string") {
    throw new Error("Invalid asset URL.");
  }

  // Local static asset path from public directory
  if (urlStr.startsWith("/")) {
    const safePath = path.normalize(urlStr).replace(/^(\.\.[\/\\])+/, "");
    const fullPath = path.join(process.cwd(), "public", safePath);
    try {
      return await fs.readFile(fullPath);
    } catch {
      throw new Error(`Local asset not found: ${safePath}`);
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error("Invalid URL format.");
  }

  // 1. Strict Protocol check (HTTP/HTTPS only)
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Disallowed URL scheme: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject internal / metadata / loopback hostnames
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".local") ||
    hostname === "metadata.google.internal"
  ) {
    throw new Error(`Access to local/internal host "${hostname}" is forbidden.`);
  }

  // 3. Direct IP format checks
  if (isPrivateIp(hostname)) {
    throw new Error(`Access to private IP "${hostname}" is forbidden.`);
  }

  // 4. Host Allowlist check
  const isAllowedHost = ALLOWED_HOSTS.has(hostname) ||
    hostname.endsWith(".cloudinary.com") ||
    hostname.endsWith(".unsplash.com");

  if (!isAllowedHost) {
    throw new Error(`Host "${hostname}" is not in the approved external assets allowlist.`);
  }

  // 5. DNS Resolution check (prevent DNS rebinding to private/loopback IP)
  try {
    const lookup = await dns.promises.lookup(hostname, { all: true });
    for (const record of lookup) {
      if (isPrivateIp(record.address)) {
        throw new Error(`Resolved address ${record.address} for host "${hostname}" is a forbidden private address.`);
      }
    }
  } catch (dnsErr: any) {
    if (dnsErr.message.includes("forbidden private address")) {
      throw dnsErr;
    }
    throw new Error(`DNS lookup failed for host "${hostname}".`);
  }

  // 6. Safe Fetch
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "TailoringTurba-MockupGenerator/1.0" },
    });
    if (!res.ok) throw new Error(`Remote asset returned HTTP ${res.status}`);
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } finally {
    clearTimeout(timeout);
  }
}
