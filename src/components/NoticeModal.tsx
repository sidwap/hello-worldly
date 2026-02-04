import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { X, ExternalLink } from "lucide-react";

interface NoticeModalProps {
  onClose: () => void;
}

export const NoticeModal = ({ onClose }: NoticeModalProps) => {
  const [notice, setNotice] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotice();
  }, []);

  const fetchNotice = async () => {
    const { data, error } = await supabase
      .from("site_notices")
      .select("*")
      .eq("is_enabled", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      setNotice(data);
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (!notice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          {notice.image_url && (
            <div className="w-full h-[400px] overflow-hidden bg-muted">
              <img
                src={notice.image_url}
                alt={notice.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="p-8 space-y-6">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {notice.title}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-foreground/80">
              {notice.content}
            </DialogDescription>
          </DialogHeader>

          {notice.link_url && (
            <div className="flex justify-center pt-2">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                onClick={() => window.open(notice.link_url, "_blank")}
              >
                {notice.link_text || "Learn More"}
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
