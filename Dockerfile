FROM ubuntu

ENV NODE_VERSION 14
ENV INSTALL_PATH /app

RUN apt-get update -qq && apt-get install -y curl wget

RUN curl -sL https://deb.nodesource.com/setup_$NODE_VERSION.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt install nodejs

RUN mkdir -p $INSTALL_PATH

RUN npm install -g ganache-cli
RUN npm install -g truffle

RUN wget https://dist.ipfs.io/kubo/v0.14.0/kubo_v0.14.0_linux-amd64.tar.gz
RUN tar -xvzf kubo_v0.14.0_linux-amd64.tar.gz
RUN cd kubo && bash install.sh

WORKDIR $INSTALL_PATH

RUN mkdir -p $INSTALL_PATH

WORKDIR $INSTALL_PATH

COPY package*.json ./

RUN npm install

COPY . $INSTALL_PATH

RUN chmod 700 entrypoint.sh

EXPOSE 8545
EXPOSE 5001
EXPOSE 8080

ENTRYPOINT ["sh", "entrypoint.sh"]
