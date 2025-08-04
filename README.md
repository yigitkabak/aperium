# Aperium: Modern Package Manager

Aperium is not just a package installer, but also a tool that allows you to easily manage and share the custom packages you develop. It is designed to make the package installation process in the Node.js ecosystem more efficient, simple, and user-friendly, thereby saving developers time. Aperium allows you to install both external dependencies (packages downloaded from npm) and your own custom packages. With Aperium, you can easily install not only popular open-source packages but also modules from your own projects.

To upload a package to Aperium, you can create a pull request to our GitHub repository.

## Key Features of the Project:

Aperium not only allows you to install packages from npm, but also enables you to download your own custom packages and include them in your projects. Using the `aper` command, you can easily install the modules you have developed or the projects you want to share with others.

## How to Use Aperium:

Aperium works with two main commands: `naper` and `aper`. These commands serve different purposes.

### naper Command:
```
naper install <packageName>
```
This command installs external dependencies from npm. You can use this command to install popular packages such as `express` and `lodash`.
```
naper install express
```
When this command is run, only the necessary output is displayed and unnecessary information is hidden. After the installation is complete, a success message is displayed to the user:
```
🔍 Installing express package... ✅ express has been successfully installed.
```

---

### Aper Command:

One of Aperium's most powerful features is that it allows users to install their own custom-developed packages. The `aper` command allows you to include not only external dependencies but also modules you have developed and shared in your project.

**To install a custom `.apm` package:**

NOTE: The `.apm` system only works on Arch, Debian and Nixos based systems.
```
aper install <fileName.apm>
```
With this command, you can install your own `.apr` packages and share them with others. When you develop a module or project, you can easily share it with other developers using Aperium.

When this command is run, the following process occurs:

* The `.apm` package is opened and its contents are analyzed.
* Your system is detected.
* If the package has already been installed or an existing installation is detected, you are informed.
* The relevant installation scripts (or package lists for NixOS) are run.
* The installation output will display the package name and a success message.

**To install a template from the Aperium repository:**
```
aper install -r <template_name>
```
This command allows you to download and install a specific template from Aperium's default GitHub repository.
```
aper install -r test
```

**To create a new `.apm` package:**
```
aper new <package_name>
```
This command helps you create a new `.apm` package where you can define platform-specific (Debian, Arch, NixOS) installation scripts or package lists.

**To view the contents of an `.apm` package:**
```
aper view <fileName.apm>
```
This command allows you to view the installation scripts and configurations inside an `.apr` file, so you can see what it does before installing a package.

---

## Downloading and Using Aperium:

First, you need to clone our GitHub repository:
```
git clone https://github.com/yigitkabak/aperium
```
Then, navigate to the project directory and install the necessary npm modules and build the project:
```
cd aperium
npm install
npm run build
```

That's it! You can now use the `aper` command directly from your terminal.

---

For more information, simply use the `aper help` command in your terminal.
