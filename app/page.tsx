"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Image as ImageIcon, Sparkles, Bone, Ruler, MapPin, ArrowLeftRight, Target, Dumbbell, LucideIcon, Loader2 } from "lucide-react";

function FeatureItem({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-primary" />
      </div>
      <span className="text-sm text-dark">{text}</span>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!preview) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: preview }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail?.error || "Analysis failed");
      }

      // Store results in sessionStorage for the results page
      sessionStorage.setItem("analysisResults", JSON.stringify(data));

      // Navigate to results page
      router.push("/results");

    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <main className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles size={16} />
            AI-Powered Analysis
          </div>
          <h1 className="text-4xl font-semibold text-dark leading-tight">
            Let&apos;s take a look at your spine
          </h1>
          <p className="text-muted text-lg leading-relaxed max-w-md mx-auto">
            Upload an X-ray image of your back, and our AI will provide you with personalized insights about your spinal health.
          </p>
        </div>

        {/* Upload Card */}
        <div className="glass p-6 space-y-4">
          {!preview ? (
            <div
              className={`relative border-2 border-dashed rounded-[16px] p-8 text-center transition-all duration-200 ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-primary/20 hover:border-primary/40"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />

              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload size={28} className="text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-dark font-medium">
                    Drag and drop your X-ray here
                  </p>
                  <p className="text-muted text-sm">or</p>
                </div>
                <button
                  onClick={handleButtonClick}
                  className="btn btn-secondary"
                >
                  <ImageIcon size={18} />
                  Choose from Gallery
                </button>
                <p className="text-xs text-muted">
                  Supports JPG, PNG, and DICOM files
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-[16px] overflow-hidden bg-dark/5">
                <img
                  src={preview}
                  alt="X-ray preview"
                  className="w-full h-64 object-contain"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                    <ImageIcon size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark truncate max-w-[200px]">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-muted">
                      {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    setError(null);
                  }}
                  className="btn btn-ghost text-sm"
                  disabled={isAnalyzing}
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-subtle p-4 border border-red-200 bg-red-50/50">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* What We Analyze */}
        <div className="glass-subtle p-5">
          <p className="text-sm font-medium text-dark mb-4">What we&apos;ll analyze for you</p>
          <div className="grid grid-cols-2 gap-3">
            <FeatureItem icon={Bone} text="Vertebrae detection" />
            <FeatureItem icon={Ruler} text="Cobb angle measurement" />
            <FeatureItem icon={MapPin} text="Curve location (T/L/TL)" />
            <FeatureItem icon={ArrowLeftRight} text="Curve direction (L/R)" />
            <FeatureItem icon={Target} text="Schroth classification" />
            <FeatureItem icon={Dumbbell} text="Personalized exercises" />
          </div>
        </div>

        {/* Analyze Button */}
        {preview && (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="btn btn-primary w-full text-base py-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Analyze My X-Ray
              </>
            )}
          </button>
        )}

        {/* Trust Note */}
        <p className="text-center text-xs text-muted">
          Your images are processed securely and never stored without your permission.
        </p>
      </main>
    </div>
  );
}
