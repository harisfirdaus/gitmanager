const xlsx = require('xlsx');

exports.handler = async (event, context) => {
  // Pastikan request adalah POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    // Asumsi data file dikirim dalam body request sebagai string (misalnya, base64)
    // atau sebagai bagian dari multipart/form-data yang sudah di-parse oleh Netlify.
    // Untuk contoh ini, kita asumsikan event.body berisi konten file XLSX,
    // atau representasi base64 dari konten tersebut.
    // Jika base64, Anda perlu melakukan Buffer.from(event.body, 'base64')
    // Untuk kesederhanaan, kita akan mencoba memproses event.body secara langsung.
    // Dalam implementasi nyata, Anda perlu menangani bagaimana file dikirim dari frontend.

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No file data provided in the request body.' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    let workbook;
    let fileData = event.body;

    // Deteksi jika data adalah base64
    // Ini adalah deteksi sederhana, mungkin perlu disesuaikan
    const isBase64 = typeof fileData === 'string' && fileData.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(fileData.substring(0, Math.min(100, fileData.length)));
    
    let bufferData;
    if (isBase64) {
        // Jika event.isBase64Encoded bernilai true, Netlify mungkin sudah mendekodekannya.
        // Namun, jika Anda mengirim base64 dari klien, Anda mungkin perlu mendekodekannya di sini.
        bufferData = Buffer.from(fileData, 'base64');
    } else {
        // Jika bukan base64, coba asumsikan itu adalah string biner atau buffer yang bisa langsung dibaca.
        // Pustaka xlsx bisa menangani berbagai tipe input untuk 'data'.
        bufferData = fileData;
    }

    try {
        workbook = xlsx.read(bufferData, { type: isBase64 || Buffer.isBuffer(bufferData) ? 'buffer' : 'binary' });
    } catch (e) {
        console.error("Error reading XLSX data:", e);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid or corrupted XLSX file data.', details: e.message }),
          headers: { 'Content-Type': 'application/json' },
        };
    }

    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'XLSX file contains no sheets.' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Ambil data dari sheet pertama sebagai contoh
    // Anda mungkin ingin memberikan opsi untuk memilih sheet atau memproses semua sheet
    const firstSheetName = sheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    // Dapatkan nama file dari query parameter jika ada, jika tidak, default
    const outputFileNameBase = event.queryStringParameters && event.queryStringParameters.fileName 
                               ? event.queryStringParameters.fileName.replace(/\.[^/.]+$/, "") // Hapus ekstensi jika ada
                               : 'converted_data';
    const outputFileName = `${outputFileNameBase}.json`;


    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'File XLSX berhasil dikonversi ke JSON.',
        fileName: outputFileName, // Nama file ini bisa digunakan di frontend
        data: jsonData,
        originalSheetName: firstSheetName
      }),
      headers: { 
        'Content-Type': 'application/json',
      },
    };

  } catch (error) {
    console.error('Error during XLSX to JSON conversion:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error during conversion.', details: error.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
}; 