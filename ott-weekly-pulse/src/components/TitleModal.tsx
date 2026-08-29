"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTitle } from "@/hooks/useTitles";
import { TitleDetailContent } from "@/components/TitleDetailContent";

export function TitleModal({
  titleId,
  open,
  onOpenChange
}: {
  titleId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: title, isLoading } = useTitle(titleId ?? undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        {isLoading && (
          <div className="space-y-4 p-8">
            <div className="skeleton h-48 w-full rounded-xl" />
            <div className="skeleton h-5 w-2/3 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
          </div>
        )}
        {title && <TitleDetailContent title={title} />}
      </DialogContent>
    </Dialog>
  );
}
