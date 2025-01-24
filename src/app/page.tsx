"use client";

import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
  const [files, setFiles] = useState<FileList | null>(null);
  const [format, setFormat] = useState('webp');
  const [quality, setQuality] = useState(90);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files?.length) return;

    setLoading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('format', format);
      formData.append('quality', quality.toString());

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (files.length === 1) {
        // Tek dosya için
        const blob = await response.blob();
        saveAs(blob, `converted.${format}`);
      } else {
        // Çoklu dosya için
        const data = await response.json();
        const zip = new JSZip();
        
        // Base64 dosyaları ZIP'e ekle
        data.files.forEach((file: { name: string; data: string }) => {
          const binaryStr = atob(file.data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          zip.file(file.name, bytes);
        });

        // ZIP'i indir
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `converted_images.zip`);
      }
    } catch (error) {
      console.error('Dönüştürme hatası:', error);
      alert('Dönüştürme sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-600 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-2">Resim Dönüştürücü</h1>
        <p className="text-center text-gray-300 mb-8">Resimlerinizi istediğiniz formata dönüştürün</p>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Dosya Yükleme Alanı */}
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                ${files?.length ? 'bg-green-50 border-green-500' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                setFiles(e.dataTransfer.files);
              }}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-gray-600">
                    {files?.length 
                      ? `${files.length} dosya seçildi` 
                      : 'Dosyaları sürükleyin veya seçmek için tıklayın'}
                  </span>
                </div>
              </label>
            </div>

            {/* Format Seçimi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hedef Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <optgroup label="Web Formatları">
                    <option value="webp">WebP - Modern Web Formatı</option>
                    <option value="avif">AVIF - Yüksek Sıkıştırma</option>
                  </optgroup>
                  <optgroup label="Genel Formatlar">
                    <option value="jpg">JPEG - Fotoğraflar İçin</option>
                    <option value="png">PNG - Kayıpsız</option>
                    <option value="pdf">PDF - Döküman Formatı</option>
                  </optgroup>
                  <optgroup label="Diğer">
                    <option value="heic">HEIC - Apple Format</option>
                    <option value="tiff">TIFF - Profesyonel</option>
                    <option value="gif">GIF - Animasyon</option>
                    <option value="ico">ICO - Favicon</option>
                  </optgroup>
                </select>
              </div>

              {/* Kalite Ayarı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kalite: {quality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Düşük Boyut</span>
                  <span>Yüksek Kalite</span>
                </div>
              </div>
            </div>

            {/* Dönüştür Butonu */}
            <button
              type="submit"
              disabled={!files?.length || loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors
                ${loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Dönüştürülüyor...
                </span>
              ) : (
                'Dönüştür'
              )}
            </button>
          </form>
        </div>

        {/* Özellikler */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Hızlı Dönüşüm</h3>
            <p className="text-gray-600">Resimlerinizi saniyeler içinde istediğiniz formata dönüştürün.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Toplu İşlem</h3>
            <p className="text-gray-600">Birden fazla resmi aynı anda dönüştürebilirsiniz.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Kalite Kontrolü</h3>
            <p className="text-gray-600">Boyut ve kalite dengesini istediğiniz gibi ayarlayın.</p>
          </div>
        </div>
      </div>
    </main>
  );
} 