export const LOCKIN_CONTACT_EMAIL = "contact@lockin.app";

export function buildContactMailtoUrl(senderEmail: string, message: string) {
  const subject = encodeURIComponent("Contact LockIn");
  const body = encodeURIComponent(`De : ${senderEmail.trim()}\n\n${message.trim()}`);
  return `mailto:${LOCKIN_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export function openContactMailto(senderEmail: string, message: string) {
  const url = buildContactMailtoUrl(senderEmail, message);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
