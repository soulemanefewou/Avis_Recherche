#!/bin/bash
# ============================================================
# Démarrage production (Render) :
#   1. Écrit les secrets fournis en variables d'environnement
#      (clés JWT base64, credentials Firebase base64)
#   2. Déduit l'URL publique (RENDER_EXTERNAL_URL)
#   3. Warmup du cache Symfony en mode prod
#   4. Lance Apache sur $PORT
# ============================================================
set -e

APP_DIR=/var/www/html

# ---------- 1. Clés JWT ----------
mkdir -p "$APP_DIR/config/jwt"
if [ -n "$JWT_SECRET_KEY_B64" ]; then
    echo "$JWT_SECRET_KEY_B64" | base64 -d > "$APP_DIR/config/jwt/private.pem"
    chmod 600 "$APP_DIR/config/jwt/private.pem"
    echo ">> Clé privée JWT écrite depuis l'environnement."
fi
if [ -n "$JWT_PUBLIC_KEY_B64" ]; then
    echo "$JWT_PUBLIC_KEY_B64" | base64 -d > "$APP_DIR/config/jwt/public.pem"
    chmod 644 "$APP_DIR/config/jwt/public.pem"
    echo ">> Clé publique JWT écrite depuis l'environnement."
fi

# ---------- 2. Credentials Firebase ----------
if [ -n "$FIREBASE_CREDENTIALS_JSON_B64" ]; then
    mkdir -p "$APP_DIR/var/secrets"
    echo "$FIREBASE_CREDENTIALS_JSON_B64" | base64 -d > "$APP_DIR/var/secrets/firebase-service-account.json"
    export FIREBASE_CREDENTIALS="$APP_DIR/var/secrets/firebase-service-account.json"
    echo ">> Credentials Firebase écrits depuis l'environnement."
fi

# ---------- 3. URL publique de l'API ----------
# Render fournit automatiquement RENDER_EXTERNAL_URL (ex: https://mon-api.onrender.com)
if [ -z "$APP_BASE_URL" ] || [ "$APP_BASE_URL" = "http://localhost:8000" ]; then
    if [ -n "$RENDER_EXTERNAL_URL" ]; then
        export APP_BASE_URL="$RENDER_EXTERNAL_URL"
    fi
fi
echo ">> APP_BASE_URL = ${APP_BASE_URL:-non définie}"

# ---------- 4. Cache prod ----------
cd "$APP_DIR"
echo ">> Warmup du cache Symfony (prod)..."
php bin/console cache:warmup --env=prod

# ---------- 4bis. Bootstrap (plans gratuits : pas de jobs one-off) ----------
# Active en mettant BOOTSTRAP_SCHEMA=1 sur le service ; desactive ensuite.
if [ "$BOOTSTRAP_SCHEMA" = "1" ]; then
    echo ">> BOOTSTRAP : synchronisation du schema de la base..."
    php bin/console doctrine:schema:update --force || echo "!! schema:update a echoue"
fi
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
    echo ">> BOOTSTRAP : creation/maj du compte Fondateur (${ADMIN_EMAIL})..."
    php bin/console app:create-admin FONDATEUR "$ADMIN_EMAIL" "${ADMIN_NOM:-Fondateur}" "${ADMIN_PRENOM:-Avis}" "${ADMIN_TELEPHONE:-+237600000000}" "$ADMIN_PASSWORD" \
        && echo ">> Compte Fondateur pret." \
        || echo ">> Compte deja existant ou erreur (ignore)."
fi

chown -R www-data:www-data var config/jwt public/uploads

# ---------- 5. Apache sur le port Render ($PORT, défaut 80) ----------
PORT="${PORT:-80}"
echo ">> Apache écoute sur le port $PORT"
sed -i "s/__PORT__/$PORT/" /etc/apache2/sites-available/000-default.conf
sed -i "s/^Listen 80$/Listen $PORT/" /etc/apache2/ports.conf

exec apache2-foreground
