"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink, FolderOpen, File } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  size?: string;
}

export default function DrivePage() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  async function fetchFiles(pageToken?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "50" });
      if (pageToken) params.set("pageToken", pageToken);
      const res = await fetch(`/api/google/drive?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setFiles((prev) => (pageToken ? [...prev, ...(json.files ?? [])] : json.files ?? []));
      setNextPageToken(json.nextPageToken ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load Drive files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFiles();
  }, []);

  function isFolder(mimeType: string) {
    return mimeType === "application/vnd.google-apps.folder";
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Google Drive</h2>

      {loading && files.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {files.length === 0 && (
                <p className="p-6 text-center text-muted-foreground">
                  No files found.
                </p>
              )}
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30"
                >
                  {isFolder(file.mimeType) ? (
                    <FolderOpen className="h-5 w-5 text-yellow-500 shrink-0" />
                  ) : (
                    <File className="h-5 w-5 text-blue-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    {file.modifiedTime && (
                      <p className="text-xs text-muted-foreground">
                        Modified {format(new Date(file.modifiedTime), "PPP")}
                      </p>
                    )}
                  </div>
                  {file.size && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round(parseInt(file.size) / 1024)} KB
                    </span>
                  )}
                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {nextPageToken && (
        <Button variant="outline" onClick={() => fetchFiles(nextPageToken)} disabled={loading}>
          Load more
        </Button>
      )}
    </div>
  );
}
