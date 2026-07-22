"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy /studio route — maker lives on the homepage. */
export default function StudioRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">
      Opening maker…
    </div>
  );
}
