import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Image as ImageIcon } from "lucide-react";

export const NoticeManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noticeId, setNoticeId] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  useEffect(() => {
    fetchNotice();
  }, []);

  const fetchNotice = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_notices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      setNoticeId(data.id);
      setIsEnabled(data.is_enabled);
      setTitle(data.title);
      setContent(data.content);
      setImageUrl(data.image_url || "");
      setLinkUrl(data.link_url || "");
      setLinkText(data.link_text || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const noticeData = {
      is_enabled: isEnabled,
      title,
      content,
      image_url: imageUrl || null,
      link_url: linkUrl || null,
      link_text: linkText || null,
    };

    let error;
    if (noticeId) {
      const result = await supabase
        .from("site_notices")
        .update(noticeData)
        .eq("id", noticeId);
      error = result.error;
    } else {
      const result = await supabase
        .from("site_notices")
        .insert([noticeData])
        .select()
        .single();
      
      if (result.data) {
        setNoticeId(result.data.id);
      }
      error = result.error;
    }

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save notice",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Notice saved successfully",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Site Notice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Enable Notice Popup</Label>
            <p className="text-sm text-muted-foreground">
              Display notice popup when users visit the site
            </p>
          </div>
          <Switch
            id="enabled"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Notice Title</Label>
          <Input
            id="title"
            placeholder="Enter notice title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Notice Content</Label>
          <Textarea
            id="content"
            placeholder="Enter notice content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <div className="flex gap-2">
            <Input
              id="imageUrl"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <Button variant="outline" size="icon" type="button">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
          {imageUrl && (
            <div className="mt-2 rounded-md border overflow-hidden">
              <img
                src={imageUrl}
                alt="Notice preview"
                className="w-full h-48 object-cover"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkUrl">Link URL (Optional)</Label>
          <Input
            id="linkUrl"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkText">Link Button Text (Optional)</Label>
          <Input
            id="linkText"
            placeholder="Learn More"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Notice
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
