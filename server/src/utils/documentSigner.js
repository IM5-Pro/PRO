import crypto from "crypto";

const DEFAULT_EXPIRY_SECONDS = 10 * 60;

const generateSignedDocumentUrl = (fileUrl, expirySeconds = DEFAULT_EXPIRY_SECONDS) => {
  if (!fileUrl || typeof fileUrl !== "string") {
    return fileUrl;
  }

  const secret = process.env.DOCUMENT_SIGNING_SECRET;
  if (!secret) {
    return fileUrl;
  }

  try {
    const expiresAt = Math.floor(Date.now() / 1000) + expirySeconds;
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${fileUrl}:${expiresAt}`)
      .digest("hex");

    const delimiter = fileUrl.includes("?") ? "&" : "?";
    return `${fileUrl}${delimiter}exp=${expiresAt}&sig=${signature}`;
  } catch (_error) {
    return fileUrl;
  }
};

export { generateSignedDocumentUrl };
