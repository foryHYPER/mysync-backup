"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { 
  IconUpload, 
  IconFile, 
  IconCheck, 
  IconX,
  IconFileText,
  IconAlertCircle
} from "@tabler/icons-react";

interface FileUploadProps {
  candidateId: string;
  onUploadSuccess?: (fileUrl: string) => void;
  onUploadError?: (error: string) => void;
  maxSizeInMB?: number;
  acceptedFileTypes?: string[];
  existingFileUrl?: string;
}

export default function FileUpload({
  candidateId,
  onUploadSuccess,
  onUploadError,
  maxSizeInMB = 10,
  acceptedFileTypes = [".pdf", ".doc", ".docx"],
  existingFileUrl
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(existingFileUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    try {
      // Validate file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFileTypes.includes(fileExtension)) {
        const error = `Dateityp nicht unterstützt. Erlaubt: ${acceptedFileTypes.join(', ')}`;
        toast.error(error);
        onUploadError?.(error);
        return;
      }

      // Validate file size
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        const error = `Datei zu groß. Maximum: ${maxSizeInMB}MB`;
        toast.error(error);
        onUploadError?.(error);
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      // Generate unique filename
      const timestamp = new Date().getTime();
      const filename = `${candidateId}/${timestamp}_${file.name}`;

      // Show progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filename, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        throw uploadError;
      }

      const fileUrl = `resumes/${filename}`;

      // Create or update resume record in database
      const resumeData = {
        candidate_id: candidateId,
        filename: file.name,
        file_url: fileUrl,
        file_size: file.size,
        status: 'pending',
        analysis_complete: false,
        download_count: 0,
        match_count: 0
      };

      // Check if resume already exists for this candidate
      const { data: existingResume } = await supabase
        .from('resumes')
        .select('id')
        .eq('candidate_id', candidateId)
        .single();

      if (existingResume) {
        // Update existing resume
        const { error: updateError } = await supabase
          .from('resumes')
          .update({
            ...resumeData,
            last_updated: new Date().toISOString()
          })
          .eq('candidate_id', candidateId);

        if (updateError) throw updateError;
      } else {
        // Create new resume record
        const { error: insertError } = await supabase
          .from('resumes')
          .insert(resumeData);

        if (insertError) throw insertError;
      }

      setUploadedFile(fileUrl);
      toast.success("Lebenslauf erfolgreich hochgeladen!");
      onUploadSuccess?.(fileUrl);

    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error.message || "Fehler beim Hochladen";
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = async () => {
    try {
      if (uploadedFile) {
        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from('resumes')
          .remove([uploadedFile.replace('resumes/', '')]);

        if (deleteError) {
          console.error("Error deleting file:", deleteError);
        }

        // Remove from database
        await supabase
          .from('resumes')
          .delete()
          .eq('candidate_id', candidateId);
      }

      setUploadedFile(null);
      toast.success("Lebenslauf entfernt");
    } catch (error: any) {
      console.error("Error removing file:", error);
      toast.error("Fehler beim Entfernen der Datei");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconFileText className="h-5 w-5" />
          Lebenslauf hochladen
        </CardTitle>
        <CardDescription>
          Laden Sie Ihren Lebenslauf als PDF, DOC oder DOCX hoch (max. {maxSizeInMB}MB)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!uploadedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? "border-primary bg-primary/5" 
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="space-y-4">
                <IconUpload className="h-12 w-12 mx-auto text-gray-400 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Datei wird hochgeladen...</p>
                  <Progress value={uploadProgress} className="mt-2" />
                  <p className="text-xs text-gray-500 mt-1">{Math.round(uploadProgress)}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <IconUpload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-sm font-medium">
                    Datei hier ablegen oder{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      durchsuchen
                    </button>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {acceptedFileTypes.join(", ")} bis zu {maxSizeInMB}MB
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes.join(",")}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <IconCheck className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Lebenslauf hochgeladen
                  </p>
                  <p className="text-xs text-green-600">
                    Datei bereit zur Überprüfung
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-green-300 text-green-700">
                  <IconFileText className="h-3 w-3 mr-1" />
                  PDF
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <IconAlertCircle className="h-4 w-4" />
              <span>Ihr Lebenslauf wird von unserem Team überprüft</span>
            </div>

            <Button
              variant="outline"
              onClick={() => setUploadedFile(null)}
              className="w-full"
            >
              Andere Datei hochladen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 