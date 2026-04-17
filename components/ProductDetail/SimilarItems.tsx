// components/ProductDetail/SimilarItems.tsx
import { ChevronRight } from "lucide-react";
import styles from "@/styles/Productdetail.module.css";

interface Props {
  categoryName: string;
  onNavigate?: (id: string) => void;
}

export default function SimilarItems({ categoryName, onNavigate }: Props) {
  return (
    <div className={styles.similarSection}>
      <div className={styles.similarHeader}>
        <h2 className={styles.similarTitle}>More from {categoryName}</h2>
        <button className={styles.similarMore} onClick={() => onNavigate?.("marketplace")}>
          Browse all <ChevronRight size={14} />
        </button>
      </div>
      <div className={styles.similarPlaceholder}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={styles.similarCard} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className={styles.similarCardImg} />
            <div className={styles.similarCardBody}>
              <div className={styles.similarSkelLine} style={{ width: "60%" }} />
              <div className={styles.similarSkelLine} style={{ width: "85%", height: 13 }} />
              <div className={styles.similarSkelLine} style={{ width: "45%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}