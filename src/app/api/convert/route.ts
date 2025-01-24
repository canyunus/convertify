import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const format = formData.get("format") as string;
    const quality = Number(formData.get("quality") as string) || 90;

    if (!files.length || !format) {
      return NextResponse.json(
        { error: "En az bir dosya ve format gerekli" },
        { status: 400 }
      );
    }

    const convertedFiles = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        let converter = sharp(buffer);

        switch (format) {
          case "jpeg":
          case "jpg":
            converter = converter.jpeg({ 
              quality,
              mozjpeg: true
            });
            break;
          case "png":
            converter = converter.png({ 
              quality: Math.min(quality, 100),
              compressionLevel: Math.floor((100 - quality) / 11),
              palette: quality < 50
            });
            break;
          case "webp":
            converter = converter.webp({ 
              quality,
              lossless: quality === 100,
              nearLossless: quality > 90,
              smartSubsample: true
            });
            break;
          case "avif":
            converter = converter.avif({ 
              quality,
              lossless: quality === 100,
              effort: Math.floor((100 - quality) / 16.6),
              chromaSubsampling: quality > 90 ? '4:4:4' : '4:2:0'
            });
            break;
          case "tiff":
            converter = converter.tiff({ 
              quality,
              compression: quality < 50 ? "jpeg" : "lzw",
              predictor: quality > 50 ? 'horizontal' : 'none'
            });
            break;
          case "gif":
            converter = converter.gif({
              colours: Math.max(4, Math.floor(quality / 2)),
              dither: quality > 50 ? 1 : 0
            });
            break;
          case "heic":
          case "heif":
            converter = converter.heif({
              compression: "hevc",
              lossless: quality === 100,
              quality: quality
            });
            break;
          default:
            throw new Error("Desteklenmeyen format");
        }

        const convertedBuffer = await converter.toBuffer();
        return {
          name: file.name,
          buffer: convertedBuffer
        };
      })
    );

    if (convertedFiles.length > 1) {
      return NextResponse.json({
        files: convertedFiles.map((file, index) => ({
          name: `converted_${index + 1}.${format}`,
          data: file.buffer.toString('base64')
        }))
      });
    }

    return new NextResponse(convertedFiles[0].buffer, {
      headers: {
        "Content-Type": `image/${format}`,
        "Content-Disposition": `attachment; filename=converted.${format}`,
      },
    });
  } catch (error) {
    console.error("Dönüştürme hatası:", error);
    return NextResponse.json(
      { error: "Dönüştürme sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
} 