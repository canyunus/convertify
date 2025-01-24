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
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          
          // Önce resmi yükle ve metadata kontrol et
          const image = sharp(buffer);
          const metadata = await image.metadata();
          
          // Resmi işlemeye hazırla
          let converter = image
            .removeAlpha()  // Alfa kanalını kaldır
            .flatten({ background: { r: 255, g: 255, b: 255 } }); // Beyaz arka plan

          switch (format) {
            case "webp":
              converter = converter.webp({ 
                quality,
                lossless: quality === 100,
                nearLossless: quality > 90,
                smartSubsample: true,
                effort: 6, // En iyi sıkıştırma
                alphaQuality: 100, // Alfa kanalı kalitesi
              });
              break;
            case "png":
              converter = converter.png({ 
                quality: Math.min(quality, 100),
                compressionLevel: 9, // En iyi sıkıştırma
                palette: false, // Renk paleti kullanma
                effort: 10, // En iyi optimizasyon
                progressive: false
              });
              break;
            case "jpeg":
            case "jpg":
              converter = converter.jpeg({ 
                quality,
                mozjpeg: true,
                chromaSubsampling: quality > 90 ? '4:4:4' : '4:2:0'
              });
              break;
            case "avif":
              converter = converter.avif({ 
                quality,
                lossless: quality === 100,
                effort: 9, // En iyi sıkıştırma
                chromaSubsampling: quality > 90 ? '4:4:4' : '4:2:0'
              });
              break;
            case "tiff":
              converter = converter.tiff({ 
                quality,
                compression: 'lzw',
                predictor: 'horizontal',
                pyramid: true
              });
              break;
            case "gif":
              converter = converter.gif({
                colours: 256, // Maksimum renk
                dither: 1,
                effort: 10 // En iyi optimizasyon
              });
              break;
            case "heic":
            case "heif":
              converter = converter
                .toFormat('jpeg', { quality: 100 })
                .heif({
                  quality,
                  compression: "hevc",
                  lossless: quality === 100
                });
              break;
            case "ico":
              // ICO için basitleştirilmiş ve daha güvenilir dönüşüm
              const resizedBuffer = await sharp(buffer)
                .resize(256, 256, {
                  fit: 'contain',
                  background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toBuffer();

              // Tek boyutlu ICO oluştur
              const icoHeader = Buffer.alloc(6);
              icoHeader.writeUInt16LE(0, 0);  // Reserved
              icoHeader.writeUInt16LE(1, 2);  // ICO type
              icoHeader.writeUInt16LE(1, 4);  // 1 image

              const icoDir = Buffer.alloc(16);
              icoDir.writeUInt8(0, 0);        // Width (0 = 256)
              icoDir.writeUInt8(0, 1);        // Height (0 = 256)
              icoDir.writeUInt8(0, 2);        // Color palette
              icoDir.writeUInt8(0, 3);        // Reserved
              icoDir.writeUInt16LE(1, 4);     // Color planes
              icoDir.writeUInt16LE(32, 6);    // Bits per pixel
              icoDir.writeUInt32LE(resizedBuffer.length, 8);  // Image size
              icoDir.writeUInt32LE(22, 12);   // Image offset

              const icoBuffer = Buffer.concat([
                icoHeader,
                icoDir,
                resizedBuffer
              ]);

              return {
                name: `${file.name.split('.')[0]}.ico`,
                buffer: icoBuffer
              };
            default:
              throw new Error("Desteklenmeyen format");
          }

          const convertedBuffer = await converter.toBuffer();
          
          // Dönüştürülen dosyanın geçerli olduğunu kontrol et
          await sharp(convertedBuffer).metadata();

          return {
            name: `${file.name.split('.')[0]}.${format}`,
            buffer: convertedBuffer
          };
        } catch (error) {
          console.error(`Dosya dönüştürme hatası: ${file.name}`, error);
          throw error;
        }
      })
    );

    // iOS için MIME type tanımlaması
    const mimeTypes: Record<string, string> = {
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'tiff': 'image/tiff',
      'heic': 'image/heic',
      'heif': 'image/heif',
      'avif': 'image/avif',
      'ico': 'image/x-icon'
    };

    if (convertedFiles.length > 1) {
      return NextResponse.json({
        files: convertedFiles.map((file, index) => ({
          name: `converted_${index + 1}.${format}`,
          data: file.buffer.toString('base64')
        }))
      });
    }

    // iOS için güvenli dosya adı ve MIME type
    const safeFileName = convertedFiles[0].name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();

    const contentType = mimeTypes[format as keyof typeof mimeTypes] || `image/${format}`;

    // iOS için özel header'lar
    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeFileName}"`,
      "Content-Length": convertedFiles[0].buffer.length.toString(),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "x-content-type-options": "nosniff"
    });

    return new NextResponse(convertedFiles[0].buffer, { headers });

  } catch (error) {
    console.error("Dönüştürme hatası:", error);
    return NextResponse.json(
      { error: "Dönüştürme sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
} 