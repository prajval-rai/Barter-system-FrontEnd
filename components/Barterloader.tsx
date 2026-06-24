import styles from "@/styles/AddProduct.module.css";

interface BarterLoaderProps {
  text?: string;
}

export default function BarterLoader({ text = "Listing Your Item..." }: BarterLoaderProps) {
  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderBox}>
        {/* Animated scales of justice / barter icon */}
        <div className={styles.scalesWrap}>
          <div className={styles.glowRing} />

          
          <div className={styles.scalesArm}>
            <div className={styles.scalesPan} style={{ position: "absolute", left: -14, top: -12 }} />
            <div className={styles.scalesPan} style={{ position: "absolute", right: -14, top: -12 }} />
          </div>
          <div className={styles.scalesBase} />
        </div>

        {/* Text */}
        <div className={styles.loaderText}>{text}</div>

        {/* Dots */}
        <div className={styles.loaderDots}>
          <div className={styles.loaderDot} />
          <div className={styles.loaderDot} />
          <div className={styles.loaderDot} />
        </div>

        <div className={styles.loaderSub}>Connecting to marketplace...</div>
      </div>
    </div>
  );
}