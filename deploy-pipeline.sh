# Exit if any command fails
set -e

echo "Deploy $CI_COMMIT_REF_NAME. Triggered by $CI_PIPELINE_SOURCE"
chmod 400 server_key

echo " === Creating directory... === "
ssh -o StrictHostKeyChecking=no -i server_key $SERVER_USER@$SERVER_IP \
  "mkdir $SERVER_LOCATION -p"

echo " === Starting secure copy... === "
rsync -e "ssh -o StrictHostKeyChecking=no -i server_key" -r \
  .env node_modules dist package.json $SERVER_USER@$SERVER_IP:$SERVER_LOCATION

echo " === Restarting server... === "
ssh -o StrictHostKeyChecking=no -i server_key $SERVER_USER@$SERVER_IP \
  "pm2 restart $CI_PROJECT_NAME || pm2 start $SERVER_LOCATION/dist/index.js -n $CI_PROJECT_NAME"
