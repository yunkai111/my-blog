#!/usr/bin/env bash
set -e

RELEASE_DIR="/srv/my-blog/releases/20260509163411"
CURRENT_DIR="/srv/my-blog/current"

cd "$CURRENT_DIR"
cp -a node_modules "$RELEASE_DIR/"

cd "$RELEASE_DIR"
npx prisma generate --schema ./prisma/schema.prisma
npm run build

chown -R blog:blog "$RELEASE_DIR"
ln -sfn "$RELEASE_DIR" /srv/my-blog/current
systemctl restart my-blog.service
systemctl is-active my-blog.service
readlink -f /srv/my-blog/current
