# Aperium: Modern Package Manager

Aperium is a product of the Aperture Labs Ecosystem.

Aperium is not just a package installer but also a tool that allows you to easily manage the custom packages you develop and share. Designed to make the package installation process in the Node.js ecosystem more efficient, simple, and user-friendly, it helps developers save time. Aperium allows you to install both external dependencies (packages downloaded from npm) and your own custom packages. With Aperium, you can easily install not only popular open-source packages but also modules from your own projects.

To upload a package to Aperium, you can create a pull request on our GitHub repository.

## Key Features of the Project:

Aperium doesn't just install packages from npm but also allows you to download and include your own custom packages in your projects. Using the aper command, you can upload modules that you've developed or projects you want to share with others.

## How to Use Aperium:

Aperium operates with two main commands: naper and aper. These commands serve different purposes.

naper Command:
```bash
naper install <packageName>
```
This command installs external dependencies from npm. You can use this command to install popular packages like express, lodash, etc.
```bash
naper install express
```
When this command is run, only the necessary output is displayed, and unnecessary information is hidden. After the installation is complete, a success message will be shown to the user:
```bash
🔍 Installing express package... ✅ express has been successfully installed.
```

---

## Aper Command:

One of the most powerful features of Aperium is that it allows users to install their custom-developed packages. The aper command enables you to include not only external dependencies but also your own developed and shared modules in your project.
```bash
aper install <packageName>
```
With this command, you can install your custom packages and share them with others. Once you develop a module or project, you can use aperium to upload and share it with other developers.

By running this command, the following process occurs:

The package is retrieved from the aperium repository.

If successful, it’s copied to your project directory.

The installation output will show the package name and success message.

# What should you do to download it?

First, you need to clone our GitHub repo.
```bash
git clone https://github.com/yigitkabak/aperium
```
secondly, you must download the npm modules.
```bash
cd aperium
npm install express fs-extra multer typescript
npm run build
```
Finally, you should download our npm package.
```bash
npm install aperium
```

That's all there is to it!

## For more information, you can use the command ```aperium```.