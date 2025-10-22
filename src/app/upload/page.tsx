'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function UploadPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<(File | null)[]>(new Array(4).fill(null));
  const [message, setMessage] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const fileTypes = [
    { label: 'Earthquake', accept: '.geojson,.gpkg', extensions: ['geojson', 'gpkg'] },
    { label: 'Landslide', accept: '.geojson,.gpkg', extensions: ['geojson', 'gpkg'] },
    { label: 'Flooding', accept: '.geojson,.gpkg', extensions: ['geojson', 'gpkg'] },
    { label: 'Population', accept: '.csv,.xlsx', extensions: ['csv', 'xlsx'] },
  ];

  const handleFileChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!fileTypes[index].extensions.includes(ext || '')) {
        setMessage(`Invalid file type for ${fileTypes[index].label}. Allowed: ${fileTypes[index].extensions.join(', ')}`);
        return;
      }
    }
    const newFiles = [...files];
    newFiles[index] = file || null;
    setFiles(newFiles);
    setMessage(''); // Clear message on valid selection
  };

  const handleUploadAll = async () => {
    if (!user || files.some(f => !f)) {
      setMessage('Please select all 4 files and ensure you are logged in.');
      return;
    }
    setUploading(true);
    setMessage('');

    for (let i = 0; i < 4; i++) {
      const formData = new FormData();
      formData.append('file', files[i]!);
      formData.append('type', fileTypes[i].label.toLowerCase());
      formData.append('username', user.displayName || user.email || 'Unknown');
      formData.append('user_id', user.uid);

      try {
        const response = await fetch('http://127.0.0.1:8000/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        setMessage(prev => prev + `${fileTypes[i].label}: ${result.message}\n`);
      } catch (error) {
        setMessage(prev => prev + `${fileTypes[i].label}: Upload failed\n`);
      }
    }
    setUploading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Upload Files</h1>
      {fileTypes.map((type, i) => (
        <div key={i} className="mb-4">
          <label>{type.label}: </label>
          <input type="file" accept={type.accept} onChange={handleFileChange(i)} />
        </div>
      ))}
      <button
        onClick={handleUploadAll}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={uploading || !user}
      >
        {uploading ? 'Uploading...' : 'Upload All'}
      </button>
      <pre className="mt-4 whitespace-pre-wrap">{message}</pre>
    </div>
  );
}