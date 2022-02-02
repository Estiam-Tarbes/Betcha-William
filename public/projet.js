document.addEventListener('DOMContentLoaded', () => {


     document.body.style.backgroundImage="url('photo.jpg')";
     
     

    
     fetch('/games').then((data) => {

        return data.json()


    }).then((users) => {
        for (const [i, user] of users.entries()) {     //entries permet d'iterer sur tous les éléments du tableau
            console.log("users", user);
            let balise = document.createElement("form");
            balise.innerText = "Nom Partie= "+ user.name ;
            document.body.appendChild(balise)

            var div = document.createElement("div")
            var btn = document.createElement("BUTTON");        // Créer un élément <button>
            var t = document.createTextNode("SUPPRIMER");       // Créer un noeud textuel
            btn.appendChild(t);                                // Ajouter le texte au bouton
            document.body.appendChild(btn);                    // Ajoute la balise <button> à la balise <body>

            // var btnn=document.createElement("BUTTON");
            // var tt=document.createTextNode("ACCEDER");
            // btn.appendChild(tt);                                // Ajouter le texte au bouton
            // document.body.appendChild(btnn); 



            btn.addEventListener("click", async function () {

                await fetch("/deleteGames/" + user.name, { method: "DELETE" })
                window.location.reload();
                console.log("VOUS AVEZ CLIQUER");
            })

            
        }
    })

})


if (document.querySelector("#selectEnemie")) {


        fetch("/api/users?no_owner=true")
            .then(response => response.json())
            .then(result => {
                result.users.forEach(user => {
                    let choise = document.createElement("option");
                    choise.value = user.id;
                    choise.innerHTML = user.username;

                    document.querySelector("#selectEnemie").appendChild(choise);
                })


            })
            .catch(error => console.log('error', error));

        fetch("/api/games")
            .then(response => response.json())
            .then(result => {
                result.games.forEach(async game => {    
                    var user1 = {};
                    var user2 = {};
    
                    await fetch(`/api/user/${game.players[0].id}`)
                        .then(response => response.json())
                        .then(result => user1 = result)
                        .catch(error => console.log('error', error));
    
                    await fetch(`/api/user/${game.players[1].id}`)
                        .then(response => response.json())
                        .then(result => user2 = result)
                        .catch(error => console.log('error', error));



                    /*
                        <tr>
                            <td>J1 VS J2</td>
                            <td>1</td>
                            <td><a href="/jeux/id">Rejoindre</a><a href="/jeux/id/delete">Supprimer</td>a></td>
                        </tr>
                    */

                        let tr = document.createElement('tr');
                        tr.id = "game_" + game.id;

                        let td = document.createElement("td");
                        td.innerHTML = `${user1.username} ⚔️ ${user2.username}`;

                        let td2 = document.createElement("td");
                        td2.innerHTML = game.round;

                        let td3 = document.createElement("td");
                        td3.innerHTML = `<a href="/jeux/${game.id}">Rejoindre</a>  <a href="/api/jeux/${game.id}/delete">Supprimer</a>`;


                        tr.appendChild(td);
                        tr.appendChild(td2);
                        tr.appendChild(td3);

                        document.getElementById("gameList").appendChild(tr);
                })


            })
            .catch(error => console.log('error', error));
}




