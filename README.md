# Cartographie VRP

Ce projet contient un notebook Jupyter, [`carto.ipynb`](./carto.ipynb), qui résout un problème de tournées de véhicules
(`Vehicle Routing Problem`) à partir de points géographiques autour de Rodez.

Le notebook :

- interroge un serveur local OSRM pour construire les matrices de distance et de durée ;
- résout l’affectation des visites avec OR-Tools ;
- récupère les géométries de routes via OSRM ;
- génère une carte interactive Folium dans [`vrp_routes.html`](./vrp_routes.html).

## Architecture

Le flux est le suivant :

1. définir une liste de points à visiter, avec un dépôt ;
2. appeler l’API `table` d’OSRM pour obtenir les distances et durées entre tous les points ;
3. optimiser les tournées avec 4 véhicules ;
4. afficher les itinéraires sur une carte ;
5. exporter le résultat en HTML.

## Prérequis

- Python 3
- Docker
- un jeu de données routières OSM pour la zone étudiée
- les bibliothèques Python `requests`, `ortools` et `folium`

## Installation d’OSRM

La documentation officielle est ici :

https://github.com/Project-OSRM/osrm-backend#using-docker

Dans ce projet, le notebook attend un serveur OSRM local sur `http://127.0.0.1:5001`.

### Exemple avec les données Midi-Pyrénées

1. Se placer dans le dossier du projet :

```bash
cd /Developer/cartographie
```

2. Télécharger un extrait OSM, par exemple Midi-Pyrénées :

https://download.geofabrik.de/europe/france/midi-pyrenees.html

3. Construire la base OSRM :

```bash
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/midi-pyrenees-260703.osm.pbf
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-partition /data/midi-pyrenees-260703.osrm
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-customize /data/midi-pyrenees-260703.osrm
```

4. Démarrer le service de routage :

```bash
docker run -t -i -p 5001:5000 -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/midi-pyrenees-260703.osrm
```

## Installation Python

Créer un environnement virtuel, puis installer les dépendances :

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install requests ortools folium jupyter
```

## Utilisation

1. Vérifier que le serveur OSRM tourne bien sur `127.0.0.1:5001`.
2. Ouvrir [`carto.ipynb`](./carto.ipynb).
3. Adapter la liste `locations` si besoin.
4. Exécuter toutes les cellules du notebook.

Le notebook affiche les routes optimisées dans la sortie Jupyter et enregistre la carte finale dans
[`vrp_routes.html`](./vrp_routes.html).


```
Vehicle 0:
Depot (Rodez) -> K (Villefranche-de-Rouergue) -> Depot (Rodez)
Distance: 116.45 km

Vehicle 1:
Depot (Rodez) -> B (Flavin) -> A (Baraqueville) -> Depot (Rodez)
Distance: 44.09 km

Vehicle 2:
Depot (Rodez) -> C (Saint-Côme-d'Olt) -> D (Estaing) -> Depot (Rodez)
Distance: 85.90 km

Vehicle 3:
Depot (Rodez) -> J (Balsac) -> F (Valady) -> I (Cransac) -> H (Firmi) -> E (Conques) -> G (Nauviale) -> Depot (Rodez)
Distance: 108.44 km
```

## Exemple de requête OSRM

Le notebook construit une requête de ce type pour obtenir la matrice distance/durée :

```text
http://127.0.0.1:5001/table/v1/driving/2.5734,44.3526;2.4318,44.2766;2.6032,44.2889;2.814,44.515;2.671,44.554;2.397,44.599;2.427,44.455;2.426,44.52;2.31,44.54;2.284,44.525;2.445,44.401;2.037,44.351?annotations=distance,duration
```

## Personnalisation

- Modifier le dépôt et les points dans `locations` ;
- ajuster `vehicle_count` dans `solve_vrp()` ;
- changer la contrainte de distance maximale par véhicule dans `routing.AddDimension(...)` ;
- modifier le nombre de véhicules ou la stratégie de recherche selon la taille du problème.

## Sortie

Le résultat principal est la carte interactive `vrp_routes.html`, consultable dans un navigateur.
