# Aperium API
 
Aperium API is a Node.js-based API that dynamically analyzes files and folders within a GitHub repository and presents this information to a web interface. The API clones a specified GitHub repository on the fly, extracts its file structure, calculates language usage statistics, and provides the ability to search for specific files or folders based on user requests.

## Features

* **Dynamic Repository Cloning:** On request, the API clones a specified GitHub repository (defaults to `yigitkabak/aperium-repo`).
* **File System Analysis:** It recursively analyzes the directory structure of the cloned repository.
* **Language Statistics:** It calculates the language distribution (JavaScript, TypeScript, Vue, etc.) as a percentage for each directory and identifies the dominant language.
* **Search Functionality:** It allows searching for files and folders by name.
* **Temporary Cloning:** For security and resource management, the cloned repository is automatically deleted after each request.

## Installation

Follow these steps to run the project on your local machine.

### Prerequisites

* Node.js (v14 or later is recommended)
* npm (comes with Node.js)
* Git

### Steps

1.  Clone the repository:
   ```bash
    git clone [https://github.com/yigitkabak/aperium-api.git](https://github.com/yigitkabak/aperium-api.git)
    cd aperium-api
   ```

2.  Install the necessary dependencies:
    ```bash
    npm install
    ```

3.  Check the `api/api.ts` file in the main project directory. You can change the `GITHUB_REPO_URL` and `REPO_NAME` variables if needed.

4.  Start the project:
    ```bash
    npm start
     ```

The API will now be running at `http://localhost:3000`.

## Usage

The API accepts `GET` requests. Here are the main endpoints you can use:

### Get All Modules

Retrieves the contents and language analysis of the `modules` folder.
```http
GET /api/modules
```

**Example:**
`http://localhost:3000/api/modules`

### Get Repository Content

Retrieves the contents and language analysis of the `repo/packs` folder.
```http
GET /api/repository
```

**Example:**
`http://localhost:3000/api/repository`

### Perform a Search

You can add a `search` query parameter to either endpoint to search for files and folders.

```http
GET /api/modules?search=your_search_term
GET /api/repository?search=your_search_term
```

**Example:** Searching for the word "client" in the `modules` folder.
`http://localhost:3000/api/modules?search=client`

---

## Contributing

If you would like to contribute to the development process, please submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
