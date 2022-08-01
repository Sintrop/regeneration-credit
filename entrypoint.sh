#!/usr/bin/env sh

ipfs init
ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080
ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001
ipfs daemon &

ganache-cli -a 5 -e 200 -h 0.0.0.0
