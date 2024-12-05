# Regeneration Credit
Regeneration Credit Core Contracts

## Project introduction 
Our goal is to create a P2P funding system to regenerate the world. We are bulding a community of people to fight for this cause.  

To understand better, read our _whitepaper_ before start contributing.

It is imperative that all developers read this document before starting to participate.

## Getting Started

New contributors that want to fight for Nature are very welcome and needed.
Before you start contributing, familiarize yourself with the Regeneration Credit sofware.

## How to contribute
You can contribute:

- Testing the code
- Auditing the code
- Reviewing the code
- Optimizing the code

## Commits and Pull Requests Rules
Each Pull Request must be associated with an existing issue. Each Pull Request must change only necessary lines and in case that you want to implement a different feature, open a new issue.

To commit files, create a new branch with the issue that is being solved. 
Example:
issue75-add-new-contract

To open a PR, associate it to the properly issue and select at least 2 other developers to review the code.
Before it, make sure that all tests are passing.

## How to run locally the contracts
To run the project and start contributing please follow the tutorial:

### Pre-requisites

Docker installed

### Run with the docker

1) Build the container

```
docker-compose up -d
```

2) Run the container

```
docker exec -it SINTROP-APP bash
```

### Deploy on localhost

1) Set up local node

```
npx hardhat node
```

2) Deploy on localhost

```
npm run deploy:localhost
```

### Run test units

```
npx hardhat test
npx hardhat test test/RegenerationCredit.test.js
```
