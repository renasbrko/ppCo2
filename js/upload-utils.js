// ===== Upload Utilities =====
// Handles file validation, path management, and upload operations

// File type validation
const ALLOWED_MIME_TYPES = {
  'application/pdf': { ext: '.pdf', maxSize: 30 * 1024 * 1024 }, // 30MB
  'video/mp4': { ext: '.mp4', maxSize: 100 * 1024 * 1024 }, // 100MB
  'video/quicktime': { ext: '.mov', maxSize: 100 * 1024 * 1024 }, // 100MB
  'video/webm': { ext: '.webm', maxSize: 100 * 1024 * 1024 }, // 100MB
  'video/x-matroska': { ext: '.mkv', maxSize: 100 * 1024 * 1024 } // 100MB
};

const BLOCKED_EXTENSIONS = ['.exe', '.js', '.html', '.php', '.jsp', '.asp', '.aspx', '.bat', '.cmd', '.sh'];

// Generate consistent file path
function generateFilePath(curriculum, subject, type, fileName, timestamp) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${curriculum}/${subject}/${type}/${timestamp}_${safeName}`;
}

// Validate file type and size
function validateFile(file) {
  if (!file) return { valid: false, error: 'No file provided' };
  
  // Check blocked extensions
  const fileName = file.name.toLowerCase();
  const hasBlockedExt = BLOCKED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  if (hasBlockedExt) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  // Check MIME type
  const mimeType = file.type.toLowerCase();
  const allowedType = ALLOWED_MIME_TYPES[mimeType];
  if (!allowedType) {
    return { valid: false, error: 'Unsupported file type' };
  }
  
  // Check file size
  if (file.size > allowedType.maxSize) {
    const maxSizeMB = allowedType.maxSize / (1024 * 1024);
    return { valid: false, error: `File too large. Maximum size: ${maxSizeMB}MB` };
  }
  
  return { 
    valid: true, 
    mimeType,
    maxSize: allowedType.maxSize,
    extension: allowedType.ext
  };
}

// Generate file hash for duplicate detection
async function generateFileHash(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check for duplicate files
async function checkDuplicate(supabaseClient, fileHash) {
  try {
    const { data } = await supabaseClient
      .from('files')
      .select('id, name, path')
      .eq('file_hash', fileHash)
      .maybeSingle();
    return data;
  } catch (error) {
    console.warn('Duplicate check error:', error);
    return null;
  }
}

// Upload with retry logic
async function uploadWithRetry(supabaseClient, bucket, path, file, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(path, file, { 
          cacheControl: '3600', 
          upsert: false,
          onProgress: (progress) => {
            const percent = Math.round((progress.transferred / progress.total) * 100);
            updateUploadProgress(percent, `Uploading... (Attempt ${attempt}/${maxRetries})`);
          }
        });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      lastError = error;
      console.warn(`Upload attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return { success: false, error: lastError };
}

// Update upload progress UI
function updateUploadProgress(percent, message) {
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  if (progressBar) {
    progressBar.style.width = `${percent}%`;
  }
  if (progressText) {
    progressText.textContent = message;
  }
}

// Upload complete handler
function handleUploadComplete(result, filePath, fileName, title, notes, curriculum, subject, type) {
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const progressWrap = document.getElementById('progressWrap');
  const btn = document.getElementById('uploadBtn');
  
  if (result.success) {
    progressBar.style.width = '100%';
    progressText.textContent = 'Saving to database...';
    
    return {
      name: fileName,
      title: title || fileName,
      notes: notes || null,
      curriculum,
      subject,
      type,
      url: result.data.publicUrl,
      path: filePath,
      size_bytes: fileName.size || 0
    };
  } else {
    throw result.error;
  }
}

// Export utilities
window.UploadUtils = {
  validateFile,
  generateFilePath,
  generateFileHash,
  checkDuplicate,
  uploadWithRetry,
  updateUploadProgress,
  handleUploadComplete,
  ALLOWED_MIME_TYPES,
  BLOCKED_EXTENSIONS
};
