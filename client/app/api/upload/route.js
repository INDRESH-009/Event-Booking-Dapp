import { NextResponse } from "next/server";
import cloudinary from "cloudinary";

// ✅ Configure Cloudinary with API Key & Secret
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Convert file into a Cloudinary-compatible format
    const fileBuffer = await file.arrayBuffer();
    const fileBase64 = Buffer.from(fileBuffer).toString("base64");
    const dataUri = `data:${file.type};base64,${fileBase64}`;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.v2.uploader.upload(dataUri, {
      folder: "event_images", // Folder in Cloudinary
    });

    return NextResponse.json({ imageUrl: uploadResponse.secure_url });
  } catch (error) {
    console.error("❌ Error uploading to Cloudinary:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
