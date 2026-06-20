// components/ProductDetail/ExchangeSection.tsx
import { Repeat2, Zap, BookOpen } from "lucide-react";
import { Icon } from "@iconify/react";
import styles from "@/styles/Productdetail.module.css";

interface ReplaceOption {
  id: number;
  title: string;
  description: string;
  category: string;
}

interface Props {
  replaceOptions: ReplaceOption[];
  productIcon: string;
  purchaseBill: string | null;
}

export default function ExchangeSection({ replaceOptions, productIcon, purchaseBill }: Props) {
  return (
    <>
      <div className={styles.exchangeSection}>
        <div className={styles.exchangeHeader}>
          <Repeat2 size={15} /><span>Will exchange for</span>
        </div>
        <div className={styles.exchangeList}>
          {replaceOptions.length > 0 ? (
            replaceOptions.map(opt => (
              <div key={opt.id} className={styles.LenDenem}>
                <div className={styles.LenDenemIcon}>
                  <Icon icon={productIcon || "noto:package"} width="18" height="18" />
                </div>
                <div className={styles.LenDenemInfo}>
                  <p className={styles.LenDenemTitle}>{opt.title}</p>
                  {opt.description && <p className={styles.LenDenemDesc}>{opt.description}</p>}
                  <span className={styles.LenDenemCat}>{opt.category}</span>
                </div>
                <Zap size={12} className={styles.exchangeZap} />
              </div>
            ))
          ) : (
            <p className={styles.noExchange}>Open to any reasonable offer</p>
          )}
        </div>
      </div>

      {purchaseBill && (
        <a
          href={purchaseBill}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.billLink}
        >
          <BookOpen size={14} /> View purchase bill / receipt
        </a>
      )}
    </>
  );
}