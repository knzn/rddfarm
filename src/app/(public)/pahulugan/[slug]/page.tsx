import ReservationForm from "@/components/landing/ReservationForm";

export default async function PahuluganFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ReservationForm slug={slug} type="pahulugan" />;
}
