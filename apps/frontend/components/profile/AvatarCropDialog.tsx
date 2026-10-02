"use client";

import { Crop, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

const CROP_SIZE = 320;
const OUTPUT_SIZE = 512;

export function AvatarCropDialog({
  file,
  onClose,
  onConfirm,
}: {
  file: File | null;
  onClose: () => void;
  onConfirm: (file: File) => void;
}) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [cropError, setCropError] = useState("");
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!file) {
      setSourceUrl("");
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setSourceUrl(nextUrl);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setImageReady(false);
    setCropError("");
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  const renderedSize = useMemo(() => {
    const ratio = naturalSize.width / naturalSize.height;
    return ratio >= 1
      ? { width: CROP_SIZE * ratio, height: CROP_SIZE }
      : { width: CROP_SIZE, height: CROP_SIZE / ratio };
  }, [naturalSize]);

  const bounds = useMemo(() => ({
    x: Math.max(0, (renderedSize.width * zoom - CROP_SIZE) / 2),
    y: Math.max(0, (renderedSize.height * zoom - CROP_SIZE) / 2),
  }), [renderedSize, zoom]);

  useEffect(() => {
    setOffset((current) => ({
      x: clamp(current.x, -bounds.x, bounds.x),
      y: clamp(current.y, -bounds.y, bounds.y),
    }));
  }, [bounds]);

  const move = (x: number, y: number) => {
    setOffset((current) => ({
      x: clamp(current.x + x, -bounds.x, bounds.x),
      y: clamp(current.y + y, -bounds.y, bounds.y),
    }));
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    move(deltaX, deltaY);
  };

  const confirmCrop = async () => {
    if (!file || !imageRef.current || !imageReady) return;
    setProcessing(true);
    setCropError("");
    try {
      const image = imageRef.current;
      const displayScale = (renderedSize.width * zoom) / image.naturalWidth;
      const displayLeft = (CROP_SIZE - renderedSize.width * zoom) / 2 + offset.x;
      const displayTop = (CROP_SIZE - renderedSize.height * zoom) / 2 + offset.y;
      const sourceX = Math.max(0, -displayLeft / displayScale);
      const sourceY = Math.max(0, -displayTop / displayScale);
      const sourceSize = CROP_SIZE / displayScale;
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image cropping is not supported by this browser.");
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => value ? resolve(value) : reject(new Error("The cropped image could not be created.")),
          "image/jpeg",
          0.92,
        );
      });
      const baseName = file.name.replace(/\.[^.]+$/, "") || "profile";
      onConfirm(new File([blob], `${baseName}-avatar.jpg`, { type: "image/jpeg" }));
    } catch (error) {
      setCropError(error instanceof Error ? error.message : "The cropped image could not be created.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog
      open={Boolean(file)}
      title="Crop profile photo"
      description="Drag to reposition, use the zoom control, then upload the square crop."
      onClose={onClose}
      preventClose={processing}
    >
      <div className="avatar-crop-layout">
        <div
          className="avatar-crop-stage"
          tabIndex={0}
          role="group"
          aria-label="Profile photo crop area. Drag the image or use the arrow keys to reposition it."
          onPointerDown={(event) => {
            dragRef.current = { x: event.clientX, y: event.clientY };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => {
            dragRef.current = null;
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => { dragRef.current = null; }}
          onKeyDown={(event) => {
            const amount = event.shiftKey ? 10 : 3;
            const movements: Record<string, [number, number]> = {
              ArrowLeft: [-amount, 0],
              ArrowRight: [amount, 0],
              ArrowUp: [0, -amount],
              ArrowDown: [0, amount],
            };
            const movement = movements[event.key];
            if (!movement) return;
            event.preventDefault();
            move(...movement);
          }}
        >
          {sourceUrl && (
            <img
              ref={imageRef}
              src={sourceUrl}
              alt="Profile photo crop preview"
              draggable={false}
              onLoad={(event) => {
                setNaturalSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                });
                setImageReady(true);
              }}
              onError={() => setCropError("This image could not be opened. Choose another JPG, PNG, or WEBP file.")}
              style={{
                width: renderedSize.width,
                height: renderedSize.height,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
              }}
            />
          )}
          <span className="avatar-crop-mask" aria-hidden="true" />
        </div>

        <label className="avatar-crop-zoom">
          <ZoomOut size={17} aria-hidden="true" />
          <span className="sr-only">Zoom photo</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <ZoomIn size={17} aria-hidden="true" />
        </label>

        {cropError && <p className="field-error" role="alert">{cropError}</p>}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={processing}>Cancel</Button>
          <Button onClick={() => void confirmCrop()} loading={processing} loadingLabel="Preparing..." disabled={!imageReady}>
            <Crop size={16} aria-hidden="true" />
            Crop and upload
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
