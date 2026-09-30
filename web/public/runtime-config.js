(function () {
  "use strict";
  var defaults = {
    url: "https://npytwojnxsmxhcssajtg.supabase.co",
    anonKey: "sb_publishable_s9DgcPj_TJh-ZbVhPqgnvw_opH6Z5ww"
  };
  var existing = window.WOW_SUPABASE_CONFIG || {};
  window.WOW_SUPABASE_CONFIG = {
    url: existing.url || defaults.url,
    anonKey: existing.anonKey || defaults.anonKey
  };
})();
