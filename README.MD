Mailgun Nami Sync
--------------

Mit dieser Applikation können Mailinglisten automatisch anhand der Mailadressen aus der Nami der DPSG mit einem Mailgun Account erstellt werden. Außerdem kann man die Nami Mitglieder (für die ein Leserecht vorhanden ist) einsehen, sodass schnell gecheckt werden kann, ob auch jedem eine Adresse zugeordnet ist.

Der Mailgun API Key sowie die Login Daten für NaMi werden lokal gespeichert und daher mit dem `AES-256-CTR` Algorithmus verschlüsselt. In Konjunktion mit einem sicheren Masterpasswort bietet dieser mehr als ausreichende Sicherheit.

## Was wird benötigt?

Um die Applikation nutzen zu können, werden die folgenden Dinge benötigt:

* Ein Mailgun API Key. Dieser beginnt mit key-XXXXXXXXX
* Die zugehörige Domain welche bei Mailgun registriert ist. z.B. `mg.dpsg-woauchimmer.de`
* Ein NaMi Account mit mindestens Leserechten. Benötigt werden die Mitgliedsnummer und das Passwort. Getestet wurden bisher nur Schreib- und Leserechte auf Stammesebene. Die Applikation liest aber nur, also sollte nichts passieren können.

## Installation
Die folgenden Instruktionen sind für Programmierer gedacht, die am Projekt mit-/ das Projekt weiterentwickeln möchten. Es wird davon ausgegangen, dass `node` sowie `npm` installiert sind.

Da Programmieren auf Deutsch zu ungewohnt ist, ist der gesamte Code auf Englisch geschrieben und kommentiert.
***
Zuerst klone dieses Repo

    git clone https://github.com/Taxel/mailgun-nami-sync.git

`electron-forge` muss installiert sein, dies geht via

    npm install -g electron forge

Außerdem müssen noch die restlichen npm Packages installiert werden:

    cd ./mailgun-nami-sync
    npm install

Nun kann das Projekt auch schon gestartet werden. Dies geht mit

    electron-forge start

oder alternativ in Visual Studio Code:

## Debuggen den Applikation in VS Code

Debuggen funktioniert ganz einfach, indem die Debug Konfiguration *Electron Main* ausgewählt, oder einfach *F5* gedrückt wird.
