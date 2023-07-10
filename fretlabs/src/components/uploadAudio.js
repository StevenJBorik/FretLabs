import React, { useState } from 'react';

const UploadAudio = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const uploadFile = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('audioFile', selectedFile);

      try {
        const response = await fetch('http://localhost:3000/api/process-audio', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const fileItem = await response.json();
          console.log(fileItem); // Log the processed file data
        } else {
          console.error('Error processing audio file:', response.status);
          // Handle the error condition
        }
      } catch (error) {
        console.error('Error processing audio file:', error);
        // Handle the error condition
      }
    }
  };

  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={uploadFile}>Upload</button>
    </div>
  );
};

export default UploadAudio;
