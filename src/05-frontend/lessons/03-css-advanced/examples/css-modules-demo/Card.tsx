/**
 * CSS Modules Demo — Card Component
 *
 * This shows how to use CSS Modules in a React + Vite + TypeScript project.
 * The `styles` object maps class names from Card.module.css to their
 * generated unique names.
 *
 * To run this, place these files in a Vite + React project and import the Card component.
 */

import styles from './Card.module.css';

interface CardProps {
  title: string;
  participants: number;
  budget: number;
  status: 'open' | 'drawn' | 'closed';
}

function Card({ title, participants, budget, status }: CardProps) {
  // Pick the right badge class based on status
  const badgeClass =
    status === 'closed'
      ? `${styles.badge} ${styles.badgeClosed}`
      : status === 'drawn'
        ? `${styles.badge} ${styles.badgeDrawn}`
        : styles.badge;

  return (
    <article className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.meta}>
        {participants} participants &middot; ${budget} budget
      </p>
      <span className={badgeClass}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </article>
  );
}

export default Card;

/**
 * Usage example:
 *
 * <Card title="Engineering Team" participants={12} budget={25} status="open" />
 * <Card title="Family Holiday" participants={8} budget={50} status="drawn" />
 * <Card title="College Friends" participants={10} budget={30} status="closed" />
 */
