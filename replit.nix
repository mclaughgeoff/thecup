{ pkgs }: {
  deps = [
    pkgs.postgresql_15
    pkgs.nodejs_20
    pkgs.yarn
  ];
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.openssl ];
  };
}
