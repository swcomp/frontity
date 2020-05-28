const { spawn, exec } = require("child-process-promise");

(async () => {
  try {
    await spawn("docker-compose", ["up", "-d"], {
      stdio: "inherit",
    });

    // Wait until server is ready.
    await spawn("npx", ["wait-on", "http-get://localhost:8080"], {
      stdio: "inherit",
    });

    const { stdout } = await exec("curl localhost:8080");
    console.log(stdout);

    // await spawn("docker-compose", ["run", "wp", "core", "install"], {
    //   stdio: "inherit",
    // });

    // Change permissions to the wp-content folder because volumes have root
    // permissions by default.
    await spawn("docker-compose", [
      "run",
      "wp",
      "/bin/bash",
      "-c",
      "chown -R www-data:www-data /var/www/html/wp-content/",
    ]);

    // Install plugins.
    await spawn(
      "docker-compose",
      [
        "run",
        "--rm",
        "wpcli",
        "plugin",
        "install",
        "wordpress-seo --version=12.6",
        "all-in-one-seo-pack",
        "--activate",
      ],
      {
        stdio: "inherit",
      }
    );
  } catch (err) {
    console.error(err);

    // We need to return the exit code so that the github action returns a fail
    process.exit(1);
  }
})();
