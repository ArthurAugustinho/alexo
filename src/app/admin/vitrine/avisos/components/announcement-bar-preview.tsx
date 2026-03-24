type AnnouncementBarPreviewProps = {
  text: string;
  bgColor: string;
  textColor: string;
  linkUrl?: string;
};

export function AnnouncementBarPreview({
  text,
  bgColor,
  textColor,
  linkUrl,
}: AnnouncementBarPreviewProps) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs font-medium">Preview</p>
      <div
        style={{
          height: "36px",
          backgroundColor: bgColor,
          color: textColor,
          fontSize: "13px",
        }}
        className="flex w-full items-center justify-center rounded-lg px-4"
      >
        <span className="text-center">
          {text || "Texto do aviso"}
          {linkUrl && (
            <span className="ml-1 underline opacity-70">(com link)</span>
          )}
        </span>
      </div>
    </div>
  );
}
