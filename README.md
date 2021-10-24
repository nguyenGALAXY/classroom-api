## Set up

#### Install `win-node-env` to run script with environment

```
npm install -g win-node-env
```

#### Run below command to migrate database

```
yarn sequelize db:migrate
```

## Script use in development

#### Generate skeleton migration file

```
yarn sequelize migration:generate --name {file name}
```

#### Database script

```
yarn sequelize db:migrate:undo  # undo latest migration
yarn sequelize db:migrate:undo:all  # undo all migrations
```
