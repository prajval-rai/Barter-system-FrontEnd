import Link from "next/link";
import Image from "next/image";
import styles from "./Emptynoitems.module.css";
import GiftBox from "../../../public/Image/NewUser/swap/giftBox.png";

export default function EmptyNoItems() {
  return (
    <div className={styles.card}>
      <div className={styles.illustrationSlot}>
        <Image
          src={GiftBox}
          alt="Empty box"
          width={160}
          height={140}
          className={styles.illustration}
          priority
        />
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>You haven't added any items yet</h3>
        <p className={styles.desc}>
          Start by adding your first item to find amazing exchange opportunities.
        </p>
        <Link href="/add-item" className={styles.addBtn}>
          <PlusIcon />
          Add Item
        </Link>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}