#!/usr/bin/env node
/**
 * Points the Printful store's webhook at this site.
 *
 *   PRINTFUL_API_KEY=... PRINTFUL_WEBHOOK_SECRET=... [PRINTFUL_STORE_ID=...] \
 *     node scripts/register-printful-webhook.mjs https://your-domain.example
 *
 * Printful keeps one webhook URL per store; running this again replaces it.
 * The secret travels in the URL query because Printful v1 webhooks are not
 * signed; /api/printful/webhook rejects requests without it.
 */
const [, , baseUrl] = process.argv;
const { PRINTFUL_API_KEY, PRINTFUL_WEBHOOK_SECRET, PRINTFUL_STORE_ID } = process.env;

if (!baseUrl || !/^https:\/\//.test(baseUrl)) {
  console.error("usage: register-printful-webhook.mjs https://<site>");
  process.exit(2);
}
if (!PRINTFUL_API_KEY || !PRINTFUL_WEBHOOK_SECRET) {
  console.error("PRINTFUL_API_KEY and PRINTFUL_WEBHOOK_SECRET must be set");
  process.exit(2);
}

const url = `${baseUrl.replace(/\/$/, "")}/api/printful/webhook?secret=${encodeURIComponent(PRINTFUL_WEBHOOK_SECRET)}`;
const headers = {
  Authorization: `Bearer ${PRINTFUL_API_KEY}`,
  "Content-Type": "application/json",
  ...(PRINTFUL_STORE_ID ? { "X-PF-Store-Id": PRINTFUL_STORE_ID } : {}),
};

const response = await fetch("https://api.printful.com/webhooks", {
  method: "POST",
  headers,
  body: JSON.stringify({
    url,
    types: ["package_shipped", "order_failed", "order_canceled", "order_put_hold", "order_remove_hold", "order_updated"],
  }),
});
const body = await response.json().catch(() => ({}));
if (!response.ok) {
  console.error(`Printful ${response.status}:`, body?.error?.message ?? body);
  process.exit(1);
}
console.log("Webhook registered for", body.result?.types?.join(", "));
