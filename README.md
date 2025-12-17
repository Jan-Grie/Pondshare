# Pondshare — Portainer / Docker Deployment

Diese README fasst das Portainer-One-Click-Deploy und das Erstellen eines Docker-Images für Harbor zusammen.

Zusammenfassung:
- Open-Source
- eigenes Docker Image
- Portainer One-Click-Deploy
- Laravel + Queue + Reverb
- MySQL
- ClamAV
- kein SSH nötig

## Voraussetzungen
- Docker Engine ≥ 24
- Portainer CE oder BE
- Freie Ports: 80 (HTTP), 8080 (Reverb)
- Mindestens 2 GB RAM

## Architektur
Container:
- app – Laravel Application (PHP-FPM)
- nginx – Webserver
- queue – Laravel Queue Worker
- reverb – Laravel Reverb Server
- mysql – Datenbank
- clamav – Virenscanner

## Portainer: Stack (kurz)
1. Portainer öffnen → Stacks → Add Stack → Web editor
2. Stack-Name z. B. `laravel-app`
3. Compose in den Web-Editor einfügen (siehe unten)

(Die vollständige Compose-Konfiguration siehe im ursprünglichen Text; Portainer-kompatible Compose-Version: `3.9`)

### Wichtige Variablen
Pflicht:
- `APP_URL`
- `DB_PASSWORD`
- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`

Reverb (einmalig):
- `REVERB_APP_KEY`
- `REVERB_APP_SECRET`

APP_KEY: leer lassen → wird beim ersten Start automatisch generiert

## Nginx (Container) — wichtig für Reverb / WebSockets
Die Weiterleitung `/app` auf den Reverb-Server MUSS im Container-Nginx passieren. Beispielkonfiguration liegt in `docker/nginx/default.conf`.

## ClamAV
ClamAV ist erreichbar unter `clamav:3310`.
Beispiel: `new \\Xenolope\\Quahog\\Client('clamav', 3310);`

## Dateien im Repo
- [docker/Dockerfile](docker/Dockerfile)
- [docker/entrypoint.sh](docker/entrypoint.sh)
- [docker/nginx/default.conf](docker/nginx/default.conf)

## Image bauen & zu Harbor pushen (Terminal)
Ersetze `HARBOR_HOST`, `PROJECT`, `REPO` und `TAG` durch deine Werte.

1) Auf dem Build-Rechner: Harbor Login

```sh
docker login HARBOR_HOST
# Beispiel: docker login harbor.example.com
```

2) Image bauen (einfach)

```sh
docker build -t HARBOR_HOST/PROJECT/REPO:TAG -f docker/Dockerfile .
# Beispiel: docker build -t harbor.example.com/library/pondshare:latest -f docker/Dockerfile .
```

3) Image pushen

```sh
docker push HARBOR_HOST/PROJECT/REPO:TAG
# Beispiel: docker push harbor.example.com/library/pondshare:latest
```

Optional: Multi-arch / Buildx + Push (empfohlen für Produktions-Images)

```sh
docker buildx create --use --name buildx_builder
docker buildx build --platform linux/amd64,linux/arm64 -t HARBOR_HOST/PROJECT/REPO:TAG --push -f docker/Dockerfile .
```

Hinweis: Wenn du `--push` mit buildx nutzt, wird das Image direkt in das Registry gepusht.

## Hinweise
- Setze `APP_KEY` in Portainer nur, wenn du denselben Key in allen Containern verwenden willst. Besser: leer lassen und das `entrypoint.sh` erzeugt einen Key beim ersten Start.
- Niemals Secrets im Git-Repo committen.
- MySQL Volume regelmäßig sichern.

## Nächste Schritte (optional)
- Ich kann dir eine `entrypoint.sh`-Erklärung, ein Nginx-Config-Diagramm oder eine GitHub Action zum Image-Build liefern.

---

Wenn du willst, führe ich jetzt noch eine Beispiel-GitHub-Action für den automatischen Build+Push zu Harbor nach jedem Tag/Push ein.