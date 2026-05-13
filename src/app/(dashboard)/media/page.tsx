import { getShopifyClient } from "@/lib/shopify/client";
import { FILES_QUERY } from "@/lib/shopify/queries/media";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

async function getMediaFiles() {
  try {
    const client = await getShopifyClient();
    const { data } = await client.request(FILES_QUERY, {
      variables: { first: 48 },
    });
    return data?.files?.edges ?? [];
  } catch {
    return [];
  }
}

export default async function MediaPage() {
  const files = await getMediaFiles();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Media Library</h2>
      <p className="text-muted-foreground text-sm">
        Files from your Shopify media library ({files.length} shown)
      </p>

      {files.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No media files found.
        </p>
      )}

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {files.map(({ node }: { node: { id: string; alt?: string; fileStatus: string; createdAt: string; image?: { url: string; width?: number; height?: number; altText?: string }; url?: string; mimeType?: string } }) => (
          <Card key={node.id} className="overflow-hidden">
            <CardContent className="p-0">
              {node.image ? (
                <div className="aspect-square relative bg-muted">
                  <Image
                    src={node.image.url}
                    alt={node.image.altText ?? node.alt ?? ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                  />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center bg-muted text-xs text-muted-foreground p-2 text-center">
                  {node.mimeType ?? "file"}
                </div>
              )}
              <div className="p-2">
                <Badge variant="secondary" className="text-xs">
                  {node.fileStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
