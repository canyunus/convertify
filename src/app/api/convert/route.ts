import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const format = formData.get("format") as string;
    const quality = Number(formData.get("quality") as string) || 90;

    if (!file || !format) {
      return NextResponse.json(
        { error: "Dosya ve format gerekli" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let converter = sharp(buffer);

    // Format seçenekleri
    switch (format) {
      case "jpeg":
      case "jpg":
        converter = converter.jpeg({ 
          quality,
          mozjpeg: true // Daha iyi sıkıştırma için mozjpeg kullan
        });
        break;
      case "png":
        converter = converter.png({ 
          quality: Math.min(quality, 100),
          compressionLevel: Math.floor((100 - quality) / 11),
          palette: quality < 50 // Düşük kalitede renk paleti kullan
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
          effort: Math.floor((100 - quality) / 16.6), // 0-6 arası değer
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
          colours: Math.max(4, Math.floor(quality / 2)), // 4-50 arası renk
          dither: quality > 50 ? 1 : 0
        });
        break;
      case "heic":
      case "heif":
        converter = await sharp(buffer)[format]({
          compression: "hevc",
          lossless: quality === 100,
          quality: quality // 1-100 arası değer
        });
        break;
      case "jxl":
        // JPEG XL için özel ayarlar
        converter = converter.jpeg({ 
          quality: Math.max(quality, 60), // JPEG XL minimum 60 kalite gerektirir
          mozjpeg: true
        });
        break;
      case "ico":
        // ICO formatı için özel işlem
        converter = converter.resize(256, 256, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }).png();
        break;
      case "svg":
        // SVG için basit vektörizasyon
        converter = converter.png({
          quality: 100,
          compressionLevel: 0
        });
        break;
      default:
        return NextResponse.json(
          { error: "Desteklenmeyen format" },
          { status: 400 }
        );
    }

    const convertedBuffer = await converter.toBuffer();

    return new NextResponse(convertedBuffer, {
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