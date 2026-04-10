import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'MAA Fashion Point';
const DEFAULT_DESC = 'Shop the latest ethnic wear, kurtis, sarees, and more at MAA Fashion Point. Best prices on premium Indian fashion.';
const DEFAULT_IMAGE = 'https://res.cloudinary.com/djmkaibyo/image/upload/v1/maa-fashion/logo_og';

/**
 * PageSEO — Drop into any page to set title, description, and OG tags
 * Usage: <PageSEO title="Kurti Collection" description="..." />
 */
export function PageSEO({ title, description, image, url, type = 'website' }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const metaDesc = description || DEFAULT_DESC;
  const metaImage = image || DEFAULT_IMAGE;
  const metaUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
}

/**
 * ProductSEO — Drop into ProductDetailPage for rich product structured data
 */
export function ProductSEO({ product }) {
  if (!product) return null;

  const title = `${product.name} - ${product.category}`;
  const description = product.description || `Buy ${product.name} at MAA Fashion Point`;
  const image = product.images?.[0]?.url || DEFAULT_IMAGE;
  const price = product.discountedPrice || product.price;
  const url = typeof window !== 'undefined' ? window.location.href : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: description,
    image: image,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand || 'Saanjh' },
    offers: {
      '@type': 'Offer',
      url: url,
      priceCurrency: 'INR',
      price: price,
      availability: product.totalStock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    aggregateRating: product.numReviews > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.numReviews,
    } : undefined,
  };

  return (
    <Helmet>
      <title>{title} | {SITE_NAME}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={`${title} | ${SITE_NAME}`} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="product" />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
