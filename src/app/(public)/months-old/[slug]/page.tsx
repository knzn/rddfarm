import ReservationForm from "@/components/landing/ReservationForm";

export default async function MonthsOldFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ReservationForm slug={slug} type="months-old" />;
}
