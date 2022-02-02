const express       = require('express');
const expressApp    = express();
const mongoose      = require('mongoose');
const session       = require('express-session');
const cookieParser  = require("cookie-parser");
const bcrypt        = require('bcryptjs');
const path          = require('path');

mongoose.connect("mongodb://localhost:27017/jeux", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, '[X] MongoDB connection'));

db.once('open', function () {
    console.log("[*] Connecté à la DB");
});

// Création des Models
const UtilisateurModel = mongoose.model('user', require("./models/utilisateur"));
const GameModel = mongoose.model('game', require("./models/partie"));

const templateDir = path.resolve(`${path.resolve(`${process.cwd()}${path.sep}`)}${path.sep}public`);

const renderTemplate = (res, req, template, data = {}) => {
    const baseData = {
        req: req,
        user: req.session.user ? req.session.user : null,
    };

    res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
};



expressApp.use(express.urlencoded())
expressApp.use(express.static('public'));
expressApp.set('view engine', 'ejs');
expressApp.use(cookieParser());
expressApp.use(express.json());

expressApp.use(session({
    secret:'key that will sign cookie',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

const isAuth = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect("/login");
}

expressApp.get("/", (req, res) => {
    res.redirect("/login");
})


expressApp.post("/register", async (req, res) => {
    bcrypt.hash(req.body.password, 10, async function (err, hash) {
        if (err) return res.sendStatus(500)
    
        const user = new UtilisateurModel({
            username: req.body.username,
            password: hash,
        });
    
        let result = await user.save();

        console.log(`[+] Création d'un utilisateur : ${req.body.username} (${result._id})`);
        res.redirect("/");
    });
});

expressApp.get("/register", (req, res) => {
    renderTemplate(res, req, "inscription.ejs");
})

expressApp.post("/login", (req, res) => {
    // console.log(req.session)
    UtilisateurModel.findOne({ 'username': req.body.username }, function (err, userbdd) { 
        if (userbdd === null || !userbdd) res.redirect("/login"); //Verification si utilisateur existant

        UtilisateurModel.findOne({ 'username': req.body.username }, 'username password', function (err, userbdd) {
            bcrypt.compare(req.body.password, userbdd.password, function (err, result) { //Vérification mot de passe
                if (!result) return res.redirect("/login"); //Verification si le mot de passe est correcte

                req.session.user = {
                    id: userbdd._id, 
                    username: userbdd.username, 
                };

                res.redirect("/liste");
            });
        });
    })
});

expressApp.get("/login", (req, res) => {
    renderTemplate(res, req, "index.ejs");
});

expressApp.get("/logout", isAuth, (req, res) => {
    req.session.destroy();
    res.redirect("/");
})

expressApp.get("/liste", isAuth, (req, res) => {
    renderTemplate(res, req, "liste.ejs");
});

expressApp.get("/jeux/:id", isAuth, async function (req, res) {
    let game = await GameModel.findById(req.params.id)
    console.log(game);
    if (!game) return res.redirect("/liste");
    
    let user1 = await UtilisateurModel.findById(game.player_one.id);
    let user2 = await UtilisateurModel.findById(game.player_two.id);

    
    renderTemplate(res, req, "jeux.ejs");
})

expressApp.get("/jeux", async function (req, res) {
    renderTemplate(res, req, "jeux.ejs");
})



expressApp.post("/api/jeux/create", isAuth, async (req, res) => {
    console.log(req.body);
    // On crée une instance du Model
    const maPartie = new GameModel({
        name: req.body.name,
        player_one: {
            id: req.session.user.id,
        },
        player_two: {
            id: req.body.selectEnemie,
        }
    })


    // On le sauvegarde dans MongoDB !
    let result = await maPartie.save();

    if (!result) return res.redirect("/liste");
    console.log(`[+] Création d'une partie : ${result._id}`);
    res.redirect(`/liste`);
})

expressApp.get("/api/jeux/:id/delete", isAuth, async (req, res) => {

    if (!req.session.user) return res.sendStatus(401);
    await GameModel.findById(req.params.id).then(async function (game) {
        if (!game) return res.sendStatus(404);

        if (game.player_one.id != req.session.user.id) return res.sendStatus(403);
        if (game.state != "WAITING") return res.sendStatus(403);
        
        await GameModel.findByIdAndDelete(req.params.id);

        console.log(`[+] Suppression d'une partie : ${req.params.id}`);
        return res.redirect("/liste");
    });
})

expressApp.get("/api/users", isAuth, async function(req, res) {
    if (!req.session.user) return res.sendStatus(401);
    await UtilisateurModel.find({}).then(function (users) {
        var finalList = [];

        for (let index = 0; index < users.length; index++) {
            const element = users[index];

            if (req.session.user && req.query.no_owner) {
                if (element._id != req.session.user.id) {
                    finalList.push({
                        id: element._id,
                        username: element.username
                    });
                }
            } else {
                finalList.push({
                    id: element._id,
                    username: element.username
                });
            }

            if (index == users.length-1) {
                return res.json({total: finalList.length, users: finalList});
            }
        }
        return res.json({total: finalList.length, users: finalList});
    })
})

expressApp.get("/api/games", async function(req, res) {
    if (!req.session.user) return res.sendStatus(401);
    const validTypes = ["WAITING", "ON_GOING", "FINISHED"];
    let params = {};

    if (req.query.type && validTypes.includes(req.query.type)) {
        params.status = req.query.type;
    }

    await GameModel.find(params).then(function (games) {
        var finalList = [];

        for (let index = 0; index < games.length; index++) {
            const element = games[index];

            finalList.push({
                id: element._id,
                round: element.tour,
                players: [element.player_one, element.player_two],
                state: element.status
            });

            if (index == games.length-1) {
                return res.json({total: games.length, games: finalList});
            }
        }

        return res.json({total: games.length, games: []});
    })
})

expressApp.get("/api/user/:id", async function (req, res) {
	if (!req.session.user) return res.sendStatus(401);
    await UtilisateurModel.findById(req.params.id).then(function (user) {
        if (!user) return res.sendStatus(404);

        let finalData = {};

        finalData.id = user._id;
        finalData.username = user.username;

        return res.json(finalData);
    })
})



expressApp.listen(3000);