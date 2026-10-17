"use client";

import { Crop, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

const CROP_SIZE = 320;
const OUTPUT_SIZE = 720;

export function AvatarCropDialog({
  file,
  shape = "circle",
  onClose,
  onConfirm,
}: {
  file: File | null;
  shape?: "circle" | "square";
  onClose: () => void;
  onConfirm: (file: File) => void;
}) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
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
    resetAdjustments();
    setImageReady(false);
    setCropError("");
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const swapsDimensions = normalizedRotation === 90 || normalizedRotation === 270;
  const rotatedNaturalSize = useMemo(() => ({
    width: swapsDimensions ? naturalSize.height : naturalSize.width,
    height: swapsDimensions ? naturalSize.width : naturalSize.height,
  }), [naturalSize, swapsDimensions]);
  const coverScale = Math.max(
    CROP_SIZE / rotatedNaturalSize.width,
    CROP_SIZE / rotatedNaturalSize.height,
  );
  const renderedSize = useMemo(() => ({
    width: naturalSize.width * coverScale,
    height: naturalSize.height * coverScale,
  }), [coverScale, naturalSize]);
  const renderedBounds = useMemo(() => ({
    width: rotatedNaturalSize.width * coverScale * zoom,
    height: rotatedNaturalSize.height * coverScale * zoom,
  }), [coverScale, rotatedNaturalSize, zoom]);
  const bounds = useMemo(() => ({
    x: Math.max(0, (renderedBounds.width - CROP_SIZE) / 2),
    y: Math.max(0, (renderedBounds.height - CROP_SIZE) / 2),
  }), [renderedBounds]);

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

  const rotate = (degrees: number) => {
    setRotation((current) => current + degrees);
    setOffset({ x: 0, y: 0 });
  };

  function resetAdjustments() {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  }

  const confirmCrop = async () => {
    if (!file || !imageRef.current || !imageReady) return;
    setProcessing(true);
    setCropError("");
    try {
      const sourceImage = imageRef.current;
      const rotatedCanvas = document.createElement("canvas");
      rotatedCanvas.width = rotatedNaturalSize.width;
      rotatedCanvas.height = rotatedNaturalSize.height;
      const rotatedContext = rotatedCanvas.getContext("2d");
      if (!rotatedContext) throw new Error("Image cropping is not supported by this browser.");
      rotatedContext.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
      rotatedContext.rotate((normalizedRotation * Math.PI) / 180);
      rotatedContext.drawImage(sourceImage, -naturalSize.width / 2, -naturalSize.height / 2);

      const displayScale = coverScale * zoom;
      const displayLeft = (CROP_SIZE - rotatedNaturalSize.width * displayScale) / 2 + offset.x;
      const displayTop = (CROP_SIZE - rotatedNaturalSize.height * displayScale) / 2 + offset.y;
      const sourceX = clamp(-displayLeft / displayScale, 0, rotatedCanvas.width);
      const sourceY = clamp(-displayTop / displayScale, 0, rotatedCanvas.height);
      const sourceSize = CROP_SIZE / displayScale;

      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = OUTPUT_SIZE;
      outputCanvas.height = OUTPUT_SIZE;
      const outputContext = outputCanvas.getContext("2d");
      if (!outputContext) throw new Error("Image cropping is not supported by this browser.");
      outputContext.drawImage(
        rotatedCanvas,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        outputCanvas.toBlob(
          (value) => value ? resolve(value) : reject(new Error("The adjusted image could not be created.")),
          "image/jpeg",
          0.92,
        );
      });
      const baseName = file.name.replace(/\.[^.]+$/, "") || "profile";
      onConfirm(new File([blob], `${baseName}-profile.jpg`, { type: "image/jpeg" }));
    } catch (error) {
      setCropError(error instanceof Error ? error.message : "The adjusted image could not be created.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog
      open={Boolean(file)}
      title="Adjust profile photo"
      description="Drag to reposition, then use zoom and rotation to frame the photo. Processing stays in your browser."
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
            <div
              className="avatar-crop-image-wrap"
              style={{
                width: renderedSize.width,
                height: renderedSize.height,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg) scale(${zoom})`,
              }}
            >
              <img
                ref={imageRef}
                src={sourceUrl}
                alt="Profile photo crop preview"
                draggable={false}
                onLoad={(event) => {
                  setNaturalSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight });
                  setImageReady(true);
                }}
                onError={() => setCropError("This image could not be opened. Choose another JPG, PNG, or WebP file.")}
              />
            </div>
          )}
          <span className={`avatar-crop-mask is-${shape}`} aria-hidden="true" />
        </div>

        <label className="avatar-crop-zoom">
          <ZoomOut size={17} aria-hidden="true" />
          <span className="sr-only">Zoom photo</span>
          <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
          <ZoomIn size={17} aria-hidden="true" />
        </label>

        <div className="avatar-crop-tools" aria-label="Photo rotation controls">
          <Button variant="secondary" size="sm" onClick={() => rotate(-90)}><RotateCcw size={15} /> Rotate left</Button>
          <Button variant="secondary" size="sm" onClick={() => rotate(90)}><RotateCw size={15} /> Rotate right</Button>
          <Button variant="ghost" size="sm" onClick={resetAdjustments}>Reset</Button>
        </div>

        {cropError && <p className="field-error" role="alert">{cropError}</p>}

        <div className="avatar-crop-actions">
          <Button variant="secondary" onClick={onClose} disabled={processing}>Cancel</Button>
          <Button onClick={() => void confirmCrop()} loading={processing} loadingLabel="Applying..." disabled={!imageReady}>
            <Crop size={16} aria-hidden="true" /> Apply image
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
