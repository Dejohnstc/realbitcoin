import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    console.log("IMAGE RECEIVED:", image?.slice(0, 50));

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Invalid image" },
        { status: 400 }
      );
    }

    const upload = await cloudinary.uploader.upload(image, {
      folder: "profiles",
      resource_type: "image",
    });

    console.log("UPLOAD SUCCESS:", upload.secure_url);

    return NextResponse.json({
      url: upload.secure_url,
    });

  } catch (error: any) {
    console.error("🔥 CLOUDINARY ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}