"use client";

import Image from "next/image";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

export default function ImageUploader({
  value,
  onChange,
  folder = "coinlybitora/upcoming-coins",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);

    try {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: reader.result,
            folder,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Upload failed");
          setUploading(false);
          return;
        }

        onChange(data.url);

        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      alert("Upload failed.");
    }
  }

  function selectFile() {
    inputRef.current?.click();
  }

  return (
    <div className="space-y-4">

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (file) {
            handleFile(file);
          }
        }}
      />

      {!value ? (
        <button
          type="button"
          onClick={selectFile}
          className="w-full rounded-2xl border-2 border-dashed border-cyan-500 p-10 hover:bg-cyan-500/10 transition flex flex-col items-center gap-4"
        >
          {uploading ? (
            <Loader2
              className="animate-spin text-cyan-400"
              size={42}
            />
          ) : (
            <Camera
              size={42}
              className="text-cyan-400"
            />
          )}

          <div>

            <h3 className="font-semibold">

              Upload Coin Logo

            </h3>

            <p className="text-sm text-gray-400 mt-1">

              PNG • JPG • WEBP

            </p>

          </div>

        </button>
      ) : (
        <div className="rounded-2xl border border-gray-800 bg-[#131A2A] p-5">

          <div className="flex items-center gap-5">

            <Image
              src={value}
              alt="Coin Logo"
              width={90}
              height={90}
              className="rounded-full object-cover border border-gray-700"
            />

            <div className="flex-1">

              <h3 className="font-semibold">

                Logo Uploaded

              </h3>

              <p className="text-gray-400 text-sm mt-1">

                Your coin logo is ready.

              </p>

            </div>

            <button
              type="button"
              onClick={() => onChange("")}
              className="p-3 rounded-xl bg-red-500 hover:bg-red-400 transition"
            >
              <Trash2 size={18} />
            </button>

          </div>

        </div>
      )}

    </div>
  );
}