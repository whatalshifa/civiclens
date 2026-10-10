import { AppChrome } from "@/components/AppChrome";

/** Every page of the service shares the service frame. The landing page at / has its own. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppChrome>{children}</AppChrome>;
}
