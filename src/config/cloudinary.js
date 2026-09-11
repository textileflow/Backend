const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "qpef1ssl",
  api_key: process.env.CLOUDINARY_API_KEY || "466355394478972",
  api_secret: process.env.CLOUDINARY_API_SECRET || "01zNSLl4C3sS8UPZr3p1sdlIdug",
});

/**
 * Upload file buffer directly to Cloudinary (RAM buffer, no local disk storage)
 * Supports Images (JPG, PNG, WEBP, SVG), PDFs, Word Documents, Excel, ZIP, etc.
 * @param {Buffer} fileBuffer - Buffer from Multer memoryStorage
 * @param {String} folder - User-specific Cloudinary folder path
 * @returns {Promise<Object>} Object containing relative path and fullUrl
 */
const uploadToCloudinary = (fileBuffer, folder = "merchants") => {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "qpef1ssl";
    const timestamp = Date.now();

    // If in test environment (Jest tests), return mock uploaded path & fullUrl
    if (process.env.NODE_ENV === "test") {
      const mockRelativePath = `${folder}/${timestamp}.jpg`;
      return resolve({
        path: mockRelativePath,
        fullUrl: `https://res.cloudinary.com/${cloudName}/image/upload/${mockRelativePath}`,
        public_id: `${folder}_mock_${timestamp}`,
      });
    }

    const uploadOptions = {
      folder: folder,
      resource_type: "auto", // Automatically detects images, PDFs, raw documents, videos
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);

        // Extract relative path after /(image|raw|video)/upload/
        let relativePath = result.secure_url;
        const match = result.secure_url.match(/(?:image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/);
        if (match) {
          relativePath = match[1];
        }

        resolve({
          path: relativePath,
          fullUrl: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
