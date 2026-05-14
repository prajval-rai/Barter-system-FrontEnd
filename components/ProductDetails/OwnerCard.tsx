import type { ProductOwner } from '@/types/product';
import styles from './OwnerCard.module.css';

interface Props {
  owner: ProductOwner;
}

export default function OwnerCard({ owner }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.avatar}>
        <span>{owner.id}</span>
      </div>
      <div className={styles.info}>
        <p className={styles.name}>Owner #{owner.id}</p>
        {owner.rating !== null && (
          <p className={styles.rating}>
            ★ {owner.rating.toFixed(1)}
          </p>
        )}
        <p className={styles.address}>
          <PinIcon />
          {owner.address}
        </p>
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}