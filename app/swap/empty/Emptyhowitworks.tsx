import styles from "./Emptyhowitworks.module.css";
import giftBox from "../../../public/Image/NewUser/swap/gift_box.png";
import matchGift from "../../../public/Image/NewUser/swap/match_gift.png";
import chatImg from "../../../public/Image/NewUser/swap/chatImg.png"

const steps = [
  {
    num: 1,
    title: "Add Your Item",
    desc: "List items you no longer need in just a few steps.",
    img: giftBox.src,
    alt: "Add your item illustration",
  },
  {
    num: 2,
    title: "Get Matched",
    desc: "We'll find the right people who want your item.",
    img: matchGift.src,
    alt: "Get matched illustration",
  },
  {
    num: 3,
    title: "Chat & Exchange",
    desc: "Chat securely, agree and exchange with confidence.",
    img: chatImg.src,
    alt: "Chat and exchange illustration",
  },
];

export default function EmptyHowItWorks() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>How it works?</h2>

        <div className={styles.steps}>
          {steps.map((step, i) => (
            <div key={step.num} className={styles.stepWrapper}>

              <div className={styles.card}>
                {/* Top: number + text */}
                <div className={styles.cardTop}>
                  <div className={styles.stepNum}>{step.num}</div>
                  <div className={styles.cardText}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepDesc}>{step.desc}</p>
                  </div>
                </div>

                {/* Bottom: illustration */}
                <div className={styles.illustrationSlot}>
                  {step.img ? (
                    <img
                      src={step.img}
                      alt={step.alt}
                      className={styles.illustration}
                    />
                  ) : (
                    <div className={styles.imgPlaceholder} />
                  )}
                </div>
              </div>

              {/* Arrow between steps */}
              {i < steps.length - 1 && (
                <div className={styles.arrow}>
                  <ArrowIcon />
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V8m0 0l-3 3m3-3 3 3M17 8v8m0 0 3-3m-3 3-3-3" />
    </svg>
  );
}