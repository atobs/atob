var superfluous = require("superfluous");

var IP = require_app("models/ip");

function translate_ips() {
  var count = 0;
  IP.findAll({}).success(ips => {
    _.each(ips, ip => {
      if (ip.ip.indexOf(".") !== -1) {
        console.log("IP", ip.ip, "TO", IP.toHash(ip.ip), ip.id);
        ip.ip = IP.toHash(ip.ip);
        count += 1;
        IP.update( {ip: ip.ip}, { post_id: ip.post_id });
      } 
    });

    console.log("Translated", count, "IPS to hashes");

  });
}


module.exports = {
  translate_ips
};


translate_ips();
