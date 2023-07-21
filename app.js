// Importation des modules
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Chargement des variables d'environnement à partir du fichier .env
require("dotenv").config();

// Création de l'application Express
const app = express();

// Importation des routes pour les livres et les utilisateurs
const bookRoutes = require('./routes/bookRouter');
const userRoutes = require('./routes/userRouter');

// Connexion à la base de données MongoDB
mongoose.connect('mongodb+srv://beaudouxantoinedev:Padrepio2023@grimcluster.fi7qrxi.mongodb.net/GrimCluster',
  { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

// Middleware pour analyser les données JSON des requêtes entrantes
app.use(express.json());

// Middleware pour gérer les CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Routes pour les livres
app.use('/api/books', bookRoutes);

// Routes pour l'authentification/utilisateurs
app.use('/api/auth', userRoutes);

// Middleware pour servir les fichiers statiques dans le dossier 'images'
app.use('/images', express.static(path.join(__dirname, 'images')));

// Exportation de l'application Express
module.exports = app;
