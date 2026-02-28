const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ['.pdf', '.csv', '.txt'];
  const mimeOk = file.mimetype.includes('pdf')
    || file.mimetype.includes('csv')
    || file.mimetype.startsWith('text/');

  if (allowed.includes(ext) && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, CSV, and TXT files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = upload;
