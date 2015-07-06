module.exports = {
  sockets: true,
  primus_transformer: "sockjs",
  ssl: {
    key: "config/certs/server.key",
    certificate: "config/certs/server.crt"
  },
  backend: {

  },
  authorized_users: "config/users.htpasswd",
  http_port: process.env.PORT || 3000,
  https_port: process.env.HTTPS_PORT || 3443,
  max_http_sockets: 1000,
  max_https_sockets: 1000,
  refresh_on_restart: true,
  require_https: true,
  use_cls: false
};
