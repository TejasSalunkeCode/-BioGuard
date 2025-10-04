import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image, FileText, Microscope, Pill, Download, ZoomIn, X } from "lucide-react";
import { Attachment, AttachmentType } from "@/lib/healthJournalTypes";
import { format } from "date-fns";

interface AttachmentGalleryProps {
  attachments: Attachment[];
  compact?: boolean;
}

const AttachmentGallery = ({ attachments, compact = false }: AttachmentGalleryProps) => {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

  const getTypeIcon = (type: AttachmentType) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />;
      case "lab_result":
        return <Microscope className="h-4 w-4" />;
      case "prescription":
        return <Pill className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: AttachmentType) => {
    switch (type) {
      case "image":
        return "Medical Image";
      case "lab_result":
        return "Lab Result";
      case "prescription":
        return "Prescription";
      default:
        return "Document";
    }
  };

  const getTypeColor = (type: AttachmentType) => {
    switch (type) {
      case "image":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/20";
      case "lab_result":
        return "bg-green-100 text-green-700 dark:bg-green-950/20";
      case "prescription":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/20";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-950/20";
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {attachments.slice(0, 3).map((attachment) => (
            <div
              key={attachment.id}
              className="h-8 w-8 rounded border-2 border-background overflow-hidden cursor-pointer hover:scale-110 transition-transform"
              onClick={() => setSelectedAttachment(attachment)}
            >
              {attachment.dataUrl.startsWith('data:image') ? (
                <img 
                  src={attachment.dataUrl} 
                  alt={attachment.fileName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
        {attachments.length > 3 && (
          <span className="text-xs text-muted-foreground">+{attachments.length - 3}</span>
        )}
        {selectedAttachment && (
          <AttachmentViewDialog
            attachment={selectedAttachment}
            onClose={() => setSelectedAttachment(null)}
            onDownload={handleDownload}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {attachments.map((attachment) => (
          <Card
            key={attachment.id}
            className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedAttachment(attachment)}
          >
            {/* Thumbnail */}
            <div className="aspect-square bg-muted relative">
              {attachment.dataUrl.startsWith('data:image') ? (
                <img 
                  src={attachment.dataUrl} 
                  alt={attachment.fileName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center p-4">
                  <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-xs text-center text-muted-foreground truncate w-full">
                    {attachment.fileName}
                  </p>
                </div>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white" />
              </div>

              {/* Type Badge */}
              <Badge className={`absolute top-2 left-2 ${getTypeColor(attachment.type)}`}>
                {getTypeIcon(attachment.type)}
                <span className="ml-1 text-xs">{getTypeLabel(attachment.type)}</span>
              </Badge>
            </div>

            {/* Info */}
            <div className="p-2">
              <p className="text-xs font-medium truncate">{attachment.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.fileSize)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {selectedAttachment && (
        <AttachmentViewDialog
          attachment={selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
          onDownload={handleDownload}
        />
      )}
    </>
  );
};

// Attachment View Dialog Component
interface AttachmentViewDialogProps {
  attachment: Attachment;
  onClose: () => void;
  onDownload: (attachment: Attachment) => void;
}

const AttachmentViewDialog = ({ attachment, onClose, onDownload }: AttachmentViewDialogProps) => {
  const getTypeIcon = (type: AttachmentType) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />;
      case "lab_result":
        return <Microscope className="h-4 w-4" />;
      case "prescription":
        return <Pill className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: AttachmentType) => {
    switch (type) {
      case "image":
        return "Medical Image";
      case "lab_result":
        return "Lab Result";
      case "prescription":
        return "Prescription";
      default:
        return "Document";
    }
  };

  const getTypeColor = (type: AttachmentType) => {
    switch (type) {
      case "image":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/20";
      case "lab_result":
        return "bg-green-100 text-green-700 dark:bg-green-950/20";
      case "prescription":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/20";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-950/20";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Badge className={getTypeColor(attachment.type)}>
                {getTypeIcon(attachment.type)}
                <span className="ml-1">{getTypeLabel(attachment.type)}</span>
              </Badge>
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(attachment)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Preview */}
          <div className="bg-muted rounded-lg overflow-hidden">
            {attachment.dataUrl.startsWith('data:image') ? (
              <img 
                src={attachment.dataUrl} 
                alt={attachment.fileName}
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            ) : (
              <div className="p-12 text-center">
                <FileText className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">{attachment.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  PDF preview not available. Click download to view the file.
                </p>
              </div>
            )}
          </div>

          {/* File Info */}
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">File Name</p>
                <p className="font-medium break-all">{attachment.fileName}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">File Size</p>
                <p className="font-medium">{formatFileSize(attachment.fileSize)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Type</p>
                <p className="font-medium">{getTypeLabel(attachment.type)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Uploaded</p>
                <p className="font-medium">
                  {format(new Date(attachment.uploadedAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              {attachment.caption && (
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Caption</p>
                  <p className="font-medium">{attachment.caption}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentGallery;
