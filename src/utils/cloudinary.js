import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Function to upload media to Cloudinary
export const uploadMedia = async (file) => {
  try {
    // Convert buffer to base64 string for Cloudinary upload
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    const base64String = buffer.toString('base64');
    
    // Determine resource type based on file type
    let resourceType = 'image';
    const fileType = file.type.split('/')[0];
    if (fileType === 'video') {
      resourceType = 'video';
    } else if (fileType === 'audio') {
      resourceType = 'video'; // Cloudinary uses video resource type for audio files
    } else if (fileType !== 'image') {
      resourceType = 'raw'; // For documents and other files
    }
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:${file.type};base64,${base64String}`,
        { resource_type: resourceType },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });
    
    return {
      type: fileType,
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export default cloudinary;