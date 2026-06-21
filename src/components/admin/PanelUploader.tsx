'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, ArrowUp, ArrowDown, Move } from 'lucide-react';

interface Panel {
  r2_key: string;
  cdn_url: string;
  display_order: number;
  width: number;
  height: number;
}

interface PanelUploaderProps {
  storySlug: string;
  episodeNumber: number;
  panels: Panel[];
  onChange: (panels: Panel[]) => void;
}

export function PanelUploader({ storySlug, episodeNumber, panels, onChange }: PanelUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  // Helper to convert images to WebP blob and get dimensions
  const processImage = (file: File): Promise<{ blob: Blob; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, width: img.width, height: img.height });
            } else {
              reject(new Error('Blob conversion failed'));
            }
            URL.revokeObjectURL(img.src);
          },
          'image/webp',
          0.85 // quality compression setting
        );
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(img.src);
        reject(err);
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setErrorMsg(null);
    setUploadProgress(0);

    const uploadedPanels: Panel[] = [...panels];
    const totalFiles = files.length;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        // 1. Convert to WebP client-side and extract dimensions
        const { blob, width, height } = await processImage(file);
        
        // 2. Request presigned upload URL
        const uploadResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'panel',
            storySlug,
            episodeNumber,
            filename: `${file.name.split('.')[0]}.webp`,
            contentType: 'image/webp',
          }),
        });

        if (!uploadResponse.ok) {
          const errRes = await uploadResponse.json();
          throw new Error(errRes.error || 'Failed to request presigned upload URL');
        }

        const { uploadUrl, key, cdnUrl } = await uploadResponse.json();

        // 3. Upload binary WebP Blob directly to Cloudflare R2
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/webp',
          },
          body: blob,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload manga panel to Cloudflare storage');
        }

        // 4. Add to lists
        uploadedPanels.push({
          r2_key: key,
          cdn_url: cdnUrl,
          display_order: uploadedPanels.length,
          width,
          height,
        });

        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      onChange(uploadedPanels);
    } catch (err: any) {
      console.error('Panel upload error:', err);
      setErrorMsg(err.message || 'Error occurred during image upload.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removePanel = (index: number) => {
    const updated = panels.filter((_, i) => i !== index).map((panel, idx) => ({
      ...panel,
      display_order: idx,
    }));
    onChange(updated);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...panels];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    
    // Recalculate display orders
    const sorted = updated.map((panel, idx) => ({
      ...panel,
      display_order: idx,
    }));
    onChange(sorted);
  };

  const moveDown = (index: number) => {
    if (index === panels.length - 1) return;
    const updated = [...panels];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    
    const sorted = updated.map((panel, idx) => ({
      ...panel,
      display_order: idx,
    }));
    onChange(sorted);
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === index) return;

    const updated = [...panels];
    const draggedItem = updated[dragIndex];
    
    // Remove dragged item
    updated.splice(dragIndex, 1);
    // Insert at new index
    updated.splice(index, 0, draggedItem);

    const sorted = updated.map((panel, idx) => ({
      ...panel,
      display_order: idx,
    }));
    
    onChange(sorted);
    dragIndexRef.current = null;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center border-t border-border-custom/50 pt-4 mt-2">
        <h4 className="text-small font-semibold text-text-secondary uppercase tracking-wider">
          Episode Panels ({panels.length})
        </h4>
        <span className="text-[10px] text-text-muted">Drag panels or use arrows to sort</span>
      </div>

      {/* Upload trigger box */}
      <div className="border-2 border-dashed border-border-custom bg-background/50 hover:bg-surface-hover/20 transition-all rounded-lg p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer relative min-h-[140px]">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          disabled={uploading}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            <div>
              <span className="text-caption text-text-primary block font-semibold">
                Uploading panel layout ({uploadProgress}%)
              </span>
              <span className="text-[10px] text-text-muted mt-1 block">Converting to WebP & saving to CDN</span>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-text-muted" />
            <div>
              <span className="text-caption font-semibold text-text-primary block">
                Select or drag multiple comic panels
              </span>
              <span className="text-[10px] text-text-muted block mt-1">
                Supports bulk uploads. Recommends WebP/PNG/JPG.
              </span>
            </div>
          </>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded bg-status-error/10 border border-status-error/25 text-status-error text-caption">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Panels Grid for Sorting and Previewing */}
      {panels.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-2">
          {panels.map((panel, index) => (
            <div
              key={`${panel.r2_key}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              className="group relative aspect-[3/4] rounded-lg border border-border-custom bg-background overflow-hidden cursor-move hover:border-brand-primary/50 transition-colors flex flex-col"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={panel.cdn_url} alt={`Panel ${index + 1}`} className="w-full h-full object-cover pointer-events-none select-none" />
              
              {/* Index indicator */}
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] bg-black/75 border border-border-custom font-mono text-brand-primary">
                #{index + 1}
              </span>

              {/* Drag indicator icon */}
              <div className="absolute top-2 right-2 p-1 rounded bg-black/75 border border-border-custom opacity-70 group-hover:opacity-100 transition-opacity">
                <Move className="w-3 h-3 text-text-secondary" />
              </div>

              {/* Action Buttons Toolbar overlay */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removePanel(index)}
                    className="p-1 rounded bg-status-error/20 hover:bg-status-error/40 text-status-error border border-status-error/30 cursor-pointer"
                    title="Remove panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-1 mt-auto bg-black/60 p-1 rounded border border-border-custom/50">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-surface-hover border border-border-custom disabled:opacity-30 cursor-pointer text-text-primary"
                    title="Move up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-text-muted font-mono">{panel.width}x{panel.height}</span>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === panels.length - 1}
                    className="p-1 rounded hover:bg-surface-hover border border-border-custom disabled:opacity-30 cursor-pointer text-text-primary"
                    title="Move down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
