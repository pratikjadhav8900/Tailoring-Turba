import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  illustration: string;
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  illustration,
  title,
  description,
  ctaText = "Start Shopping",
  ctaHref = "/products",
  onCtaClick
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.illustrationWrapper}>
        <Image 
          src={illustration} 
          alt={title} 
          width={300} 
          height={300} 
          className={styles.illustration}
          priority
        />
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {ctaText && ctaHref && (
        <Link href={ctaHref} className={styles.cta} onClick={onCtaClick}>
          {ctaText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
