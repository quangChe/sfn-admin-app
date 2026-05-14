import { redirect } from "next/navigation";

export default async function DropTagRoot({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  redirect(`/drops/${tag}/pricing`);
}
