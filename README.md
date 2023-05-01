[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://dcbadge.vercel.app/api/server/2wuU9ym6fq?style=flat)](https://discord.gg/2wuU9ym6fq)

# Calendar Application on Arweave using HollowDB, Next.js, & Fullcalendar

A permanent calendar application using whitelisted version of [HollowDB](https://github.com/firstbatchxyz/HollowDB), [Next.js](https://nextjs.org/) and [Fullcalendar](https://fullcalendar.io/) living on the [Arweave](https://www.arweave.org/) blockchain.

Metamask and Arweave.app wallets are supported, users can deploy HollowDB contracts and create events using Fullcalendar while storing the events on the HollowDB contract with both wallets.

Check out the [live demo](https://hollowdb-nextjs-calendar.vercel.app/).

## Configuration

HollowDB contracts are deployed using the source transaction of another hollowdb contract instead of deploying the whole code.

## Installation

1. Clone the project to your local, install the dependencies

```bash
git clone https://github.com/firstbatchxyz/hollowdb-nextjs-calendar.git
cd hollowdb-nextjs-calendar
# install using NPM or Yarn
npm install
# or
yarn
```

2. Start the local app

```bash
yarn dev
```

## Help

If you have any questions related to this demo or HollowDB, join our [Discord](https://discord.gg/2wuU9ym6fq) channel.
