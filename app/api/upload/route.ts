import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const { image, folder = "coinlybitora/upcoming-coins" } =
      await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "No image provided.",
        },
        { status: 400 }
      );
    }

    // Accept only image MIME types
    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Only image files are allowed.",
        },
        { status: 400 }
      );
    }

    // Estimate decoded size from base64 string
    const base64 = image.split(",")[1];

    if (!base64) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid image format.",
        },
        { status: 400 }
      );
    }

    const estimatedSize = Buffer.byteLength(base64, "base64");

    if (estimatedSize > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Image must be smaller than 5MB.",
        },
        { status: 400 }
      );
    }

    const upload = await cloudinary.uploader.upload(image, {
      folder,
      resource_type: "image",
      overwrite: true,
    });

    return NextResponse.json({
      success: true,
      url: upload.secure_url,
      publicId: upload.public_id,
      width: upload.width,
      height: upload.height,
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Image upload failed.",
      },
      { status: 500 }
    );
  }
}