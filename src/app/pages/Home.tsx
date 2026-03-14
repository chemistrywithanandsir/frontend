// src/app/pages/Home.tsx
import { Hero } from '../components/Hero';
import { ExamTracks } from '../components/ExamTracks';
import { ProductsSection } from '../components/ProductsSection';
import { ProblemSolution } from '../components/ProblemSolution';
import { PeriodicTable } from '../components/PeriodicTable';
import { MentorSection } from '../components/MentorSection';

export function HomePage() {
  return (
    <>
      <Hero />
      <ExamTracks />
      <ProductsSection />
      <ProblemSolution />
      <PeriodicTable />
      <MentorSection />
    </>
  );
}