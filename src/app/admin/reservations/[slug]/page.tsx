import ListingReservationsClient from "@/components/admin/ListingReservationsClient";

export default async function ListingReservationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ListingReservationsClient slug={slug} />;
}
