import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.line}>
        Built by{" "}
        <a href="https://x.com/raaajul" className={styles.link}>
          Rajul
        </a>
        . Used at{" "}
        <a href="https://pred.app" className={styles.link}>
          Pred
        </a>
        .
      </p>
      <div className={styles.links}>
        <a href="https://github.com/sp00kid/orderkit" className={styles.link}>
          GitHub
        </a>
        <span className={styles.dot}>&middot;</span>
        <a href="https://www.npmjs.com/package/orderkit" className={styles.link}>
          npm
        </a>
      </div>
    </footer>
  );
}
