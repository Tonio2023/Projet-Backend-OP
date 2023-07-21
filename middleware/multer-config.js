const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const slugify = require("slugify");

// Créer une instance de memoryStorage pour stocker temporairement les fichiers téléchargés en mémoire vive
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const improveImage = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      res.status(400).json({ error });
    }
    const timestamp = Date.now();

    if (req.file) {
      const originalName = req.file.originalname;
      const normalizedFileName = slugify(originalName, { lower: true });
      const name = `images/${timestamp}-${normalizedFileName}.webp`;
      const imageBuffer = req.file.buffer;

      sharp(imageBuffer)
        // .resize()
        .webp({ quality: 80 })
        .toFile(name, (err, info) => {
          if (err) {
            // Supprimer l'image non compressée en cas d'erreur
            fs.unlinkSync(req.file.path);
            return res.status(500).json({ error });

          }
          req.file.buffer = null;
          req.file.name = name;
          next();
        });
    } else {
      next();
    }
  });
};

module.exports = improveImage;