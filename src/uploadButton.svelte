<script lang="ts">
  import { onMount } from 'svelte';

  let selectedFile: File | null = null;

  const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      selectedFile = input.files[0];
    }
  };

  const uploadFile = async () => {
  if (selectedFile) {
    const formData = new FormData();
    formData.append('audioFile', selectedFile);

    try {
      const response = await fetch('http://localhost:3000/process-audio', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const fileItem = await response.json();
        // Handle the file item data received from the server
        console.log(fileItem);
      } else {
        // Handle the error condition
        console.error('Error processing audio file:', response.status);
      }
    } catch (error) {
      console.error('Error processing audio file:', error);
    }
  }
};


  onMount(() => {
    // Add any necessary initialization logic
  });
</script>

<div>
  <input type="file" accept="audio/*" on:change={handleFileChange} />
  <button on:click={uploadFile}>Upload</button>
</div>
