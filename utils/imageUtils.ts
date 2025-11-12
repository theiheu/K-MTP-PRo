import heic2any from "heic2any";

/**
 * Convert HEIC/HEIF file to JPEG blob
 */
export const convertHeicToJpeg = async (file: File): Promise<Blob> => {
  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });

    // heic2any có thể trả về array hoặc single blob
    return Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
  } catch (error) {
    console.error("Error converting HEIC to JPEG:", error);
    throw new Error("Không thể chuyển đổi ảnh HEIC. Vui lòng thử lại.");
  }
};

/**
 * Check if file is HEIC/HEIF format
 */
export const isHeicFile = (file: File): boolean => {
  const heicExtensions = [".heic", ".heif"];
  const heicMimeTypes = ["image/heic", "image/heif"];

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return (
    heicExtensions.some((ext) => fileName.endsWith(ext)) ||
    heicMimeTypes.includes(fileType)
  );
};

/**
 * Process image: convert HEIC if needed, then resize and compress
 */
export const processImage = async (
  file: File,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8
): Promise<string> => {
  try {
    let processFile = file;

    // Convert HEIC to JPEG if needed
    if (isHeicFile(file)) {
      console.log("Detecting HEIC file, converting to JPEG...");
      const jpegBlob = await convertHeicToJpeg(file);
      processFile = new File(
        [jpegBlob],
        file.name.replace(/\.(heic|heif)$/i, ".jpg"),
        {
          type: "image/jpeg",
        }
      );
    }

    // Read and resize image
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (!event.target?.result) {
          return reject(new Error("Không thể đọc tệp."));
        }

        const img = new Image();
        img.src = event.target.result as string;

        img.onload = () => {
          let { width, height } = img;

          // Calculate new dimensions
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }
          }

          // Create canvas and draw resized image
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            return reject(new Error("Không thể lấy context của canvas."));
          }

          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64
          resolve(canvas.toDataURL("image/jpeg", quality));
        };

        img.onerror = () => {
          reject(new Error("Không thể tải ảnh. Vui lòng thử file khác."));
        };
      };

      reader.onerror = () => {
        reject(new Error("Không thể đọc file. Vui lòng thử lại."));
      };

      reader.readAsDataURL(processFile);
    });
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};

/**
 * Process multiple images
 */
export const processImages = async (
  files: File[],
  maxWidth?: number,
  maxHeight?: number,
  quality?: number
): Promise<string[]> => {
  const promises = files.map((file) =>
    processImage(file, maxWidth, maxHeight, quality)
  );
  return Promise.all(promises);
};

/**
 * Validate image file
 */
export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File quá lớn. Kích thước tối đa là 10MB.",
    };
  }

  // Check file type
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic",
    "image/heif",
  ];

  const validExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".heic",
    ".heif",
  ];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = validExtensions.some((ext) =>
    fileName.endsWith(ext)
  );

  if (!validTypes.includes(file.type) && !hasValidExtension) {
    return {
      valid: false,
      error:
        "Định dạng file không hợp lệ. Chỉ chấp nhận: JPG, PNG, GIF, WEBP, HEIC.",
    };
  }

  return { valid: true };
};
