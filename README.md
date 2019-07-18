## My experiment on cloudstan

This is just an experiment on cloudstan I threw together in about 2 days time. Any suggestions, comments, issues, etc. are very welcome.

This is built using 
- [this boilerplate by Madhums](https://github.com/madhums/node-express-mongoose) for Node, Express & Mongoose that comes with solutions for log in, sessions, mongodb database, templating engine etc.
- [Codemirror](https://codemirror.net/) for the code and data editors with syntax highlighting
- [Chart.js](https://www.chartjs.org/) for charting
- [d3.Array](https://github.com/d3/d3-array) for processing sampling arrays (the plan is to switch to [d3.js](https://d3js.org/) for all visualization and data processing on the users side)
- [httpstan](https://github.com/stan-dev/httpstan) to compile and run Stan models


(17.7.2019) The web app support logging in with your Github account but I switched it off for the time being as there were issues with the callback URL when migrating to Heroku.

## Usage

Set the appropriate environment variables that are listed in .env.example and then run the following:

    git clone 
    cd 
    npm install
    cp .env.example .env
    npm start

## Docker

The docker development hasnt been tested fully. Proceed with caution.

You can also use docker for development. Make sure you run npm install on your host machine so that code linting and everything works fine.

```sh
npm i
cp .env.example .env
```

Start the services

```sh
docker-compose up -d
```

View the logs

```sh
docker-compose logs -f
```

In case you install a npm module while developing, it should also be installed within docker container, to do this first install the module you want with simple `npm i module name`, then run it within docker container

```sh
docker-compose exec node npm i
```

If you make any changes to the file, nodemon should automatically pick up and restart within docker (you can see this in the logs)

To run tests

```sh
docker-compose exec -e MONGODB_URL=mongodb://mongo:27017/noobjs_test node npm test
```

Note that we are overriding the environment variable set in `.env` file because we don't want our data erased by the tests.

Note: The difference between exec and run is that, exec executes the command within the running container and run will spin up a new container to run that command. So if you want to run only the tests without docker-compose up, you may do so by running `docker-compose run -e MONGODB_URL=mongodb://mongo:27017/my_app_test node npm test`

## License

MIT
