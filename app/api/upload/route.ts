import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
   const body = await req.json();

console.log("UPLOAD BODY:", body);

const { image, folder = "coinlybitora/upcoming-coins" } = body;

console.log("Image exists:", !!image);
console.log("Image type:", typeof image);

if (!image || typeof image !== "string") {
  console.log("DEBUG_1");

  return NextResponse.json(
    {
      success: false,
      message: "DEBUG_1",
    },
    { status: 400 }
  );
}

    // Accept only image MIME types
  if (!image.startsWith("data:image/")) {
  console.log("DEBUG_2");

  return NextResponse.json(
    {
      success: false,
      message: "DEBUG_2",
    },
    { status: 400 }
  );
}

    // Estimate decoded size from base64 string
    const base64 = image.split(",")[1];

   if (!base64) {
  console.log("DEBUG_3");

  return NextResponse.json(
    {
      success: false,
      message: "DEBUG_3",
    },
    { status: 400 }
  );
}

    const estimatedSize = Buffer.byteLength(base64, "base64");

  if (estimatedSize > MAX_IMAGE_SIZE) {
  console.log("DEBUG_4", estimatedSize);

  return NextResponse.json(
    {
      success: false,
      message: "DEBUG_4",
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