import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, Image, FileText, Microscope, Pill, AlertCircle } from "lucide-react";
import { Attachment, AttachmentType } from "@/lib/healthJournalTypes";
import { toast } from "sonner";

interface AttachmentUploaderProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFileSize?: number; // in MB
  maxFiles?: number;
}

const AttachmentUploader = ({ 
  attachments, 
  onAttachmentsChange,
  maxFileSize = 10,
  maxFiles = 10
}: AttachmentUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<AttachmentType>("image");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);

    try {
      const newAttachments: Attachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxFileSize) {
          toast.error(`${file.name} exceeds ${maxFileSize}MB limit`);
          continue;
        }

        // Check file type
        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';
        
        if (!isImage && !isPDF) {
          toast.error(`${file.name} must be an image or PDF`);
          continue;
        }

        // Convert to base64
        const dataUrl = await readFileAsDataURL(file);

        const attachment: Attachment = {
          id: `attachment-${Date.now()}-${i}`,
          type: selectedType,
          fileName: file.name,
          fileSize: file.size,
          dataUrl,
          uploadedAt: Date.now()
        };

        newAttachments.push(attachment);
      }

      onAttachmentsChange([...attachments, ...newAttachments]);
      toast.success(`${newAttachments.length} file(s) uploaded successfully`);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    onAttachmentsChange(attachments.filter(a => a.id !== attachmentId));
    toast.success("Attachment removed");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-3 block">Attachments (Optional)</Label>
        
        <Card className="p-4 border-dashed border-2">
          <div className="space-y-3">
            {/* Type Selector */}
            <div>
              <Label htmlFor="attachment-type" className="text-sm">Attachment Type</Label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as AttachmentType)}>
                <SelectTrigger id="attachment-type" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Medical Image (Rash, Wound, etc.)
                    </div>
                  </SelectItem>
                  <SelectItem value="lab_result">
                    <div className="flex items-center gap-2">
                      <Microscope className="h-4 w-4" />
                      Lab Result / Test Report
                    </div>
                  </SelectItem>
                  <SelectItem value="prescription">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Prescription / Medication
                    </div>
                  </SelectItem>
                  <SelectItem value="document">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Other Document
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading || attachments.length >= maxFiles}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || attachments.length >= maxFiles}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Files"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Images & PDFs only • Max {maxFileSize}MB per file • {attachments.length}/{maxFiles} files
            </p>
          </div>
        </Card>
      </div>

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Uploaded Attachments</Label>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <Card key={attachment.id} className="p-3">
                <div className="flex items-center gap-3">
                  {/* Preview Thumbnail */}
                  {attachment.dataUrl.startsWith('data:image') ? (
                    <img 
                      src={attachment.dataUrl} 
                      alt={attachment.fileName}
                      className="h-12 w-12 object-cover rounded border"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-muted rounded border flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getTypeColor(attachment.type)}>
                        {getTypeIcon(attachment.type)}
                        <span className="ml-1">{getTypeLabel(attachment.type)}</span>
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.fileSize)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Info Alert */}
      {attachments.length === 0 && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> Attach medical images, lab results, or prescriptions to track visual progress and keep important documents organized.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AttachmentUploader;
