const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "qpef1ssl",
  api_key: process.env.CLOUDINARY_API_KEY || "466355394478972",
  api_secret: process.env.CLOUDINARY_API_SECRET || "01zNSLl4C3sS8UPZr3p1sdlIdug",
});

/**
 * Upload file buffer directly to Cloudinary (RAM buffer, no local disk storage)
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

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);

        // Extract relative path after /image/upload/ (and version if present)
        let relativePath = result.secure_url;
        const match = result.secure_url.match(/image\/upload\/(?:v\d+\/)?(.+)$/);
        if (match) {
          relativePath = match[1];
        }

        resolve({
          path: relativePath,
          fullUrl: result.secure_url,
          public_id: result.public_id,
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
