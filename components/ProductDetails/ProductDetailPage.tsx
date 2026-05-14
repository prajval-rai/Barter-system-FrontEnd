import type { Product } from '@/types/product';
import ProductGallery from './ProductGallery';
import ProductMeta from './ProductMeta';
import ProductActions from './ProductActions';
import OwnerCard from './OwnerCard';
import ReplaceOptions from './ReplaceOptions';
import SimilarProducts from './SimilarProducts';
import styles from './ProductDetailPage.module.css';

interface Props {
  product: Product;
  similarProducts?: Product[];
}

export default function ProductDetailPage({ product, similarProducts = [] }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Breadcrumb ── */}
        <nav className={styles.breadcrumb}>
          <a href="/">Home</a>
          <span>/</span>
          <a href="/products">Products</a>
          <span>/</span>
          <span className={styles.breadcrumbActive}>{product.title}</span>
        </nav>

        {/* ── Main 2-col layout ── */}
        <div className={styles.mainGrid}>
          {/* Left: Gallery */}
          <div className={styles.leftCol}>
            <ProductGallery images={product.images} title={product.title} />
          </div>

          {/* Right: Info + Actions */}
          <div className={styles.rightCol}>
            <ProductMeta product={product} />

            <div className={styles.divider} />

            <ProductActions productId={product.id} productTitle={product.title} />

            <div className={styles.divider} />

            <OwnerCard owner={product.owner} />
          </div>
        </div>

        {/* ── Bottom sections ── */}
        <div className={styles.bottomSections}>
          <ReplaceOptions options={product.product_replace_options} />

          {similarProducts.length > 0 && (
            <>
              <div className={styles.divider} />
              <SimilarProducts/>
            </>
          )}
        </div>

      </div>
    </div>
  );
}