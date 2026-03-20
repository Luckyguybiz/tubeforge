'use client';

import { useEffect } from 'react';

/**
 * Client component that sets up an IntersectionObserver to reveal elements
 * with the "tf-reveal" class, and enables smooth scrolling on the document.
 *
 * Mount this once in the landing page; it requires no children.
 */
export function ScrollRevealProvider() {
  /* Intersection Observer for scroll-triggered reveals */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('tf-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' },
    );
    document.querySelectorAll('.tf-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Smooth scroll behavior */
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return null;
}
