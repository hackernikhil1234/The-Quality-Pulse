// client/src/services/offlineSync.js
const DB_NAME = 'QualityPulse_OfflineDB';
const STORE_NAME = 'offline_reports';
const DB_VERSION = 1;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => reject('IndexedDB error: ' + e.target.error);

    request.onsuccess = (e) => resolve(e.target.result);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveOfflineReport = async (reportData, imageFiles) => {
  try {
    const db = await initDB();

    // Convert image files to Base64 strings so they can be securely saved in IndexedDB
    const base64Images = await Promise.all(
      imageFiles.map((file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve({ name: file.name, type: file.type, data: reader.result });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );

    const payload = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      reportData,
      images: base64Images,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(payload);

      request.onsuccess = () => resolve(payload.id);
      request.onerror = () => reject('Failed to save offline report');
    });
  } catch (error) {
    console.error('Failed to save offline report:', error);
    throw error;
  }
};

export const getOfflineReports = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject('Failed to retrieve offline reports');
    });
  } catch (error) {
    console.error('Failed to retrieve offline reports:', error);
    return [];
  }
};

export const deleteOfflineReport = async (id) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to delete offline report');
    });
  } catch (error) {
    console.error('Failed to delete offline report:', error);
  }
};

// Helper function to convert base64 back to File object for uploading
export const base64ToFile = (base64Data, filename, mimeType) => {
  const arr = base64Data.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mimeType });
};
