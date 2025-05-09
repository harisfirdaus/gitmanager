import React, { useState, useEffect } from 'react';
import Button from './Button'; // Asumsi Button komponen sudah ada
import { X, Copy, CheckCircle } from 'lucide-react'; // Ikon untuk tutup dan salin, dan CheckCircle

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositoryName?: string; // Opsional, untuk pre-fill atau informasi tambahan
}

const EmbedModal: React.FC<EmbedModalProps> = ({ isOpen, onClose, repositoryName }) => {
  const [appUrl, setAppUrl] = useState('');
  const [generatedEmbedCode, setGeneratedEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showModalContent, setShowModalContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAppUrl('');
      setGeneratedEmbedCode('');
      setCopied(false);
      // Memberi sedikit waktu untuk transisi opacity overlay sebelum konten muncul
      const timer = setTimeout(() => {
        setShowModalContent(true);
      }, 50); // Sedikit delay untuk memulai transisi konten setelah overlay muncul
      return () => clearTimeout(timer);
    } else {
      setShowModalContent(false);
    }
  }, [isOpen, repositoryName]);

  const handleCreateEmbedCode = () => {
    if (!appUrl || appUrl.trim() === '') {
      setGeneratedEmbedCode('');
      // Mungkin tambahkan notifikasi error di sini jika diperlukan
      alert('Silakan masukkan App URL Streamlit Anda.');
      return;
    }

    const trimmedUrl = appUrl.trim();
    try {
      const urlObject = new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
      
      // Logika untuk menambahkan ?embed=true atau &embed=true
      if (urlObject.search) { // Jika sudah ada query params
        urlObject.search += '&embed=true';
      } else {
        urlObject.search = '?embed=true';
      }
      setGeneratedEmbedCode(urlObject.toString());
      setCopied(false); // Reset status copied jika kode baru dibuat
    } catch (e) {
      console.error("Invalid App URL:", e);
      setGeneratedEmbedCode('');
      alert('URL Aplikasi tidak valid. Pastikan formatnya benar (misalnya, https://nama-app.streamlit.app).');
    }
  };

  const handleCopyToClipboard = () => {
    if (generatedEmbedCode) {
      navigator.clipboard.writeText(generatedEmbedCode)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000); // Reset status copied setelah 2 detik
        })
        .catch(err => {
          console.error('Gagal menyalin kode:', err);
          alert('Gagal menyalin kode. Silakan salin secara manual.');
        });
    }
  };

  if (!isOpen && !showModalContent) { // Pastikan modal tidak langsung hilang sebelum transisi selesai
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ease-in-out ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`}
      onClick={onClose} // Tutup modal jika klik di luar area konten
    >
      <div 
        className={`bg-white rounded-lg shadow-xl p-6 w-full max-w-lg transform transition-all duration-300 ease-in-out ${showModalContent && isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()} // Hentikan propagasi agar tidak menutup modal saat klik di dalam konten
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Buat Kode Embed Streamlit</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Tutup modal"
          >
            <X size={24} />
          </button>
        </div>

        {repositoryName && (
          <p className="text-sm text-gray-600 mb-1">
            Repositori: <span className="font-medium">{repositoryName}</span>
          </p>
        )}
        <p className="text-xs text-gray-500 mb-4">
          Masukkan URL aplikasi Streamlit Anda yang sudah di-deploy untuk membuat kode embed.
        </p>

        <div className="mb-4">
          <label htmlFor="appUrl" className="block text-sm font-medium text-gray-700 mb-1">
            App URL Streamlit:
          </label>
          <input
            type="text"
            id="appUrl"
            value={appUrl}
            onChange={(e) => setAppUrl(e.target.value)}
            placeholder="Contoh: https://nama-anda-nama-app.streamlit.app"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <Button 
          onClick={handleCreateEmbedCode}
          variant="primary" // Asumsi ada varian primary
          className="w-full mb-4"
        >
          Buat Kode Embed
        </Button>

        {generatedEmbedCode && (
          <div className="mb-4">
            <label htmlFor="embedCode" className="block text-sm font-medium text-gray-700 mb-1">
              Kode Embed yang Dihasilkan:
            </label>
            <div className="relative">
              <textarea
                id="embedCode"
                value={generatedEmbedCode}
                readOnly
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <button
                onClick={handleCopyToClipboard}
                title="Salin kode"
                className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-blue-600 bg-white rounded hover:bg-gray-100 transition-colors"
              >
                {copied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />} 
              </button>
            </div>
             <p className="text-xs text-gray-500 mt-1">
              Kode ini bisa Anda gunakan untuk menyematkan aplikasi Streamlit di website lain.
            </p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="secondary"> 
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};

// Pastikan untuk mengimpor CheckCircle jika digunakan.
// import { X, Copy, CheckCircle } from 'lucide-react'; 

export default EmbedModal; 