FROM ubuntu

ARG DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION 20
ENV INSTALL_PATH /app

RUN apt-get update -qq && apt-get install -y curl wget python3 python3-pip

# RUN pip3 install diligence-fuzzing

RUN curl -sL https://deb.nodesource.com/setup_$NODE_VERSION.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt install -y nodejs

RUN mkdir -p $INSTALL_PATH

RUN npm install -g ganache-cli

RUN wget https://dist.ipfs.io/kubo/v0.14.0/kubo_v0.14.0_linux-amd64.tar.gz
RUN tar -xvzf kubo_v0.14.0_linux-amd64.tar.gz
RUN cd kubo && bash install.sh

WORKDIR $INSTALL_PATH

RUN mkdir -p $INSTALL_PATH

WORKDIR $INSTALL_PATH

COPY package*.json ./

RUN npm install

COPY . $INSTALL_PATH

EXPOSE 8646
EXPOSE 5001
EXPOSE 8080
