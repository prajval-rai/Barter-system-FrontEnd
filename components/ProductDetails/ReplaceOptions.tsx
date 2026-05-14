import type { ReplaceOption } from '@/types/product';
import styles from './ReplaceOptions.module.css';

interface Props {
  options: ReplaceOption[];
}

export default function ReplaceOptions({ options }: Props) {
  if (!options.length) return null;ReplaceOptions

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Accepted in Exchange</h2>
      <div className={styles.list}>
        {options.map((opt) => (
          <div key={opt.id} className={styles.card}>
            <div className={styles.iconWrap}>
              {/* Iconify-style: render as text emoji fallback if no iconify loaded */}
              <span className={styles.icon}>{resolveEmoji(opt.icon)}</span>
            </div>
            <div className={styles.info}>
              <p className={styles.title}>{opt.title}</p>
              <p className={styles.desc}>{opt.description}</p>
              <span className={styles.category}>{opt.category}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Rough emoji fallback for common iconify icon names */
function resolveEmoji(icon: string): string {
  const map: Record<string, string> = {
    'noto:bicycle': '🚲',
    'noto:laptop':  '💻',
    'noto:book':    '📚',
    'noto:mobile-phone': '📱',
  };
  return map[icon] ?? '📦';
}