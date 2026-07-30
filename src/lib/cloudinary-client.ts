export function getResizedCloudinaryUrl(url: string, width = 800, height = 800): string {
  if (!url || typeof url !== 'string' || !url.includes("res.cloudinary.com")) return url;
  // If it already has transformation parameters, skip
  if (url.includes("/c_") || url.includes("/w_") || url.includes("/h_")) return url;
  
  // Format check: we want to keep animated gifs intact
  if (url.endsWith(".gif")) return url;

  return url.replace("/image/upload/", `/image/upload/c_fill,g_auto,w_${width},h_${height},q_auto,f_auto/`);
}
