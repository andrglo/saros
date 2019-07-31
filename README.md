# saros

> Saros aims to be a full budgeting web app for personal use

## What it is

- First of all: __a work in progress...__
- A serverless web app for finance manage
- Its responsive and can be used in mobile phone

## What it is not

- A boilerplate to start new projects
- A native app for mobile phone

## Why open source

- A finance app based on the cloud carry all your sensitive financial information so if you used my hosted solution you can audit what the code does. And you have the option to clone and use it with your own cloud account
- Help is welcome

## Project premises

- Allow a solo developer to build and maintain a production ready budgeting web app
- Minimize dependencies, so, no external package for router, forms or any package that comes with code to support many edge cases

## Main technology stack

- [firebase](https://firebase.google.com/]): Solves all the server side requirements from hosting the static front end files (with a nice web.app domain name) to authentication and media storage. It perfectly syncs the data and has a free quota that allows personal usage of the web app at no cost
- [redux](https://redux.js.org/): As the source of truth. All the action occurs here so I can pick whatever template library to generate the html
- [tailwindcss](https://tailwindcss.com/): A utility-first css framework with pretty good defaults that allows a a non-designer to create a very exclusive design for each layout and component. Again, I can pick whatever template library to generate the html
- [react](https://reactjs.org/): A declarative, component based UI library that works very well with redux
- [webpack](https://webpack.js.org/): A powerful tool to develop and build your app with great flexibility to develop loaders and plugins to bring tasks from run time to build time
