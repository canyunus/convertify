"use client";

import { useState, useCallback } from "react";

const supportedFormats = [
  {
    category: "Modern Web Formatları",
    description: "Web için optimize edilmiş yeni nesil formatlar",
    formats: [
      { 
        value: "webp", 
        label: "WebP", 
        description: "Google tarafından geliştirilen modern web formatı",
        details: "Yüksek sıkıştırma oranı ve hızlı yükleme süresi. Şeffaflık desteği var."
      },
      { 
        value: "avif", 
        label: "AVIF", 
        description: "En yüksek sıkıştırma oranına sahip yeni nesil format",
        details: "Netflix ve diğer büyük şirketler tarafından tercih edilen format. HDR desteği mevcut."
      },
      { 
        value: "jxl", 
        label: "JPEG XL", 
        description: "JPEG'in modern ve gelişmiş versiyonu",
        details: "Hem kayıplı hem kayıpsız sıkıştırma seçenekleri. Geniş renk gamı desteği."
      },
    ]
  },
  {
    category: "Fotoğraf Formatları",
    description: "Yaygın olarak kullanılan fotoğraf formatları",
    formats: [
      { 
        value: "jpeg", 
        label: "JPEG", 
        description: "Fotoğraflar için standart format",
        details: "En yaygın kullanılan format. Küçük dosya boyutu, iyi görüntü kalitesi."
      },
      { 
        value: "jpg", 
        label: "JPG", 
        description: "JPEG'in alternatif uzantısı",
        details: "JPEG ile aynı teknik özelliklere sahip, farklı dosya uzantısı."
      },
      { 
        value: "heic", 
        label: "HEIC", 
        description: "Apple cihazların kullandığı yüksek verimli format",
        details: "JPEG'den 2 kat daha iyi sıkıştırma. iPhone fotoğraflarının varsayılan formatı."
      },
      { 
        value: "heif", 
        label: "HEIF", 
        description: "HEIC'in daha genel versiyonu",
        details: "HEIC'in platform bağımsız versiyonu. Animasyon ve HDR desteği mevcut."
      },
    ]
  },
  {
    category: "Kayıpsız Formatlar",
    description: "Görüntü kalitesinden ödün vermeyen profesyonel formatlar",
    formats: [
      { 
        value: "png", 
        label: "PNG", 
        description: "Kayıpsız sıkıştırma ve şeffaflık desteği",
        details: "Web grafikleri ve ekran görüntüleri için ideal. Tam şeffaflık desteği."
      },
      { 
        value: "tiff", 
        label: "TIFF", 
        description: "Profesyonel düzenleme için tercih edilen format",
        details: "Fotoğraf stüdyoları ve matbaalar tarafından tercih edilir. Katman desteği var."
      },
      { 
        value: "bmp", 
        label: "BMP", 
        description: "Sıkıştırmasız ham görüntü verisi",
        details: "Piksel piksel tam veri. Büyük dosya boyutu ama sıkıştırma kaybı yok."
      },
    ]
  },
  {
    category: "Özel Amaçlı",
    description: "Belirli kullanım senaryoları için özel formatlar",
    formats: [
      { 
        value: "gif", 
        label: "GIF", 
        description: "Animasyonlu görüntüler için ideal",
        details: "256 renge kadar destek. Basit animasyonlar ve sticker'lar için yaygın."
      },
      { 
        value: "ico", 
        label: "ICO", 
        description: "Favicon ve simgeler için Windows formatı",
        details: "Web siteleri ve Windows uygulamaları için simge formatı. Çoklu boyut desteği."
      },
      { 
        value: "svg", 
        label: "SVG", 
        description: "Vektörel grafik formatı",
        details: "Her boyutta keskin görüntü. Logo ve ikonlar için ideal vektör formatı."
      },
    ]
  }
];

// Tüm formatları düz bir listeye çevirelim
const allFormats = supportedFormats.reduce((acc, category) => {
  return [...acc, ...category.formats];
}, [] as typeof supportedFormats[0]['formats']);

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [targetFormat, setTargetFormat] = useState("webp");
  const [quality, setQuality] = useState(90);
  const [isConverting, setIsConverting] = useState(false);

  // Seçili formatın bilgilerini bulalım
  const selectedFormat = allFormats.find(f => f.value === targetFormat);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("format", targetFormat);
    formData.append("quality", quality.toString());

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Dönüştürme başarısız oldu");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted-image.${targetFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Dönüştürme hatası:", error);
      alert("Dönüştürme sırasında bir hata oluştu");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
            Convertify
          </h1>
          <p className="text-gray-600 text-lg">
            Görüntülerinizi zahmetsizce dönüştürün
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sol Taraf: Dosya Yükleme */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                previewUrl ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <input
                type="file"
                id="fileInput"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm text-indigo-600">Başka bir görüntü seçmek için tıklayın</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">
                      Görüntüyü buraya sürükleyin
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      veya seçmek için tıklayın
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sağ Taraf: Format ve Kalite Ayarları */}
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Hedef Format
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                >
                  {supportedFormats.map((category) => (
                    <optgroup key={category.category} label={category.category}>
                      {category.formats.map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label} - {format.description}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {selectedFormat && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        {selectedFormat.label}
                      </h3>
                      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
                        {supportedFormats.find(cat => 
                          cat.formats.some(f => f.value === selectedFormat.value)
                        )?.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedFormat.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedFormat.details}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-gray-700 font-medium">
                  Görüntü Kalitesi: {quality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Düşük</span>
                  <span>Yüksek</span>
                </div>
              </div>

              <button
                className={`w-full py-3.5 rounded-lg font-medium transition-all duration-300 ${
                  isConverting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                }`}
                onClick={handleConvert}
                disabled={isConverting}
              >
                {isConverting ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Dönüştürülüyor...</span>
                  </div>
                ) : (
                  "Dönüştür"
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 