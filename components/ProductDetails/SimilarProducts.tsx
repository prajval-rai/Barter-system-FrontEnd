import styles from './SimilarProducts.module.css';

export default function SimilarProducts() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Similar Products</h2>
      <div className={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.card}>
            <div className={`${styles.imgWrap} ${styles.skeleton}`} />
            <div className={styles.info}>
              <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonYear}`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}