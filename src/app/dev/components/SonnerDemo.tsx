"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SonnerDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => toast.success("Saved successfully")}>Success</Button>
      <Button variant="destructive" onClick={() => toast.error("Something went wrong")}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.info("Heads up — info toast")}>
        Info
      </Button>
      <Button variant="secondary" onClick={() => toast.warning("Be careful")}>
        Warning
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          const id = toast.loading("Generating thumbnail…");
          setTimeout(() => toast.success("Done", { id }), 1500);
        }}
      >
        Loading → success
      </Button>
    </div>
  );
}
