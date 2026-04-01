// Preload background image
window.addEventListener('load', () => {
    const img = new Image();
    img.src = './banner.jpeg';
    img.onload = () => {
        document.body.classList.add('bg-loaded');
    };
});

// Elements
const textInput = document.getElementById('textInput');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultContainer = document.getElementById('resultContainer');
const resultImage = document.getElementById('resultImage');

let currentText = '';
let cooldownInterval = null;

// Generate image
generateBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();

    // Validation
    if (!text) {
        showError('Masukkan nama dulu bro!');
        return;
    }

    // Reset states
    hideError();
    hideResult();
    showLoading();

    try {
        // Use Vercel backend API
        const apiUrl = `/api/generate?text=${encodeURIComponent(text)}`;
        
        // Fetch image
        const response = await fetch(apiUrl);
        
        // Handle cooldown (429 status)
        if (response.status === 429) {
            const data = await response.json();
            hideLoading();
            showError(data.message || 'Cooldown aktif! Tunggu beberapa menit ya bro.');
            startCooldownTimer(data.remainingSeconds || 180);
            return;
        }
        
        if (!response.ok) {
            throw new Error('Gagal generate gambar');
        }

        const blob = await response.blob();
        
        // Display image
        const imageUrl = URL.createObjectURL(blob);
        resultImage.src = imageUrl;
        currentText = text;
        
        hideLoading();
        showResult();
        
        // Start cooldown timer after successful generate
        startCooldownTimer(180);

    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showError('Gagal generate gambar. Coba lagi ya bro!');
    }
});

// Cooldown timer function
function startCooldownTimer(seconds) {
    // Clear existing interval
    if (cooldownInterval) {
        clearInterval(cooldownInterval);
    }
    
    let remaining = seconds;
    generateBtn.disabled = true;
    
    // Update button text immediately
    updateButtonText(remaining);
    
    cooldownInterval = setInterval(() => {
        remaining--;
        
        if (remaining <= 0) {
            clearInterval(cooldownInterval);
            generateBtn.disabled = false;
            generateBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                Generate
            `;
        } else {
            updateButtonText(remaining);
        }
    }, 1000);
}

function updateButtonText(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    generateBtn.innerHTML = `Cooldown: ${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Download image
downloadBtn.addEventListener('click', async () => {
    if (!currentText) return;

    try {
        // Use Vercel download API
        const downloadUrl = `/api/download?text=${encodeURIComponent(currentText)}`;
        
        // Create download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `lobby-ffmax-${currentText}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('Download error:', error);
        showError('Gagal download gambar!');
    }
});

// Reset
resetBtn.addEventListener('click', () => {
    textInput.value = '';
    hideResult();
    hideError();
    currentText = '';
    
    // Revoke object URL to free memory
    if (resultImage.src) {
        URL.revokeObjectURL(resultImage.src);
        resultImage.src = '';
    }
    
    textInput.focus();
});

// Enter key to generate
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !generateBtn.disabled) {
        generateBtn.click();
    }
});

// Helper functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => hideError(), 5000);
}

function hideError() {
    errorMessage.classList.remove('show');
}

function showLoading() {
    loadingSpinner.classList.add('show');
    generateBtn.disabled = true;
}

function hideLoading() {
    loadingSpinner.classList.remove('show');
}

function showResult() {
    resultContainer.classList.add('show');
}

function hideResult() {
    resultContainer.classList.remove('show');
}
