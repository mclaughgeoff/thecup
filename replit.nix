{ pkgs }: {
  deps = [
    pkgs.nodejs_20
  ];
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.openssl ];
  };
}
