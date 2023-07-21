const express = require('express');
const auth = require('../middleware/auth'); // Middleware d'authentification
const router = express.Router();
const bookCtrl = require('../controllers/bookController'); // Contrôleur pour les opérations liées aux livres
const multerConfig = require('../middleware/multer-config'); // Configuration de Multer pour le traitement des fichiers

router.get('/', bookCtrl.getAllBooks); // Endpoint pour consulter tous les livres

router.get("/bestrating", bookCtrl.getBestRating); // Endpoint pour obtenir les livres avec les meilleures évaluations

router.get('/:id', bookCtrl.getOneBook); // Endpoint pour trouver un livre par son identifiant

router.post('/', auth, multerConfig, bookCtrl.createBook); // Endpoint pour créer un nouveau livre (authentification requise)

router.post("/:id/rating", auth, bookCtrl.postRating); // Endpoint pour ajouter une évaluation à un livre existant (authentification requise)

router.put('/:id', auth, multerConfig, bookCtrl.modifyBook); // Endpoint pour modifier un livre existant (authentification requise)

router.delete('/:id', auth, bookCtrl.deleteBook); // Endpoint pour supprimer un livre existant (authentification requise)

module.exports = router;
