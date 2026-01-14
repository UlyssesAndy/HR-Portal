"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, X, Upload } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";

interface PhotoUploadProps {
  employeeId: string;
  currentPhotoUrl: string | null;
  employeeName: string;
  onUploadSuccess?: (newUrl: string) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PhotoUpload({ 
  employeeId, 
  currentPhotoUrl, 
  employeeName, 
  onUploadSuccess,
  disabled = false,
  size = "md"
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("employeeId", employeeId);

      const res = await fetch("/api/employees/upload-photo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onUploadSuccess?.(data.url);
      // Refresh page to update avatar
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayUrl = previewUrl || currentPhotoUrl;

  const sizeClasses = {
    sm: "h-24 w-24",
    md: "h-32 w-32 text-3xl",
    lg: "h-40 w-40 text-4xl"
  };

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className="relative group">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      {/* Avatar with overlay */}
      <div className="relative">
        <UserAvatar
          name={employeeName}
          imageUrl={displayUrl}
          className={`${sizeClasses[size]} ring-4 ring-white/30 shadow-2xl`}
        />
        
        {/* Upload overlay */}
        {!disabled && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className={`${iconSizes[size]} text-white animate-spin`} />
            ) : (
              <Camera className={`${iconSizes[size]} text-white`} />
            )}
          </button>
        )}
        
        {/* Clear preview button */}
        {previewUrl && !isUploading && (
          <button
            onClick={handleClear}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      
      {/* Status text */}
      {!disabled && (
        <p className="mt-2 text-xs text-white/80 text-center">
          {isUploading ? "Uploading..." : "Hover to change photo"}
        </p>
      )}
      
      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-200 text-center font-medium bg-red-500/20 px-2 py-1 rounded">{error}</p>
      )}
    </div>
  );
}
