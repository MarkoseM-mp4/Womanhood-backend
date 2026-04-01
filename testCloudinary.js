const cloudinary = require('./config/cloudinary');

async function testUpload() {
  try {
    const result = await cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', {
      folder: 'womanhood_test'
    });
    console.log('Success:', result.secure_url);
  } catch (err) {
    console.error('Error:', err);
  }
}

testUpload();
