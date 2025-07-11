document.getElementById('chat-file').addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : '';
    document.getElementById('file-name').textContent = fileName ? `Selected: ${fileName}` : '';
});