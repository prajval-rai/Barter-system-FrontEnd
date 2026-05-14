import type { Product } from '@/types/product';
import styles from './ProductMeta.module.css';

interface Props {
  product: Product;
}

const STATUS_LABEL: Record<Product['status'], string> = {
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  swapped: 'Swapped',
};

const STATUS_CLASS: Record<Product['status'], string> = {
  submitted: 'statusSubmitted',
  approved: 'statusApproved',
  rejected: 'statusRejected',
  swapped: 'statusSwapped',
};

export default function ProductMeta({ product }: Props) {
  const age = new Date().getFullYear() - product.purchase_year;

  return (
    <div className={styles.meta}>
      {/* Top row — category + status */}
      <div className={styles.topRow}>
        <span className={styles.category}>{product.category.name}</span>
        <span className={`${styles.status} ${styles[STATUS_CLASS[product.status]]}`}>
          {STATUS_LABEL[product.status]}
        </span>
      </div>

      {/* Title */}
      <h1 className={styles.title}>{product.title}</h1>

      {/* Quick stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Purchase Year</span>
          <span className={styles.statValue}>{product.purchase_year}</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statLabel}>Age</span>
          <span className={styles.statValue}>{age} yr{age !== 1 ? 's' : ''}</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statLabel}>Bill Available</span>
          <span className={styles.statValue}>{product.purchase_bill ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {/* Description */}
      <div className={styles.descBlock}>
        <h3 className={styles.descHeading}>Description</h3>
        <p className={styles.desc}>{product.description}</p>
      </div>
    </div>
  );
}