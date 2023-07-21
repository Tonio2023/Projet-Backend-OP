const Book = require('../models/Book'); // Importation du modèle de données pour les livres
const fs = require("fs") // Module 'fs' pour interagir avec le système de fichiers

// Création d'un livre
exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book); // Conversion de l'objet livre en JSON
  delete bookObject._id; // Suppression de l'identifiant du livre (généralement généré automatiquement)
  delete bookObject._userId; // Suppression de l'identifiant de l'utilisateur (généralement transmis via l'authentification)

  let imageUrl = ''; // initialise une variable imageUrl vide qui sera utilisée pour stocker l'URL de l'image du livre.
  if (req.file && req.file.name) { // vérifie si une image a été téléchargée avec la requête (req.file) et si elle a un nom 
    imageUrl = `${req.protocol}://${req.get('host')}/${req.file.name}`; // construit l'URL complète de l'image en utilisant le protocole, l'hôte et le nom du fichier de l'image
  }

  const book = new Book({ // Création d'un nouvel objet livre
    ...bookObject, // avec les propriétés de l'objet livre
    userId: req.auth.userId, // l'id de l'utilisateur
    imageUrl: imageUrl //ainsi qu'avec l'url de l'image
  });

  book
    .save() // methode qui enregistre le livre dans la base de données
    .then(() => {
      res.status(201).json({ message: 'Livre enregistré !' });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// Notation d'un livre
exports.postRating = (req, res, next) => {
  const bookId = req.params.id; // récupèration l'identifiant du livre à partir des paramètres de la requête
  if (!bookId) { // si l'identifiant du livre est manquant, => erreur!!!
    return res.status(400).json({ message: "L'identifiant du livre est manquant." });
  }

  // Vérifier si l'utilisateur a déjà renseigné une notation pour ce livre
  Book.findOne({ _id: bookId, "ratings.userId": req.auth.userId }) // recherche le livre dans la base de données en utilisant l'identifiant du livre et l'identifiant de l'utilisateur (obtenu à partir de l'authentification). 
    .then((book) => {
      if (book) {
        return res.status(400).json({ message: "Vous avez déjà noté ce livre." });
      }

      // Mettre à jour le livre avec la nouvelle note
      Book.findByIdAndUpdate(bookId, {
        $push: { // trouver le livre par son identifiant, puis utilise l'opérateur push pour ajouter une nouvelle notation à la propriété ratings du livre.
          ratings: {
            userId: req.auth.userId,
            grade: req.body.rating
          }
        }
      }, { new: true })
        .then((book) => {
          if (!book) {
            return res.status(404).json({ message: "Le livre n'existe pas." });
          }

          // Calculer la moyenne des notes
          const totalRatings = book.ratings.length;
          //  moyenne des notes en utilisant la méthode .reduce() pour additionner toutes les notes et la longueur de la propriété ratings.
          const sumOfRates = book.ratings.reduce((total, rating) => total + rating.grade, 0);
          book.averageRating = sumOfRates / totalRatings;

          // Enregistrer les modifications dans la DB
          book.save().then((book) => {
            res.status(200).json(book);
          });
        })
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(400).json({ error }));
};


// modifier un livre
exports.modifyBook = (req, res, next) => {
  const bookObject = req.file ? { // variable initialisée à partir du contenu de la propriété book de l'objet body de la requête. 
    ...JSON.parse(req.body.book), // Si un fichier est également joint à la requête (req.file), alors l'objet bookObject sera mis à jour avec l'URL complète de l'image
    imageUrl: `${req.protocol}://${req.get('host')}/${req.file.name}` // mise à jour de l'url de l'image 
  } : { ...req.body }; // sinon l'objet bookObject est une copie directe de req.body.

  delete bookObject._userId; // suppression de la propriété userId
  Book.findOne({ _id: req.params.id }) // recherche le livre à modifier dans la base de données en utilisant son identifiant
    .then((book) => {
      if (book.userId != req.auth.userId) { // Si les identifiants ne correspondent pas, pas autorisé à modifier le livre !
        res.status(401).json({ message: "Pas autorisé à modifier ce livre." });
      } else {
        const oldImageUrl = book.imageUrl; // sauvegarde l'ancienne URL de l'image du livre avant la modification.
        Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id }) // Mise à jour du livre dans la base de données. updateOne pour trouver le livre par son id et lui appliquer les modifications , L'id du livre est spécifié à nouveau pour s'assurer que la mise à jour est appliquée au bon livre.
          .then(() => {
            if (req.file && oldImageUrl) {
              const filename = oldImageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, (error) => {
                if (error) {
                  console.error("Erreur lors de la suppression de l'ancienne image :", error);
                }
              });
            }
            res.status(200).json({ message: "Le livre a été modifié!" });
          })
          .catch(error => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};


// supprimer un livre
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id }) // recherche le livre à supprimer dans la base de données en utilisant son identifiant 
    .then((book) => {
      if (book.userId !== req.auth.userId) { // si id utilisateur est différent de celui qui l'a créé alors pas autorisé !
        res.status(401).json({ message: 'Not authorized' });
      } else {
        const filename = book.imageUrl.split('/images/')[1]; // extrait le nom du fichier de l'URL de l'image du livre. 
        const imagePath = `images/${filename}`; // définit le chemin d'accès à l'image en utilisant le nom du fichier extrait et le dossier "images".

        // Supprimer l'image du dossier
        fs.unlink(imagePath, (error) => { // supprime physiquement l'image du dossier 
          if (error) {
            console.log('Erreur lors de la suppression de l\'image :', error);
          }

          // Supprimer le livre de la base de données
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: 'Objet supprimé !' });
            })
            .catch((error) => {
              res.status(401).json({ error });
            });
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

// consulter un livre 
  exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json({error}));
  };

// consulter tous les livres
  exports.getAllBooks = (req, res, next) => {
    Book.find()
      .then(books => res.status(200).json(books))
      .catch(error => res.status(404).json({error}));
  };

// consulter les meilleures livres notés
  exports.getBestRating = (req, res, next) => {
    Book.find()
      .sort({ averageRating: -1 })  // triage des livres en fonction de la propriété averageRating de manière décroissante => les livres avec la note moyenne la plus élevée seront placés en premier dans le résultat.
      .limit(3) // les 3 livres les mieux notés seronbt retenus 
      .then((books) => {
        res.status(200).json(books);
      })
      .catch((error) => {
        res.status(400).json({ error });
      });
  };