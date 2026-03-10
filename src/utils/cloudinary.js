import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadMedia = async (file) => {
  try {

    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    const base64String = buffer.toString('base64');


    let resourceType = 'image';
    const fileType = file.type.split('/')[0];
    if (fileType === 'video') {
      resourceType = 'video';
    } else if (fileType === 'audio') {
      resourceType = 'video';
    } else if (fileType !== 'image') {
      resourceType = 'raw';
    }


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
