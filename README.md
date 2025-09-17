# Aperium: Modern Package Manager

Aperium is a command-line tool for managing projects and installing packages, templates, and modules. It's designed to streamline the workflow for developers, especially for tasks involving system-level dependencies. Aperium allows you to define and manage dependencies in a project-specific way, run scripts, and create custom installation packages.

## Key Features

* **Project Management**: Create and manage project-specific dependencies with a simple `aperium.json` file.
* **Module and Template Installation**: Install modules and templates directly from a default GitHub repository.
* **Custom Package Creation**: Create self-contained, platform-specific installation packages (`.apm` files) for easy sharing.
* **Cross-Platform Support**: `.apm` packages can contain different scripts for various Linux distributions (Arch, Debian, NixOS) to ensure a smooth installation experience.
* **Script Runner**: Define and run custom scripts directly from your `aperium.json` file.

---

## Getting Started

### Installation

First, clone the Aperium repository to your local machine:

```bash
git clone https://github.com/yigitkabak/aperium
```

Next, navigate into the project directory, install the required dependencies, and build the project:

```bash
cd aperium
make
```

The `aper` command is now available for you to use.

---

## Command Reference

Aperium's functionality is accessed through the `aper` command.

### Project & Dependency Management

* **`aper init`**: Initializes a new project by creating an `aperium.json` file. This file manages your project's metadata, scripts, and dependencies.
* **`aper -m <module_name>`**: A shortcut for `aper install <module_name>`.
* **`aper -m`**: A shortcut for `aper install`.
* **`aper -um <module_name>`**: Uninstalls a specified module from `aperium_modules` and removes it from `aperium.json`.
* **`aper list`**: Displays all dependencies currently listed in your `aperium.json`.

### Custom Packages & Templates

* **`aper install <file.apm>`**: Installs a local `.apm` package. **Note:** This command requires `sudo` privileges to run installation scripts.
* **`aper -r <template_name>`**: Downloads and installs a project template from the default Aperium repository. This command also requires `sudo` privileges.
* **`aper new <package_name>`**: Guides you through creating a new `.apm` package, allowing you to define platform-specific installation scripts.
* **`aper view <file.apm>`**: Displays the contents of an `.apm` package, including the installation scripts, without running them.

### Script Runner

* **`aper run`**: Runs the default `"start"` script from `aperium.json`.
* **`aper run <file.js>`**: Executes a specified JavaScript file directly.

### Additional Commands

* **`aper help`**: Displays a detailed list of all available commands.

For more information, please check out the [official repository](https://github.com/yigitkabak/aperium) or run `aper help` in your terminal.
