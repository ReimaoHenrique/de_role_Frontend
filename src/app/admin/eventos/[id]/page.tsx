import { AdminEventDetail } from "@/components/admin/admin-event-detail";

export const dynamic = "force-dynamic";

interface AdminEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEventPage({ params }: AdminEventPageProps) {
  const { id } = await params;

  return <AdminEventDetail id={id} />;
}
