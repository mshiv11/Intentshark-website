import siteData from "../data/siteData.json";

/**
 * Minimal WebSite JSON-LD. The blog collection is gone, so there is no post type.
 */
export default function jsonLDGenerator({ url }) {
  const payload = {
    "@context": "https://schema.org/",
    "@type": "WebSite",
    name: siteData.title,
    description: siteData.description,
    url: url || import.meta.env.SITE,
  };

  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}
