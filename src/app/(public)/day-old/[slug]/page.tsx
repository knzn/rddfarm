import ReservationForm from "@/components/landing/ReservationForm";

export default async function DayOldFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ReservationForm slug={slug} type="day-old" />;
}
