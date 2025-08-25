# Regeneration Credit
Regeneration Credit Core Contracts

## Project introduction 

The Regeneration Credit is a (P2P) funding system designed to incentivize the regeneration of ecosystems. Humanity has been destroying nature for centuries, and our survival depends on bringing life back to Earth. The problem is that people currently have more economic incentives to deforest an area and exploit its natural resources than to regenerate it. The project aims to create an additional income for people who are regenerating ecosystems, so they can sell the digital representation of their impact in exchange for new tokens after going through a decentralized certification method.

To understand better, read the _whitepaper_ before start contributing. Developers must read this document before starting to participate to understand the project.

## Getting Started

New developers that want to fight for Nature are very welcome and needed.
Before you start contributing, familiarize yourself with the Regeneration Credit sofware.

## Get Core

You can download and run the front-end core implementation. Dowload the latest version at:

https://github.com/Sintrop/regeneration-credit-core/releases

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
