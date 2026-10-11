"use client";

import { ErrorState } from "@/components/ErrorState";

/** Inside the service's frame: the bar and footer stay, the page itself says what happened. */
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState retry={retry} />;
}
