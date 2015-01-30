"use strict";

function get_from_storage(key) {
  
  var val = window.bootloader.storage.get(key);
  if (!val) {
    val = $.cookie(key);
  }

  return val;
}

function set_in_storage(key, value) {
  window.bootloader.storage.set(key, value);
  $.removeCookie(key);

}

module.exports = {
  get: get_from_storage,
  set: set_in_storage
};
