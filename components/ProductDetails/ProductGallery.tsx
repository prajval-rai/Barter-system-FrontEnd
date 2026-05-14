'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ProductImage } from '@/types/product';
import styles from './ProductGallery.module.css';

interface Props {
  images: ProductImage[];
  title: string;
}

export default function ProductGallery({ images, title }: Props) {
  console.log("JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",images)
  const [active, setActive] = useState(0);

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImage}>
        <Image
          src={images[active]?.image ?? '/placeholder.png'}
          alt={title}
          fill
          className={styles.img}
          priority
        />
      </div>

      {images.length > 1 && (
        <div className={styles.thumbs}>
          {images.map((img, i) => (
            <button
              key={img.id}
              className={`${styles.thumb} ${i === active ? styles.thumbActive : ''}`}
              onClick={() => setActive(i)}
            >
              <Image src={img.image} alt={`${title} ${i + 1}`} fill className={styles.img} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}