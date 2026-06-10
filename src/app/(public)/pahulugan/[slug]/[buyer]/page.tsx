import OrderView from "@/components/landing/OrderView";

export default async function PahuluganOrderPage({ params }: { params: Promise<{ slug: string; buyer: string }> }) {
  const { slug, buyer } = await params;
  return <OrderView listingSlug={slug} buyerSlug={buyer} />;
}
